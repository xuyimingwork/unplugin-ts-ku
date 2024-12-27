import { readFile } from "node:fs/promises";
import { query as fg, match as _match } from "./globs";
import { ResolvedOptionEntry } from "./type";
import { difference, property } from "lodash-es";
import { getPrintRoot } from "./code/print-root";
import { getPrintMetaPatch } from "./code/print-meta-patch";
import { dirname, relative } from "node:path";

export function query(entry: ResolvedOptionEntry, { root }: { root: string }): Promise<{ type: 'root' | 'patch', output: string, options?: any }[]> {
  return queryMeta(entry, { root })
    .then(results => {
      const inRootProperties = results.filter(item => item.output === entry.output)
        .map(item => ({ key: item.key, value: item.value }))
        .flat()
      const inPatchItems = results.filter(item => item.output !== entry.output)
        .reduce((result, item) => {
          if (!result.find(i => i.output === item.output)) {
            result.push({ 
              type: 'patch', 
              output: item.output, 
              options: {
                name: entry.names[0],
                root: entry.output,
                properties: []
              } 
            })
          }
          const target = result.find(i => i.output === item.output)
          target.options.properties.push({ key: item.key, value: item.value })
          return result
        }, [])
      return [
        { type: 'root', output: entry.output, options: { name: entry.names[0], properties: inRootProperties } },
        ...inPatchItems
      ]
    })
}

export function queryMeta(entry: ResolvedOptionEntry, { root }: { root: string }) {
  return fg(entry.globs, { cwd: root })
    .then(files => {
      return Promise.all(files.map(file => {
        return readFile(file, 'utf-8')
          .then(content => entry.resolver({ file, content }))
          .then(result => result.map(item => ({ key: item.key, output: item.output, value: file })))
          .catch(() => [])
      })).then(results => results.flat().filter(item => !!item))
    })
}

export function preview(entries: ResolvedOptionEntry[], { root }: { root: string }) {
  return Promise.all(entries.map(entry => {
    return query(entry, { root })
      .then(results => {
        if (!Array.isArray(results) || !results.length) return []
        const [root, ...patches] = results
        return [
          root,
          ...patches.map(patch => ({ deps: [root.output], ...patch }))
        ]
      })
      .catch(() => [])
  }))
    .then(results => results.flat())
    .then(results => {
      // root 在前
      results.sort((a, b) => a.type === b.type ? 0 : a.type === 'root' ? -1 : 1)
      // 去重合并
      return results.reduce((result, item) => {
        if (item.type === 'root') {
          if (!result.find(i => i.type === item.type && i.output === item.output)) result.push({ ...item, options: [] })
          const target = result.find(i => i.type === item.type && i.output === item.output)
          target.options.push(item.options)
        }

        if (item.type === 'patch') {
          // 注：patch 的 output 使用同个 entry 的 root 地址是 ok 的，且会在上一步中合并到 root 中，
          // 但用户侧可能出现使用其它 entry 的 root 作为 patch output 地址，不支持这种情况，忽略该 patch
          if (result.find(i => i.type === 'root' && i.output === item.output)) return result
          if (!result.find(i => i.type === item.type && i.output === item.output)) result.push({ ...item, deps: [], options: [] })
          const target = result.find(i => i.type === item.type && i.output === item.output)
          const deps = difference(item.deps, target.deps)
          target.deps.push(...deps)
          target.options.push(item.options)
        }
        
        return result
      }, [])
    })
    .then(results => {
      return results.map(item => {
        if (item.type === 'root') {
          return {
            file: item.output,
            content: getPrintRoot(item.options.map(option => ({
              ...option,
              properties: option.properties.map(property => ({  
                ...property, 
                value: relative(root, property.value) 
              }))
            })))
          }
        }
        if (item.type === 'patch') {
          return {
            file: item.output,
            deps: item.deps,
            content: getPrintMetaPatch(item.options.map(option => ({ 
              ...option, 
              root: relative(dirname(item.output), option.root),
              properties: option.properties.map(property => ({
                ...property, 
                value: relative(root, property.value) 
              }))
            })))
          }
        }
      }).filter(item => !!item)
    })
}

export function match(path: string, entries: ResolvedOptionEntry[]) {
  if (!path || !Array.isArray(entries) || !entries.length) return false
  if (entries.some(entry => _match(path, entry.globs))) return true
  return false
}

