## Usage

Install

```bash
npm i unplugin-ts-ku -D
```

Add it to `vite.config.js`

```js
// vite.config.js
import TsKu from 'unplugin-ts-ku/vite'

export default {
  plugins: [
    TsKu({
      entry: {
        globs: ['**/*.public.png'],
        resolver({ file, content }) {
          return file.replace('.public', '')
        }
      }
    })
  ]
}
```

Then you can use `KuKey` exported from `ku.d.ts` file in root directory.

If you have `src/hello.public.png`, then you can get `src/hello.png` in ts suggestion, like below

```ts
import { KuKey } from '../ku'

function getImage(key: KuKey) {
  // do your logical based on key
}

getImage('src/hello.png')
```

`KuKey` is a string literal union type generated from `entry.resolver`.

## Config

### entry

also support array. eg:

```ts
export default {
  plugins: [
    TsKu({
      entry: [
        {
          globs: ['**/*.public.png'],
          resolver({ file, content }) {
            return file.replace('.public', '')
          }
        },
        {
          globs: ['**/*.api.json'],
          resolver({ file, content }) {
            return file
          }
        }
      ]
    })
  ]
}
```

#### `entry.globs` *required*

config files need to handle, use [`fast-glob`](https://www.npmjs.com/package/fast-glob) inside.

#### `entry.resolver` *required*

config the way to change matched files to ts key. 

- receive:
  - `file` path of matched file
  - `content` content of the file
- return:
  - a `string` for file key
  - a `{ key: string, output?: string }` for key and where key store
  - an `array` contains `string` or `{ key: string, output?: string }` if a file can have multi keys

#### `entry.output` *optional*

config generated file, use `ku.d.ts` if omit.

```ts
export default {
  plugins: [
    TsKu({
      entry: [
        {
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
```

#### `entry.name` *optional*

config type name, use `ku` if omit.

name `img` will generate `ImgKey` and `ImgKeyMeta`

```ts
export default {
  plugins: [
    TsKu({
      entry: [
        {
          name: 'img',
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
```






