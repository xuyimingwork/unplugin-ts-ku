import { createUnplugin, UnpluginFactory } from 'unplugin'
import { Options } from './core/type'
import { Context } from './core/context'
import { PACKAGE_NAME } from './core/static'

const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const ctx = new Context(options)
  return { 
    name: PACKAGE_NAME,
    vite: {
      configResolved(config) {
        ctx.setRoot(config.root)
        ctx.refresh()
      },
      configureServer(server) {
        server.watcher.on('unlink', (path) => ctx.refresh(path, 'delete'))
        server.watcher.on('change', (path) => ctx.refresh(path, 'update'))
        server.watcher.on('add', (path) => ctx.refresh(path, 'create'))
      }
    }
  }
}

const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin