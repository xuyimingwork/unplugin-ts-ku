import TsKu from 'unplugin-ts-ku/vite'

export default {
  plugins: [
    TsKu({
      entry: [
        {
          name: 'app-img',
          output: 'src/img.d.ts',
          globs: ['**/*.public.png'],
          skipContent: true,
          resolver({ file }) {
            return file.replace('.public', '')
          }
        },
        {
          name: 'try',
          output: 'src/try.d.ts',
          globs: ['**/*.try.json'],
          resolver({ file }) {
            return 'try'
          }
        },
      ]
    })
  ]
}