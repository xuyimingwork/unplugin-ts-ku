import { ResolvedEntry, ResolvedOptions } from "../types";
import { FILE_NAME_TYPES, getKeyGetConfigByFunctionName, getKeyTypeName } from "./code/name";
import { createCode } from "./code/shared";
import ts from 'typescript'
const factory = ts.factory

export function createCodeSample(entry: Partial<ResolvedEntry>, options?: { alias?: { replacement: string, find: string } }) {
  const NAME_KEY_TYPE = getKeyTypeName(entry.name)
  const outDir = options.alias && entry.outDir.startsWith(options.alias?.replacement) 
    ? entry.outDir.replace(options.alias.replacement, options.alias.find)
    : '.'
  const NAME_KEY_GET_CONFIG_BY_FUNCTION = getKeyGetConfigByFunctionName(entry.name)
  const PATH_TYPE = `${outDir}/${FILE_NAME_TYPES.replace(/\.d\.ts$/, '')}`

  return createCode([
    factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier(NAME_KEY_TYPE)
        )])
      ),
      factory.createStringLiteral(PATH_TYPE),
      undefined
    ),
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration(
          factory.createIdentifier("modules"),
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createMetaProperty(
                ts.SyntaxKind.ImportKeyword,
                factory.createIdentifier("meta")
              ),
              factory.createIdentifier("glob")
            ),
            undefined,
            [factory.createArrayLiteralExpression(
              entry.globs.map(glob => {
                
                factory.createStringLiteral(glob)
              }),
              false
            )]
          )
        )],
        ts.NodeFlags.Const | ts.NodeFlags.Constant | ts.NodeFlags.Constant
      )
    ),
    factory.createFunctionDeclaration(
      undefined,
      undefined,
      factory.createIdentifier("resolveModuleKeyFrom"),
      undefined,
      [factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier("key"),
        undefined,
        factory.createTypeReferenceNode(
          factory.createIdentifier(NAME_KEY_TYPE),
          undefined
        ),
        undefined
      )],
      factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword,
        factory.createTypeQueryNode(
          factory.createIdentifier("modules"),
          undefined
        )
      ),
      factory.createBlock(
        [
          factory.createExpressionStatement(factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("console"),
              factory.createIdentifier("log")
            ),
            undefined,
            [
              factory.createStringLiteral("从 key 中解析出 modules key"),
              factory.createIdentifier("key"),
              factory.createIdentifier("modules")
            ]
          )),
          factory.createReturnStatement(factory.createIdentifier("key"))
        ],
        true
      )
    ),
    factory.createFunctionDeclaration(
      [factory.createToken(ts.SyntaxKind.ExportKeyword)],
      undefined,
      factory.createIdentifier(NAME_KEY_GET_CONFIG_BY_FUNCTION),
      undefined,
      [factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier("key"),
        undefined,
        factory.createTypeReferenceNode(
          factory.createIdentifier(NAME_KEY_TYPE),
          undefined
        ),
        undefined
      )],
      undefined,
      factory.createBlock(
        [
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
              [factory.createVariableDeclaration(
                factory.createIdentifier("moduleKey"),
                undefined,
                undefined,
                factory.createCallExpression(
                  factory.createIdentifier("resolveModuleKeyFrom"),
                  undefined,
                  [factory.createIdentifier("key")]
                )
              )],
              ts.NodeFlags.Const | ts.NodeFlags.Constant | ts.NodeFlags.Constant
            )
          ),
          factory.createIfStatement(
            factory.createPrefixUnaryExpression(
              ts.SyntaxKind.ExclamationToken,
              factory.createParenthesizedExpression(factory.createBinaryExpression(
                factory.createIdentifier("moduleKey"),
                factory.createToken(ts.SyntaxKind.InKeyword),
                factory.createIdentifier("modules")
              ))
            ),
            factory.createReturnStatement(factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("Promise"),
                factory.createIdentifier("resolve")
              ),
              undefined,
              []
            )),
            undefined
          ),
          factory.createReturnStatement(factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createCallExpression(
                factory.createElementAccessExpression(
                  factory.createIdentifier("modules"),
                  factory.createIdentifier("moduleKey")
                ),
                undefined,
                []
              ),
              factory.createIdentifier("then")
            ),
            undefined,
            [factory.createArrowFunction(
              undefined,
              undefined,
              [factory.createParameterDeclaration(
                undefined,
                undefined,
                factory.createIdentifier("res"),
                undefined,
                undefined,
                undefined
              )],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              factory.createBlock(
                [
                  factory.createExpressionStatement(factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("console"),
                      factory.createIdentifier("log")
                    ),
                    undefined,
                    [
                      factory.createStringLiteral("res"),
                      factory.createIdentifier("res")
                    ]
                  )),
                  factory.createReturnStatement(factory.createIdentifier("res"))
                ],
                true
              )
            )]
          ))
        ],
        true
      )
    )
  ])
}