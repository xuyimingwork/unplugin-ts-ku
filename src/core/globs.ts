import { minimatch } from 'minimatch'
import fg, { Options } from 'fast-glob'

export function match(file, globs: string | string[]): boolean {
  globs = Array.isArray(globs) ? globs : [globs]
  for (const glob of globs) {
    const isNegated = glob.startsWith('!')
    const match = minimatch(file, isNegated ? glob.slice(1) : glob)
    if (match) return !isNegated
  }
  return false
}

export function query(globs: string | string[], options: Partial<Options>) {
  return fg.async(globs, {
    // ignore any node_modules directory
    ignore: ['**/node_modules/**'],
    onlyFiles: true,
    absolute: true,
    ...options
  })
}