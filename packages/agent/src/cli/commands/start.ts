import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { isInitialized, getConfig } from '../../config/store.js'
import { startService, type ServiceName } from '../../docker/manager.js'

export const startCommand = new Command('start')
  .description('Start SOTIKI services')
  .option('-s, --service <name>', 'Service to start (default: all)', 'all')
  .action(async (opts: { service: string }) => {
    if (!isInitialized()) { console.error(chalk.red('  Not initialized. Run: sotiki-deploy init')); process.exit(1) }
    const cfg = getConfig()
    const svcs: ServiceName[] = opts.service === 'all'
      ? [cfg.serverType as ServiceName, 'postgresql', 'nginx']
      : [opts.service as ServiceName]
    for (const svc of svcs) {
      const sp = ora(`Starting ${svc}...`).start()
      try { await startService(svc); sp.succeed(chalk.hex('#c8ff00')(`${svc} started`)) }
      catch (err) { sp.fail(chalk.red(`${svc}: ${String(err)}`)); process.exit(1) }
    }
  })