import ts, { Node } from 'typescript'
const factory = ts.factory

export function print(elements: Node[]) {
  const printer = ts.createPrinter({ 
    newLine: ts.NewLineKind.LineFeed,
  })
  return printer.printList(
    ts.ListFormat.MultiLine, 
    factory.createNodeArray(elements),
    ts.createSourceFile('', '', ts.ScriptTarget.ES2015)
  )
}