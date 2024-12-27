import { camelCase, trim, upperFirst } from "lodash-es";

export const ENTRY_NAME_DEFAULT = 'ku'

export function getNameOfBase(name?: string, fallback: string = ENTRY_NAME_DEFAULT): string {
  name = trim(name)
  return name || fallback
}

export function getNameOfKey(name?: string) {
  const base = upperFirst(camelCase(getNameOfBase(name)))
  return `${base}Key`
}

export function getNameOfKeyMeta(name?: string) {
  return `${getNameOfKey(name)}Meta`
}
