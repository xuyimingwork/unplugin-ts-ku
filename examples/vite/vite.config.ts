import JsonMapx from 'json-mapx/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    JsonMapx({
      entry: [
        {
          name: 'api',
          globs: ['**/*.api.json'],
          resolver({ file, content }) {
            return {
              key: 'hello'
            }
          }
        }
      ]
    })
  ]
})