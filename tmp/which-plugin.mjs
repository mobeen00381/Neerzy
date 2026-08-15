import { gfm } from 'micromark-extension-gfm'
import { footnote } from 'micromark-extension-footnote'
import { combineExtensions } from 'micromark-util-combine-extensions'

function describe(ext) {
  // print tokenizer function names for text[91] (the '[' character)
  const text = ext.text || {}
  const c91 = text[91]
  if (!c91) return '(no text[91])'
  const arr = Array.isArray(c91) ? c91 : [c91]
  return arr.map((c) => c.tokenize?.name || c.tokenize?.toString().slice(0, 60) || '(anon)')
}

console.log('=== combine order: [gfm, footnotes] (app order in page.tsx) ===')
const a = combineExtensions([gfm(), footnote()])
console.log('text[91] tokenizer order:', JSON.stringify(describe(a), null, 2))
console.log('document[91] exists:', !!(a.document && a.document[91]))

console.log()
console.log('=== combine order: [footnotes, gfm] (reversed) ===')
const b = combineExtensions([footnote(), gfm()])
console.log('text[91] tokenizer order:', JSON.stringify(describe(b), null, 2))

console.log()
console.log('=== gfm() alone ===')
console.log(JSON.stringify(describe(combineExtensions([gfm()])), null, 2))
console.log('=== footnote() alone ===')
console.log(JSON.stringify(describe(combineExtensions([footnote()])), null, 2))
