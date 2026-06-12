'use client'
import { useEffect, useRef } from 'react'

interface Props {
  html: string
}

export default function FormulaViewer({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    import('katex').then(({ default: katex }) => {
      if (!ref.current) return

      let rendered = html
      if (html.trim().startsWith('[')) {
        try {
          const blocks = JSON.parse(html)
          if (Array.isArray(blocks)) {
            rendered = blocks.map((b: any) =>
              b.type === 'image'
                ? `<img src="${b.content}" style="max-width:100%;border-radius:6px;margin:8px 0;display:block"/>`
                : `<p style="white-space:pre-wrap;margin:0 0 8px 0">${b.content}</p>`
            ).join('')
          }
        } catch {}
      }

      if (!rendered || rendered === '<br>' || rendered === '<br/>') {
        rendered = '<p style="color:#94a3b8">No content yet.</p>'
      }

      rendered = rendered.replace(/ data-[a-z-]+=["'][^"']*["']/g, '')

      const tmp = document.createElement('div')
      tmp.innerHTML = rendered
      tmp.querySelectorAll('.katex-display').forEach(el => {
        const tex = el.querySelector('annotation')?.textContent?.trim()
        if (tex) el.replaceWith(`$$${tex}$$`)
      })
      tmp.querySelectorAll('.katex').forEach(el => {
        const tex = el.querySelector('annotation')?.textContent?.trim()
        if (tex) el.replaceWith(`$${tex}$`)
      })
      rendered = tmp.innerHTML

      ref.current.innerHTML = rendered

      const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      let n: Node | null
      while ((n = walker.nextNode())) nodes.push(n as Text)
      for (const tn of nodes) {
        const text = tn.textContent || ''
        if (!text.includes('$')) continue
        const span = document.createElement('span')
        span.innerHTML = text
          .replace(/\$\$([^$]+)\$\$/g, (_: string, tex: string) => {
            try { return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }) } catch { return _ }
          })
          .replace(/\$([^$\n]+)\$/g, (_: string, tex: string) => {
            try { return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }) } catch { return _ }
          })
        tn.replaceWith(span)
      }
    })
  }, [html])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div ref={ref} style={{ fontSize: '14px', lineHeight: '1.9', color: '#1e293b', maxWidth: '100%' }} />
    </div>
  )
}
