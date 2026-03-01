import inquirer from 'inquirer'
import bcrypt from 'bcrypt'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs'
import { setConfig, logEvent } from '../config/store.js'
import { removeService } from '../docker/manager.js'
import { generateCompose, generateNginxConf } from '../docker/compose.js'
import { CONFIG_DIR } from '../config/defaults.js'
import { IS_WINDOWS, checkDocker, configureFirewall, installAutostart } from '../platform/index.js'

export async function runWizard(): Promise<void> {
  console.log(chalk.hex('#c8ff00').bold('\n  SOTIKI Deploy — Setup Wizard\n'))

  const dockerCheck = ora('Checking Docker...').start()
  const docker = await checkDocker()
  if (!docker.available) {
    dockerCheck.fail(chalk.red('Docker not available: ' + docker.error))
    console.log(chalk.gray(IS_WINDOWS
      ? '  → https://www.docker.com/products/docker-desktop'
      : '  → https://docs.docker.com/engine/install/'
    ))
    process.exit(1)
  }
  dockerCheck.succeed(`Docker ${docker.version}`)
  console.log()

  const answers = await inquirer.prompt<{
    serverType: 'storage' | 'rating' | 'news'
    domain: string
    port: number
    uiPort: number
    password: string
    sslEnabled: boolean
    sslEmail: string
    maxDbSizeGb: number
    messageRetentionDays: number
    isPublic: boolean
    country: string
    description: string
    setupFirewall: boolean
    setupAutostart: boolean
    useStubImage: boolean
  }>([
    {
      type: 'list', name: 'serverType', message: 'Server type:',
      choices: [
        { name: 'Storage  — stores encrypted messages', value: 'storage' },
        { name: 'Rating   — aggregates server ratings',  value: 'rating' },
        { name: 'News     — distributes protocol updates', value: 'news' },
      ],
    },
    { type: 'input',  name: 'domain',   message: 'Domain or IP:', default: 'localhost',
      validate: (v: string) => v.trim().length > 0 || 'Cannot be empty' },
    { type: 'number', name: 'port',     message: 'Server port:', default: 3000 },
    { type: 'number', name: 'uiPort',   message: 'Web UI port:', default: 8080 },
    { type: 'password', name: 'password', message: 'Web UI password:', mask: '*',
      validate: (v: string) => v.length >= 8 || 'Min 8 characters' },
    { type: 'confirm', name: 'sslEnabled', message: "Configure SSL (Let's Encrypt)?", default: false,
      when: a => a.domain !== 'localhost' && !IS_WINDOWS },
    { type: 'input', name: 'sslEmail', message: 'Email for SSL cert:', when: a => !!a.sslEnabled },
    { type: 'number', name: 'maxDbSizeGb', message: 'Max DB size (GB):', default: 10,
      when: a => a.serverType === 'storage' },
    { type: 'number', name: 'messageRetentionDays', message: 'Message retention days (0 = forever):', default: 0,
      when: a => a.serverType === 'storage' },
    { type: 'confirm', name: 'isPublic',  message: 'Add to public registry?', default: false },
    { type: 'input',   name: 'country',   message: 'Country code (e.g. DE):', when: a => a.isPublic },
    { type: 'input',   name: 'description', message: 'Server description:', when: a => a.isPublic },
    { type: 'confirm', name: 'setupFirewall', default: true,
      message: IS_WINDOWS ? 'Configure Windows Firewall?' : 'Configure UFW?' },
    { type: 'confirm', name: 'setupAutostart', default: true,
      message: IS_WINDOWS ? 'Install as Windows Service?' : 'Install systemd service?' },
    { type: 'confirm', name: 'useStubImage', default: true,
      message: chalk.yellow('Use stub image (nginx:alpine) instead of real sotiki image?') },
  ])

  console.log()
  const passwordHash = await bcrypt.hash(answers.password, 12)
  const rollback: Array<() => Promise<void>> = []

  try {
    const s1 = ora('Saving config...').start()
    setConfig({
      serverType:           answers.serverType,
      domain:               answers.domain,
      port:                 answers.port,
      uiPort:               answers.uiPort,
      uiPasswordHash:       passwordHash,
      sslEnabled:           answers.sslEnabled ?? false,
      sslEmail:             answers.sslEmail ?? '',
      maxDbSizeGb:          answers.maxDbSizeGb ?? 10,
      messageRetentionDays: answers.messageRetentionDays ?? 0,
      isPublic:             answers.isPublic,
      country:              answers.country ?? '',
      description:          answers.description ?? '',
      useStubImage:         answers.useStubImage,
    })
    rollback.push(async () => { setConfig({ serverType: undefined as unknown as 'storage' }) })
    s1.succeed('Config saved')

    const s2 = ora('Writing deployment files...').start()
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
    fs.writeFileSync(`${CONFIG_DIR}/docker-compose.yml`, generateCompose(answers))
    fs.writeFileSync(`${CONFIG_DIR}/nginx.conf`,         generateNginxConf(answers))
    rollback.push(async () => { await removeService(answers.serverType).catch(() => undefined) })
    s2.succeed('Files written')

    if (answers.setupFirewall) {
      const s3 = ora('Configuring firewall...').start()
      await configureFirewall(answers.port)
      s3.succeed('Firewall configured')
    }

    if (answers.setupAutostart) {
      const s4 = ora('Installing autostart...').start()
      await installAutostart()
      s4.succeed('Autostart installed')
    }

    logEvent('info', 'deploy', 'Init completed')
    console.log()
    console.log(chalk.hex('#c8ff00').bold('  ✓ Done! Run: ') + chalk.white.bold('sotiki-deploy start'))
    console.log()
  } catch (err) {
    console.error(chalk.red('\n  ✗ Failed:'), String(err))
    for (const fn of rollback.reverse()) await fn().catch(() => undefined)
    logEvent('error', 'deploy', `Init failed: ${String(err)}`)
    process.exit(1)
  }
}