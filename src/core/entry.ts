import { readFile } from "node:fs/promises";
import { query as fg } from "./globs";
import { ResolvedOptionEntry } from "./type";
import { difference } from "lodash-es";
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
                name: entry.name,
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
        { type: 'root', output: entry.output, options: { name: entry.name, properties: inRootProperties } },
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