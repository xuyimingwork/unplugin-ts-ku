import { relative } from "path"

export function getPathRelativeOrAbsoluteAlia(pathAbsolute, relativeToPath, alias?: { replacement: string, find: string }) {
  const pathAbsoluteAlia = alias && pathAbsolute.startsWith(alias.replacement) 
    ? pathAbsolute.replace(alias.replacement, alias.find)
    : undefined
  const pathRelative = relative(pathAbsolute, relativeToPath)
  return pathAbsoluteAlia || pathRelative
}