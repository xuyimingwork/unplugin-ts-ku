import { createCode } from "./shared";
import { isObject } from 'lodash-es';
import { getNameOfBase } from './name';
import { createMetaInterface } from './meta';
import { createKeyTypeExport } from './key';
import { ArrayOrItem, InterfaceProperty } from '../type';

type Options = ArrayOrItem<string | { name?: string, properties?: InterfaceProperty[] }>

export function getPrintRoot(name?: string): string
export function getPrintRoot(options?: { name?: string, properties?: InterfaceProperty[] }): string
export function getPrintRoot(options?: (string | { name?: string, properties?: InterfaceProperty[] })[]): string
export function getPrintRoot(options: Options): string {
  const _raw = Array.isArray(options) ? options : [options]
  const getName = (item?: string | { name?: string }) => {
    const normalize = item => getNameOfBase(item)
    return !item 
      ? normalize(item)
      : typeof item === 'string' 
        ? normalize(item)
        : normalize(item.name)
  }
  const getProperties = (item?: string | { properties?: InterfaceProperty[] }): InterfaceProperty[] => {
    if (!item || !isObject(item) || !Array.isArray(item.properties)) return []
    return item.properties
  }

  // 去除重复处理
  const raw = _raw.reduce((result, item) => {
    const name = getName(item)
    if (!result.find(i => i.name === name)) result.push({ name, properties: [] })
    const target = result.find(i => i.name === name)
    const properties = getProperties(item)
    if (properties.length) target.properties.push(...properties)
    return result
  }, [])

  if (!raw.length) return ''

  const declarations = raw.map(({ name, properties }) => {
    return [
      createKeyTypeExport(name),
      createMetaInterface(name, properties)
    ]
  }).filter(Boolean).flat()

  return createCode(declarations)
}