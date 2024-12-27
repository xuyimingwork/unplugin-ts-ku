import ts from 'typescript'
import { getNameOfKey, getNameOfKeyMeta } from '../name'
const factory = ts.factory

export function createKeyTypeExport(name: string) {
  const nameOfKey = getNameOfKey(name)
  const nameOfKeyMeta = getNameOfKeyMeta(name)

  return factory.createTypeAliasDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    factory.createIdentifier(nameOfKey),
    undefined,
    factory.createTypeOperatorNode(
      ts.SyntaxKind.KeyOfKeyword,
      factory.createTypeReferenceNode(
        factory.createIdentifier(nameOfKeyMeta),
        undefined
      )
    )
  )
}