import Docker from 'dockerode'
import { SERVICE_IMAGES, STUB_IMAGE } from '../config/defaults.js'
import { getConfig, logEvent } from '../config/store.js'

export type ServiceName = 'storage' | 'rating' | 'news' | 'postgresql' | 'nginx'

export interface ContainerStatus {
  name:        ServiceName
  status:      'running' | 'stopped' | 'starting' | 'error' | 'inactive'
  uptime:      string
  port:        number | null
  containerId: string | null
}

const docker = new Docker()

function cname(s: ServiceName): string { return `sotiki-${s}` }

function image(s: ServiceName): string {
  if (getConfig().useStubImage) return STUB_IMAGE
  return SERVICE_IMAGES[s] ?? STUB_IMAGE
}

function uptime(startedAt: string): string {
  const s = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${h % 24}h`
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

export async function getStatus(svc: ServiceName): Promise<ContainerStatus> {
  try {
    const info = await docker.getContainer(cname(svc)).inspect()
    const s = info.State
    const port = Object.values(info.NetworkSettings.Ports).flat()[0]?.HostPort
    return {
      name: svc,
      status: s.Running ? 'running' : s.ExitCode !== 0 ? 'error' : 'stopped',
      uptime: s.Running ? uptime(s.StartedAt) : '-',
      port: port ? parseInt(port, 10) : null,
      containerId: info.Id.slice(0, 12),
    }
  } catch {
    return { name: svc, status: 'inactive', uptime: '-', port: null, containerId: null }
  }
}

export async function getAllStatuses(): Promise<ContainerStatus[]> {
  const cfg = getConfig()
  const svcs: ServiceName[] = [cfg.serverType ?? 'storage', 'postgresql', 'nginx']
  return Promise.all(svcs.map(getStatus))
}

export async function startService(svc: ServiceName): Promise<void> {
  logEvent('info', svc, `Starting ${svc}`)
  const name = cname(svc)
  try {
    const info = await docker.getContainer(name).inspect()
    if (!info.State.Running) await docker.getContainer(name).start()
  } catch {
    const cfg = getConfig()
    const img = image(svc)
    await pullIfNeeded(img)
    await docker.createContainer({
      name,
      Image: img,
      Env: buildEnv(svc, cfg),
      ExposedPorts: { '3000/tcp': {} },
      HostConfig: {
        RestartPolicy: { Name: 'unless-stopped' },
        PortBindings: { '3000/tcp': [{ HostPort: String(cfg.port ?? 3000) }] },
      },
    })
    await docker.getContainer(name).start()
  }
  logEvent('info', svc, `${svc} started`)
}

export async function stopService(svc: ServiceName): Promise<void> {
  logEvent('info', svc, `Stopping ${svc}`)
  try {
    await docker.getContainer(cname(svc)).stop({ t: 10 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (!msg.includes('not running') && !msg.includes('no such container')) throw err
  }
  logEvent('info', svc, `${svc} stopped`)
}

export async function removeService(svc: ServiceName): Promise<void> {
  try {
    const c = docker.getContainer(cname(svc))
    await c.stop({ t: 5 }).catch(() => undefined)
    await c.remove()
  } catch {}
}

export async function streamLogs(
  svc: ServiceName,
  onData: (chunk: string) => void,
  tail = 100
): Promise<() => void> {
  const stream = await docker.getContainer(cname(svc)).logs({
    follow: true, stdout: true, stderr: true, tail, timestamps: true,
  })
  docker.modem.demuxStream(
    stream as unknown as NodeJS.ReadableStream,
    { write: (b: Buffer) => onData(b.toString('utf8')) },
    { write: (b: Buffer) => onData(b.toString('utf8')) }
  )
  return () => { try { (stream as unknown as { destroy: () => void }).destroy() } catch {} }
}

async function pullIfNeeded(img: string): Promise<void> {
  try { await docker.getImage(img).inspect(); return } catch {}
  await new Promise<void>((res, rej) => {
    docker.pull(img, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) return rej(err)
      docker.modem.followProgress(stream, (e: Error | null) => e ? rej(e) : res())
    })
  })
}

function buildEnv(svc: ServiceName, cfg: ReturnType<typeof getConfig>): string[] {
  const base = [`SOTIKI_SERVICE=${svc}`, `SOTIKI_DOMAIN=${cfg.domain ?? 'localhost'}`]
  if (svc === 'storage') {
    base.push(`POSTGRES_HOST=sotiki-postgresql`, `MAX_DB_SIZE_GB=${cfg.maxDbSizeGb ?? 10}`)
  }
  return base
}