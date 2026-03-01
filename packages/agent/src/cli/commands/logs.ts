import { Command } from 'commander'
import chalk from 'chalk'
import { getConfig } from '../../config/store.js'
import { streamLogs, type ServiceName } from '../../docker/manager.js'

export const logsCommand = new Command('logs')
  .description('Stream service logs')
  .option('-s, --service <n>', 'Service name')
  .option('-f, --follow', 'Follow output')
  .option('-n, --lines <n>', 'Lines to show', '100')
  .action(async (opts: { service?: string; follow?: boolean; lines: string }) => {
    const svc  = (opts.service ?? getConfig().serverType ?? 'storage') as ServiceName
    const tail = parseInt(opts.lines, 10)
    console.log(chalk.gray(`  Logs: ${chalk.white(svc)}\n`))
    const stop = await streamLogs(svc, c => process.stdout.write(c), tail)
    if (!opts.follow) { await new Promise(r => setTimeout(r, 1000)); stop(); return }
    process.on('SIGINT', () => { stop(); process.exit(0) })
  })