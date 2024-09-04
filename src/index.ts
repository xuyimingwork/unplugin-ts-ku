import { createUnplugin, UnpluginFactory } from 'unplugin'

// 通过哪一类 json 文件生成


export interface Options {
  
}

const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  return { 
    name: 'json-asyncx',
    vite: {

    },
    webpack() {

    }
  }
}

const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

export const vitePlugin = unplugin.vite
// export const webpackPlugin = unplugin.webpack