/**
 * // resolver.output === entry.output ? 'root' : 'patch'
 * // but resolver.output may === another entry.output
 * // 如何避免 patch 的 output 属于其它 entry 的 root？
 * // 单 TsKu 实例：OK
 * // 多 TsKu 实例：NEED TODO  单个 entry 场景，无法 多个 TsKu 实例下，如何避免
 * // 回归本质：生成 meta 的 key & value
 * // 多个 entry 生成多个 meta 的 key & value => checked
 * // 一个 entry 生成多个 meta 的 key & value => need think? => checked
 * // 实际场景里，匹配同一批文件，应该允许生成多个 meta（同一 root output）
 * // 多实例
 * one entry => 
 * { 
 *   type: 'root' | 'patch',
 *   output: string,
 *   name: string,
 *   key: string,
 *   value: string,
 * }[]
 */

interface MetaPropertyRootRaw {
  type: 'root',
  output: string,
  name: string,
  key: string,
  value: string,
}

interface MetaPropertyPatchRaw {
  type: 'patch',
  root: string,
  output: string,
  name: string,
  key: string,
  value: string,
}

type MetaPropertyRaw = MetaPropertyRootRaw | MetaPropertyPatchRaw

interface PrePrintRootRaw {
  type: 'root'
  output: string,
  blocks: {
    // name is unique
    name: string,
    properties: { key: string, value: string }[]
  }[]
}

interface PrePrintPatchRaw {
  type: 'patch'
  output: string,
  blocks: {
    // name & root is unique
    name: string,
    root: string,
    properties: { key: string, value: string }[]
  }[]
}

type PrePrintRaw = PrePrintRootRaw | PrePrintPatchRaw

function resolveMetaProperties(entry: ResolvedOptionEntry, { file }: { file: string }): Promise<MetaPropertyRaw[]> {
  return prepareResolverInput(file, { skipContent: entry.skipContent })
    .then(input => entry.resolver(input))
    .then(result => result.map(item => ({
      ...(item.output === entry.output ? {
        // if resolver.output === entry.output, then this item's type is root
        type: 'root',
      }: {
        type: 'patch',
        root: entry.output
      }),
      output: item.output,
      name: item.name,
      key: item.key,
      value: file
    })))
}

function resolvePrePrintItems(entry: ResolvedOptionEntry, { root }: { root: string }): Promise<PrePrintRaw[]> {
  if (!entry) return Promise.resolve([])
  // one entry only output one root file
  return fg(entry.globs, { cwd: root })
    .then(files => Promise.all(files.map(
      file => resolveMetaProperties(entry, { file }).catch(() => [] as MetaPropertyRaw[]))
    )
    .then(results => results.flat().filter(item => !!item)))
    .then(rawMetaProperties => {
      const root: PrePrintRootRaw = { 
        type: 'root', 
        output: entry.output,  
        blocks: entry.names.map(name => ({ name, properties: [] }))
      }
      const patches: PrePrintPatchRaw[] = rawMetaProperties.reduce((patches, item) => {
        const prepareRootBlock = (item: MetaPropertyRaw) => {
          if (root.blocks.find(block => block.name === item.name)) return
          root.blocks.push({ 
            name: item.name, 
            properties: [] 
          })
        }
        const toRoot = (item: MetaPropertyRaw) => {
          const block = root.blocks.find(block => block.name === item.name)
          block.properties.push({ key: item.key, value: item.value })
        }
        const toPatch = (item: MetaPropertyRaw) => {
          const preparePatchBlock = (item: MetaPropertyRaw) => {
            const empty:  PrePrintPatchRaw['blocks'][number] = {
              name: item.name,
              root: root.output,
              properties: []
            }
            const patch = patches.find(patch => patch.output === item.output)
            if  (patch) {
              const block = patch.blocks.find(block => block.name === item.name)
              if (block) return block
              patch.blocks.push(empty)
              return empty
            }
            patches.push({
              type: 'patch',
              output: item.output,
              blocks: [empty]
            })
            return empty
          }
          const block = preparePatchBlock(item)
          block.properties.push({
            key: item.key,
            value: item.value
          })
        }
        // root and patch both need block in root
        prepareRootBlock(item)
        if (item.output === root.output) toRoot(item)
        else toPatch(item)
        return patches
      }, [] as PrePrintPatchRaw[])
      return [root, ...patches]
    })
}

function prepareResolverInput(file: string, { skipContent }: { skipContent: boolean }): Promise<{ file: string, content?: string }> {
  if (skipContent) return Promise.resolve({ file })
  return readFile(file, 'utf-8').then(content => ({ content, file }))
}

