import ts from 'typescript'
import { createCode } from "./code/shared";
import { getKeyDataInterfaceName, getKeyTypeName } from './code/name';
const factory = ts.factory

export function createCodeIndex(name?: string) {
  const keyDataName = getKeyDataInterfaceName(name)
  const keyName = getKeyTypeName(name)
  return createCode(
    [
      factory.createTypeAliasDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier(keyName),
        undefined,
        factory.createTypeOperatorNode(
          ts.SyntaxKind.KeyOfKeyword,
          factory.createTypeReferenceNode(
            factory.createIdentifier(keyDataName),
            undefined
          )
        )
      ),
      factory.createInterfaceDeclaration(
        undefined,
        factory.createIdentifier(keyDataName),
        undefined,
        undefined,
        []
      ),
    ]
  )
}