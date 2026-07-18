/* Журналы: import.log, errors.log, not_found.log */
import fs from 'fs'
import path from 'path'

export class Logger {
  constructor(dir) {
    this.dir = dir
    fs.mkdirSync(dir, { recursive: true })
  }
  _write(file, line) {
    fs.appendFileSync(path.join(this.dir, file), `[${new Date().toISOString()}] ${line}\n`)
  }
  info(line)      { this._write('import.log', line) }
  error(slug, e)  { this._write('errors.log', `${slug} :: ${e && e.message ? e.message : e}`) }
  notFound(slug, name) { this._write('not_found.log', `${slug} (${name}) — изображения не найдены`) }
}
