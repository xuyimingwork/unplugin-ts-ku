import { createUnplugin, UnpluginFactory } from 'unplugin'
import { minimatch } from 'minimatch'
import { Options } from './core/type'
import { Context } from './core/context'

export function matchGlobs(filepath: string, globs: string[]) {
  for (const glob of globs) {
    const isNegated = glob.startsWith('!')
    const match = minimatch(filepath, isNegated ? glob.slice(1) : glob)
    if (match)
      return !isNegated
  }
  return false
}

const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const ctx = new Context(options)
  return { 
    name: 'json-asyncx',
    vite: {
      configResolved(config) {
        ctx.setRoot(config.root)
        ctx.refresh()
      },
      configureServer(server) {
        function generateWhenChange(path) {
          ctx.options.entries.forEach((entry) => {
            const matched = matchGlobs(path, entry.globs)
            if (!matched) return
            // entry.generate()
          })
        }
        server.watcher.on('unlink', (path) => ctx.refresh(path, 'delete'))
        server.watcher.on('change', (path) => ctx.refresh(path, 'update'))
        server.watcher.on('add', (path) => ctx.refresh(path, 'create'))
      }
    }
  }
}

const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin