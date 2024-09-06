import ts, { Node } from 'typescript'
const factory = ts.factory
import { createCode } from "./code/shared";
import { getKeyDataInterfaceName, getKeyTypeName } from './code/name';

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