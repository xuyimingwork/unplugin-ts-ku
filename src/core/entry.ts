import { readFile } from "node:fs/promises";
import { query as fg } from "./globs";
import { ResolvedOptionEntry } from "./type";

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