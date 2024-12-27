import { ArrayOrItem, InterfaceProperty } from "../type";
import { createMetaInterface } from "./node-meta";
import { getNameOfBase } from "../name";
import { print } from "./print-utils";
import ts from 'typescript'
const factory = ts.factory

/**
 * 不同的 name，不同的 module，ok
 * 相同的 name，不同的 module，ok
 * 相同的 module，不同的 name，ok
 * 相同的 name，相同的 module，ok
 * - 合并 property
 * 
 * 合并 module 合并 name
 */
export function getPrintMetaPatch(options: ArrayOrItem<{
  // 根文件相与当前文件的相对位置
  root: string,
  name?: string,
  properties?: InterfaceProperty[]
}>) {
  const _raw = Array.isArray(options) ? options : [options]

  // 去除重复处理
  const raw = _raw.reduce((result, item) => {
    const { properties } = item
    // 无 properties 情况下没必要生成 patch，无意义
    if (!Array.isArray(properties) || !properties.length) return result
    if (!result.find(i => i.root === item.root)) result.push({ root: item.root, items: [] })
    const target = result.find(i => i.root === item.root)
    const name = getNameOfBase(item.name)
    if (!target.items.find(i => i.name === name)) target.items.push({ name, properties: [] })
    const targetItem = target.items.find(i => i.name === name)
    targetItem.properties.push(...properties)
    return result
  }, []).filter(({ items }) => items.length)

  if (!raw.length) return ''

  const declarations = [
    // import module
    ...raw.map(({ root }) => factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createStringLiteral(root),
      undefined
    )),
    // declare module
    ...raw.map(({ root, items }) => factory.createModuleDeclaration(
      [factory.createToken(ts.SyntaxKind.DeclareKeyword)],
      factory.createStringLiteral(root),
      factory.createModuleBlock(
        items.map(({ name, properties }) => createMetaInterface(name, properties)
      )
    )))
  ]
  return print(declarations)
}