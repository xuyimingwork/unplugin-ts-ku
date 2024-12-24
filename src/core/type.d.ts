export type ArrayOrItem<T> = T | T[]
export interface InterfaceProperty {
  key: string, 
  value: string
}

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

export interface ResolvedOptionEntry {
  name: string
  output: string
  globs: string[]
  resolver: (...args: Parameters<OptionEntryResolver>) => Array<{ key: string, output: string }>
}

export interface ResolvedOptions {
  entries: ResolvedOptionEntry[]
}