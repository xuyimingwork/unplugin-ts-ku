type EntryResolverOneResult = string | { key: string, output?: string }
type EntryResolver = (params: { file: string, content: string }) => EntryResolverOneResult | Array<EntryResolverOneResult> | undefined

interface Entry {
  // name is Api => ApiKey & ApiKeyData
  name?: string
  // 哪些 json 文件需要纳入匹配生成数据
  globs: string | string[]
  // json 文件如何生成对应的 key 值
  resolver: EntryResolver
  // 生成文件输出路径（相对于 root）
  outDir: string
}

export interface Options {
  // 仅对拓展 index.d.ts 文件时的导入产生影响
  alias?: { find: string, replacement: string },
  entry?: Entry[]
}

export interface ResolvedEntry {
  name?: string
  // 哪些 json 文件需要纳入匹配生成数据
  globs: string[]
  // json 文件如何生成对应的 key 值
  resolver: EntryResolver
  // 生成文件输出路径（相对于 root）
  outDir: string
  // 生成文件
  generate: () => void
}

export interface ResolvedOptions {
  alias?: { find: string, replacement: string },
  entries: ResolvedEntry[]
}