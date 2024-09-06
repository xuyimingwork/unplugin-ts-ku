import { createUnplugin, UnpluginFactory } from 'unplugin'
import { minimatch } from 'minimatch'
import { Options } from './types'
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

const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const ctx = new Context(options)
  return { 
    name: 'json-asyncx',
    vite: {
      configResolved(config) {
        ctx.setRoot(config.root)
        console.log('alias', config.resolve.alias)
        ctx.options.entries.forEach(entry => entry.generate())
      },
      configureServer(server) {
        function generateWhenChange(path) {
          ctx.options.entries.forEach((entry) => {
            const matched = matchGlobs(path, entry.globs)
            if (!matched) return
            entry.generate()
          })
        }
        server.watcher.on('unlink', (path) => generateWhenChange(path))
        server.watcher.on('change', (path) => generateWhenChange(path))
        server.watcher.on('add', (path) => generateWhenChange(path))
      }
    },
    webpack() {

    }
  }
}

const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

export const vitePlugin = unplugin.vite
// export const webpackPlugin = unplugin.webpack