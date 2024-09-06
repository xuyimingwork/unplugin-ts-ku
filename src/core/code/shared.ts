import ts, { Node } from 'typescript'
const factory = ts.factory

export function createInterfaceDeclaration(name: string, properties: Array<{ key: string, value: string }>) {
  return factory.createInterfaceDeclaration(
    undefined,
    factory.createIdentifier(name),
    undefined,
    undefined,
    createInterfacePropertySignatureList(properties)
  )
}

export function createInterfacePropertySignatureList(items: Array<{ key: string, value: string }>) {
  return items.map(item => factory.createPropertySignature(
    undefined,
    factory.createStringLiteral(item.key),
    undefined,
    factory.createLiteralTypeNode(factory.createStringLiteral(item.value))
  ))
}

export function createCode(elements: Node[]) {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const code = printer.printList(
    ts.ListFormat.MultiLine, 
    factory.createNodeArray(elements),
    ts.createSourceFile('', '', ts.ScriptTarget.ES2015)
  )
  return code
}