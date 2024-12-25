import TsKu from 'unplugin-ts-ku/vite'

export default {
  plugins: [
    TsKu({
      entry: [
        {
          name: 'app-img',
          output: 'src/img.d.ts',
          globs: ['**/*.public.png'],
          resolver({ file, content }) {
            return file.replace('.public', '')
          }
        }
      ]
    })
  ]
}