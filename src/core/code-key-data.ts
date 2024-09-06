import ts, { Node } from 'typescript'
import { createCode, createInterfaceDeclaration } from './code/shared';
const factory = ts.factory

function createModule(name: string, interfaze: { name: string, properties: Array<{ key: string, value: string }> }) {
  return [
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createStringLiteral(name),
      undefined
    ),
    factory.createModuleDeclaration(
      [factory.createToken(ts.SyntaxKind.DeclareKeyword)],
      factory.createStringLiteral(name),
      factory.createModuleBlock([
        createInterfaceDeclaration(interfaze.name, interfaze.properties)
      ]),
    )
  ];
}

export function createCodeKeyData(moduleName, interfaceNamePrefix: string, interfaceProperties: Array<{ key: string, value: string }>) {
  return createCode(createModule(moduleName, { name: `${interfaceNamePrefix || ''}KeyData`, properties: interfaceProperties }))
}