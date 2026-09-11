import fs from 'node:fs'
import path from 'node:path'
import * as logs from '../logs/index.js'
import * as bus from '../services/index.js'
import { hiddenMarkerPath } from '../paths/index.js'

export const HIDDEN_MARKER = '.pomasa-hidden'

export function isHidden(root) {
  return fs.existsSync(hiddenMarkerPath(root))
}

export function markHidden(root, meta = {}) {
  mkdir(path.dirname(hiddenMarkerPath(root)))
  write(hiddenMarkerPath(root), JSON.stringify({ hiddenAt: Date.now(), ...meta }, null, 2) + '\n', { emit: false })
}

export function read(file, encoding = 'utf8') {
  return fs.readFileSync(file, encoding)
}

export function write(file, content, opts = {}) {
  mkdir(path.dirname(file))
  fs.writeFileSync(file, content)
  if (opts.emit !== false) bus.emit('file.change', { op: 'write', path: file })
  return file
}

export function mkdir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function remove(target, opts = {}) {
  const recursive = opts.recursive !== false
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive, force: true })
  }
  if (opts.emit !== false) bus.emit('file.change', { op: 'remove', path: target })
}

export function rename(from, to) {
  mkdir(path.dirname(to))
  fs.renameSync(from, to)
  bus.emit('file.change', { op: 'rename', from, to })
}

export function catchWrite(scope, fn) {
  return logs.catchLog(scope, fn)
}
