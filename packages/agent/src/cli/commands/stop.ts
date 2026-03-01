import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { isInitialized, getConfig } from '../../config/store.js'
import { stopService, type ServiceName } from '../../docker/manager.js'

export const stopCommand = new Command('stop')
  .description('Stop SOTIKI services')
  .option('-s, --service <n>', 'Service to stop (default: all)', 'all')
  .action(async (opts: { service: string }) => {
    if (!isInitialized()) { console.error(chalk.red('  Not initialized. Run: sotiki-deploy init')); process.exit(1) }
    const cfg = getConfig()
    const svcs: ServiceName[] = opts.service === 'all'
      ? ['nginx', cfg.serverType as ServiceName, 'postgresql']
      : [opts.service as ServiceName]
    for (const svc of svcs) {
      const sp = ora(`Stopping ${svc}...`).start()
      try { await stopService(svc); sp.succeed(chalk.gray(`${svc} stopped`)) }
      catch (err) { sp.fail(chalk.red(`${svc}: ${String(err)}`)) }
    }
  })