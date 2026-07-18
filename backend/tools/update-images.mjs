#!/usr/bin/env node
/* Массовое обновление изображений каталога. Примеры:
     node tools/update-images.mjs --all
     node tools/update-images.mjs --brand "BYD" --dry-run
     node tools/update-images.mjs --missing-images                             */
import { run } from '../src/imageimport/cli.mjs'
process.exit(await run(process.argv.slice(2)))