function mergePrePrintRootBlocks(a: PrePrintRootRaw['blocks'], b: PrePrintRootRaw['blocks']): PrePrintRootRaw['blocks'] {
  const getBlock = (items: PrePrintRootRaw['blocks'], item: PrePrintRootRaw['blocks'][number]): PrePrintRootRaw['blocks'][number] => {
    const target = items.find(one => one.name === item.name)
    if (target) return target
    const empty: PrePrintRootRaw['blocks'][number] = { name: item.name, properties: [] }
    items.push(empty)
    return empty
  }
  return [...a, ...b].reduce((result, item) => {
    const block = getBlock(result, item)
    block.properties.push(...item.properties)
    return result
  }, [] as PrePrintRootRaw['blocks'])
}

function mergePrePrintPatchBlocks(a: PrePrintPatchRaw['blocks'], b: PrePrintPatchRaw['blocks']): PrePrintPatchRaw['blocks'] {
  const getBlock = (items: PrePrintPatchRaw['blocks'], item: PrePrintPatchRaw['blocks'][number]): PrePrintPatchRaw['blocks'][number] => {
    const target = items.find(one => one.root === item.root && one.name === item.name)
    if (target) return target
    const empty: PrePrintPatchRaw['blocks'][number] = { name: item.name, root: item.root, properties: [] }
    items.push(empty)
    return empty
  }
  return [...a, ...b].reduce((result, item) => {
    const block = getBlock(result, item)
    block.properties.push(...item.properties)
    return result
  }, [] as PrePrintPatchRaw['blocks'])
}

function mergePrePrintItems(items: PrePrintRaw[]): PrePrintRaw[] {
  if (!Array.isArray(items) || !items.length) return []
  // root first, then patch
  items = [...items].sort((a, b) => a.type === b.type ? 0 : a.type === 'root' ? -1 : 1)
  return items.reduce((result, item) => {
    const getRoot = (item: PrePrintRootRaw): PrePrintRootRaw => {
      const root = result.find(root => root.type === item.type && root.output === item.output)
      if (root) return root as PrePrintRootRaw
      const empty: PrePrintRootRaw = { type: 'root', output: item.output, blocks: [] }
      result.push(empty)
      return empty
    }
    const getPatch = (item: PrePrintPatchRaw): PrePrintPatchRaw => {
      const patch = result.find(patch => patch.type === item.type && patch.output === item.output)
      if (patch) return patch as PrePrintPatchRaw
      const empty: PrePrintPatchRaw = { type: 'patch', output: item.output, blocks: [] }
      result.push(empty)
      return empty
    }
    if (item.type === 'root') {
      const root = getRoot(item)
      root.blocks = mergePrePrintRootBlocks(root.blocks, item.blocks)
    } else if (item.type === 'patch') {
      const patch = getPatch(item)
      patch.blocks = mergePrePrintPatchBlocks(patch.blocks, item.blocks)
    }
    return result
  }, [] as PrePrintRaw[])
}

function transformToPrint(items: PrePrintRaw[], { root }: { root: string }): { file: string, content: string, deps?: string[] }[] {
  return items.map(item => {
    if (item.type === 'root') {
      return {
        file: item.output,
        content: getPrintRoot(item.blocks.map(block => ({ 
          name: block.name, 
          properties: block.properties.map(property => ({
            ...property,
            value: relative(root, property.value)
          }))
        })))
      }
    } else if (item.type === 'patch') {
      return {
        file: item.output,
        deps: item.blocks.map(block => block.root),
        content: getPrintMetaPatch(item.blocks.map(block => ({ 
          root: relative(dirname(item.output), block.root),
          name: block.name, 
          properties: block.properties.map(property => ({
            ...property,
            value: relative(root, property.value)
          }))
        })))
      }
    }
  })
  return []
}

export function print(entries: ResolvedOptionEntry[], { root }: { root: string }): Promise<{ file: string, content: string, deps?: string[] }[]> {
  if (!Array.isArray(entries) || !entries.length) return Promise.resolve([])
  return Promise.all(entries.map(entry => resolvePrePrintItems(entry, { root })))
    .then(results => results.flat())
    .then(items => mergePrePrintItems(items))
    .then(items => transformToPrint(items, { root }))
}

/**
 * 1. normalize entries
 * 2. transform entries to files & contents
 * - fetch all matched files
 * - pipe to resolver => key => output
 * - transform all data to file content
 * 3. write files
 */
