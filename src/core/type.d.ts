type ArrayOrItem<T> = T | T[]

export interface OptionEntry {
  name?: string
  output?: string
  globs: ArrayOrItem<string>
  resolver: OptionEntryResolver
}

export interface OptionEntryResolver {
  (params: { file: string, content: string }): void | ArrayOrItem<string | { key: string, output?: string }>
}

export interface Options {
  entry: ArrayOrItem<OptionEntry>
}

export interface ResolvedOptions {
  entries: Array<{
    name: string
    output: string
    globs: string[]
    resolver: OptionEntryResolver
  }>
}