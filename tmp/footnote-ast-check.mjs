import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFootnotes from 'remark-footnotes'

const md = 'Text[^1] continues.\n\n[^1]: The footnote definition text with a [link](https://example.com).\n'

async function run(name, plugins) {
  try {
    const processor = unified().use(remarkParse)
    for (const p of plugins) processor.use(p)
    const tree = processor.parse(md)
    console.log('==================================================')
    console.log('CASE:', name)
    console.log('plugins:', plugins.map((p) => p.name || 'anon').join(', '))
    console.log(JSON.stringify(tree, null, 2))
  } catch (e) {
    console.log('==================================================')
    console.log('CASE:', name, '-> THREW:', e && e.message)
  }
}

await run('gfm only', [remarkGfm])
await run('footnotes only', [remarkFootnotes])
await run('gfm + footnotes (app order)', [remarkGfm, remarkFootnotes])
await run('footnotes + gfm', [remarkFootnotes, remarkGfm])
