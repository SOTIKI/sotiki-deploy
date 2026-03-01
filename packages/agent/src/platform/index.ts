import os from 'os'
import path from 'path'
import fs from 'fs'
import { execSync, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const IS_WINDOWS = process.platform === 'win32'
export const IS_LINUX   = process.platform === 'linux'

export function getConfigDir(): string {
  if (IS_WINDOWS) {
    return path.join(process.env['APPDATA'] ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'sotiki-deploy')
  }
  return isRoot() ? '/etc/sotiki-deploy' : path.join(os.homedir(), '.config', 'sotiki-deploy')
}

export function isRoot(): boolean {
  if (IS_WINDOWS) {
    try { execSync('net session', { stdio: 'ignore' }); return true } catch { return false }
  }
  try { return process.getuid?.() === 0 } catch { return false }
}

export interface DockerStatus {
  available: boolean
  version: string | null
  error: string | null
}

export async function checkDocker(): Promise<DockerStatus> {
  try {
    const { stdout } = await execAsync('docker version --format "{{.Server.Version}}"')
    return { available: true, version: stdout.trim(), error: null }
  } catch (err) {
    return { available: false, version: null, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function configureFirewall(serverPort: number): Promise<void> {
  if (IS_WINDOWS) {
    for (const [name, port] of [['HTTP', 80], ['HTTPS', 443], ['SOTIKI', serverPort]] as [string, number][]) {
      try {
        await execAsync(
          `netsh advfirewall firewall add rule name="SOTIKI-${name}-${port}" dir=in action=allow protocol=TCP localport=${port}`
        )
      } catch {}
    }
  } else {
    for (const port of [80, 443, serverPort]) {
      try { await execAsync(`ufw allow ${port}/tcp`) } catch {}
    }
  }
}

export async function installAutostart(): Promise<void> {
  if (IS_WINDOWS) {
    try {
      const bin = process.execPath
      if (commandExists('nssm')) {
        await execAsync(`nssm install sotiki-deploy "${bin}" ui --no-open`)
        await execAsync(`nssm set sotiki-deploy Start SERVICE_AUTO_START`)
        await execAsync(`nssm start sotiki-deploy`)
      } else {
        await execAsync(
          `reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v "SOTIKI Deploy" /t REG_SZ /d "\\"${bin}\\" ui --no-open" /f`
        )
      }
    } catch {}
  } else {
    try {
      fs.writeFileSync('/etc/systemd/system/sotiki-deploy.service', [
        '[Unit]', 'Description=SOTIKI Deploy Agent', 'After=docker.service', 'Requires=docker.service',
        '', '[Service]', 'Type=simple', 'ExecStart=/usr/bin/sotiki-deploy ui --no-open',
        'Restart=on-failure', 'RestartSec=5',
        '', '[Install]', 'WantedBy=multi-user.target',
      ].join('\n'))
      await execAsync('systemctl daemon-reload')
      await execAsync('systemctl enable sotiki-deploy')
    } catch {}
  }
}

export function toDockerPath(p: string): string {
  if (!IS_WINDOWS) return p
  return p.replace(/^([A-Za-z]):/, (_, d: string) => `/${d.toLowerCase()}`).replace(/\\/g, '/')
}

function commandExists(cmd: string): boolean {
  try { execSync(IS_WINDOWS ? `where ${cmd}` : `which ${cmd}`, { stdio: 'ignore' }); return true } catch { return false }
}