
interface Try {
  1: 'ABC'
  '2': "ACB"
}

type TryKey = keyof Try

const a: TryKey = undefined

function r(a: TryKey) {

}
