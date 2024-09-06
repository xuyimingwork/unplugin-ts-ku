import { capitalize, camelCase } from "lodash-es";

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
