import { minimatch } from 'minimatch'

export function match(file, globs: string | string[]) {
  globs = Array.isArray(globs) ? globs : [globs]
  for (const glob of globs) {
    const isNegated = glob.startsWith('!')
    const match = minimatch(file, isNegated ? glob.slice(1) : glob)
    if (match) return !isNegated
  }
  return false
}