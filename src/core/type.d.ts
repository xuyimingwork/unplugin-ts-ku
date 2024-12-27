export type ArrayOrItem<T> = T | T[]
export interface InterfaceProperty {
  key: string, 
  value: string
}

export interface OptionEntry {
  name?: string | string[]
  output?: string
  globs: ArrayOrItem<string>
  skipContent?: boolean,
  resolver: OptionEntryResolver
}

export interface OptionEntryResolver {
  (params: { file: string, content?: string }): void | ArrayOrItem<string | { key: string, output?: string, name?: string }>
}

export interface Options {
  entry: ArrayOrItem<OptionEntry>
}

export interface ResolvedOptionEntry {
  names: string[]
  output: string
  globs: string[]
  skipContent: boolean
  resolver: (...args: Parameters<OptionEntryResolver>) => Array<{ key: string, output: string, name: string }>
}

export interface ResolvedOptions {
  entries: ResolvedOptionEntry[]
}