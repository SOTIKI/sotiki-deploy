import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { VERSION, WEB_UI_HOST, WEB_UI_PORT } from '../config/defaults.js'
import { isInitialized, getConfig } from '../config/store.js'
import { startService, stopService, type ServiceName } from '../docker/manager.js'
import { startServer } from '../server.js'
import { IS_WINDOWS } from '../platform/index.js'
import { initCommand }   from './commands/init.js'
import { startCommand }  from './commands/start.js'
import { stopCommand }   from './commands/stop.js'
import { statusCommand } from './commands/status.js'
import { logsCommand }   from './commands/logs.js'

const program = new Command()

program
  .name('sotiki-deploy')
  .description(chalk.hex('#c8ff00').bold('SOTIKI Deploy') + ' — One command to join the network')
  .version(VERSION)

program.addCommand(initCommand)
program.addCommand(startCommand)
program.addCommand(stopCommand)
program.addCommand(statusCommand)
program.addCommand(logsCommand)

program
  .command('restart')
  .description('Restart services')
  .option('-s, --service <n>', 'Service to restart', 'all')
  .action(async (opts: { service: string }) => {
    if (!isInitialized()) { console.error(chalk.red('  Not initialized')); process.exit(1) }
    const cfg = getConfig()
    const svcs: ServiceName[] = opts.service === 'all'
      ? [cfg.serverType as ServiceName, 'postgresql', 'nginx']
      : [opts.service as ServiceName]
    for (const svc of svcs) {
      const sp = ora(`Restarting ${svc}...`).start()
      await stopService(svc).catch(() => undefined)
      await startService(svc)
      sp.succeed(chalk.hex('#c8ff00')(`${svc} restarted`))
    }
  })

program
  .command('ui')
  .description('Start Web UI')
  .option('--port <n>', 'Port', String(WEB_UI_PORT))
  .option('--no-open', 'Skip browser open')
  .action(async (opts: { port: string }) => {
    if (!isInitialized()) { console.error(chalk.red('  Not initialized')); process.exit(1) }
    const port = parseInt(opts.port, 10)
    await startServer(port, WEB_UI_HOST)
    console.log()
    console.log(chalk.hex('#c8ff00').bold('  SOTIKI Deploy — Web UI'))
    console.log()
    if (IS_WINDOWS) {
      console.log(`  Open: ${chalk.cyan(`http://localhost:${port}`)}`)
    } else {
      console.log(chalk.gray('  Web UI is on 127.0.0.1 — use SSH tunnel to access:'))
      console.log()
      console.log(`  ${chalk.white.bold(`ssh -L ${port}:localhost:${port} user@your-server`)}`)
      console.log()
      console.log(`  Then open: ${chalk.cyan(`http://localhost:${port}`)}`)
    }
    console.log()
    console.log(chalk.gray('  Ctrl+C to stop.\n'))
    process.on('SIGINT', () => process.exit(0))
    await new Promise(() => undefined)
  })

program.parseAsync(process.argv).catch(err => {
  console.error(chalk.red('Error:'), err)
  process.exit(1)
})