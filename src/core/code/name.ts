import { capitalize, camelCase } from "lodash-es";

export const ENTRY_NAME_DEFAULT = 'ku'

export const FILE_NAME_TYPES = 'types.d.ts'
export const FILE_NAME_KEY_DATA_DEFAULT = 'key-data.d.ts'

export function getKeyDataInterfaceName(name?: string) {
  return `${getKeyTypeName(name)}Data`
}

export function getKeyTypeName(name?: string) {
  return `${capitalize(camelCase(name))}Key`
}

export function getKeyGetConfigByFunctionName(name) {
  return `get${capitalize(camelCase(name))}ConfigBy`
}

export function getSampleFileName(name?: string) {

}

export function getNameOfBase(name?: string) {
  name = typeof name === 'string' ? (name.trim() || '') : ''
  return name || ENTRY_NAME_DEFAULT
}

export function getNameOfKey(name?: string) {
  const base = capitalize(camelCase(getNameOfBase(name)))
  return `${base}Key`
}

export function getNameOfKeyMeta(name?: string) {
  return `${getNameOfKey(name)}Meta`
}
