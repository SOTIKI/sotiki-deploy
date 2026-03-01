import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { isInitialized } from '../../config/store.js'
import { runWizard } from '../../setup/wizard.js'

export const initCommand = new Command('init')
  .description('Interactive setup wizard')
  .option('--force', 'Re-run even if already initialized')
  .action(async (opts: { force?: boolean }) => {
    if (isInitialized() && !opts.force) {
      const { ok } = await inquirer.prompt<{ ok: boolean }>([{
        type: 'confirm', name: 'ok',
        message: chalk.yellow('Already initialized. Overwrite config?'),
        default: false,
      }])
      if (!ok) { console.log('  Aborted.'); return }
    }
    await runWizard()
  })