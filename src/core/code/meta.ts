import ts from 'typescript'
import { getNameOfKeyMeta } from './name'
import { InterfaceProperty } from '../type'
const factory = ts.factory

export function createMetaInterface(name?: string, properties?: InterfaceProperty[]) {
  // TODO: key 重复场景生成 comment 代码？
  return factory.createInterfaceDeclaration(
    undefined,
    factory.createIdentifier(getNameOfKeyMeta(name)),
    undefined,
    undefined,
    Array.isArray(properties) 
      ? properties.map(item => factory.createPropertySignature(
        undefined,
        factory.createStringLiteral(item.key),
        undefined,
        factory.createLiteralTypeNode(factory.createStringLiteral(item.value))
      ))
      : []
  )
}