import { readFileSync, writeFileSync } from 'fs'

const f = new URL('../dist/cli/index.js', import.meta.url).pathname
const c = readFileSync(f, 'utf8')
if (!c.startsWith('#!')) writeFileSync(f, '#!/usr/bin/env node\n' + c)
