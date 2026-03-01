import { Command } from 'commander'
import chalk from 'chalk'
import Table from 'cli-table3'
import { isInitialized } from '../../config/store.js'
import { getAllStatuses } from '../../docker/manager.js'
import { collectOnce } from '../../metrics/collector.js'
import { VERSION } from '../../config/defaults.js'

const COLOR: Record<string, (s: string) => string> = {
  running:  s => chalk.hex('#c8ff00')(s),
  error:    s => chalk.hex('#ff4444')(s),
  stopped:  s => chalk.hex('#ff4444')(s),
  starting: s => chalk.hex('#ffaa00')(s),
  inactive: s => chalk.hex('#444444')(s),
}

function fmt(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`
}

export const statusCommand = new Command('status')
  .description('Show service status')
  .action(async () => {
    if (!isInitialized()) { console.log(chalk.yellow('  Not initialized. Run: sotiki-deploy init')); return }

    const [services, metrics] = await Promise.all([getAllStatuses(), collectOnce().catch(() => null)])
    const healthy = services.every(s => s.status === 'running')

    console.log()
    console.log(
      `  ${chalk.hex('#c8ff00').bold('SOTIKI Deploy')} ${chalk.gray(`v${VERSION}`)}  ` +
      (healthy ? chalk.hex('#c8ff00')('● operational') : chalk.hex('#ff4444')('● degraded'))
    )
    console.log()

    const t = new Table({
      head: ['Service', 'Status', 'Uptime', 'Port'].map(s => chalk.gray(s)),
      style: { head: [], border: ['gray'] },
    })
    for (const s of services) {
      t.push([
        chalk.white(s.name),
        (COLOR[s.status] ?? (x => x))(`● ${s.status}`),
        chalk.gray(s.uptime),
        s.port ? chalk.cyan(String(s.port)) : chalk.gray('-'),
      ])
    }
    console.log(t.toString())

    if (metrics) {
      console.log(
        `\n  RAM ${chalk.white(fmt(metrics.ramUsed))} / ${fmt(metrics.ramTotal)}` +
        `   CPU ${chalk.white(metrics.cpu + '%')}` +
        `   Disk ${chalk.white(fmt(metrics.diskUsed))} / ${fmt(metrics.diskTotal)}\n`
      )
    }
  })