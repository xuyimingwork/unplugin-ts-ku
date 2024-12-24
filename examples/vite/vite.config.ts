import JsonMapx from 'json-mapx/vite'
import { basename, dirname, resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    JsonMapx({
      entry: [
        {
          name: 'try',
          globs: ['**/*.try.json'],
          resolver({ file, content }) {            
            return {
              key: file,
              output: resolve(dirname(file), `${basename(file, '.json')}.d.ts`)
            }
          }
        },
        {
          name: 'api',
          globs: ['**/*.api.json'],
          resolver({ file, content }) {
            return {
              key: file
            }
          }
        }
      ]
    })
  ]
})