import JsonMapx from 'json-mapx/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    JsonMapx({
      entry: [
        {
          name: 'api',
          globs: ['src/**/*.api.json'],
          outDir: 'api',
          resolver({ file, content }) {
            console.log('call resolver', file, content)
            return {
              
            }
          }
        }
      ]
    })
  ]
})