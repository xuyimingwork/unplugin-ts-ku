# unplugin-ts-ku

Generate key from file, then union those keys. 

> name `ku` from key and ts literal union.

Provide `KuKey` and `KuKeyMeta` type as default.

## default generate type file location

- use user side
  - `ku.d.ts` to export `KuKey` and `KuKeyMeta`
- or lib side
  - mean `KuKey` and `KuKeyMeta` provide by lib?

if use lib side, the patch data also need additional user space, but if use user side, default patch can directly in `ku.d.ts`.

`entry.name` should not affect the location of generated type file.

if `entry.output` is omit, the default output always be `ku.d.ts`.







