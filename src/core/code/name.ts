import { camelCase, trim, upperFirst } from "lodash-es";

export const ENTRY_NAME_DEFAULT = 'ku'

export const FILE_NAME_TYPES = 'types.d.ts'
export const FILE_NAME_KEY_DATA_DEFAULT = 'key-data.d.ts'

export function getKeyDataInterfaceName(name?: string) {
  return `${getKeyTypeName(name)}Data`
}

export function getKeyTypeName(name?: string) {
  return `${upperFirst(camelCase(name))}Key`
}

export function getKeyGetConfigByFunctionName(name) {
  return `get${upperFirst(camelCase(name))}ConfigBy`
}

export function getSampleFileName(name?: string) {

}

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
