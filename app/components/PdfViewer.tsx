'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  url: string
  searchQuery: string
  initialPage: number
}

const PAGE_GAP = 12
const BUFFER = 2 // pages to render outside viewport

export default function PdfViewer({ url, searchQuery, initialPage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const pdfRef = useRef<any>(null)
  const pdfjsRef = useRef<any>(null)
  // Track which pages have been rendered
  const renderedRef = useRef<Set<number>>(new Set())
  const pageWrappersRef = useRef<HTMLDivElement[]>([])
  const renderingRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function loadPdf() {
      setLoading(true)
      renderedRef.current = new Set()
      renderingRef.current = new Set()
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()
      pdfjsRef.current = pdfjsLib
      const pdf = await pdfjsLib.getDocument({
        url,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist/cmaps/',
        cMapPacked: true,
      }).promise
      if (cancelled) return
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)
      setLoading(false)
    }
    loadPdf()
    return () => { cancelled = true }
  }, [url])

  // Build placeholder divs once we know page count
  useEffect(() => {
    if (!totalPages || !containerRef.current || !pdfRef.current) return
    containerRef.current.innerHTML = ''
    pageWrappersRef.current = []
    renderedRef.current = new Set()
    renderingRef.current = new Set()

    // Create placeholder divs with estimated height
    for (let i = 0; i < totalPages; i++) {
      const div = document.createElement('div')
      div.style.position = 'relative'
      div.style.marginBottom = `${PAGE_GAP}px`
      div.style.display = 'flex'
      div.style.justifyContent = 'center'
      // Placeholder height — will resize once rendered
      div.style.minHeight = '800px'
      div.style.background = '#374151'
      pageWrappersRef.current[i] = div
      containerRef.current.appendChild(div)
    }

    // Scroll to initial page
    if (initialPage > 1) {
      let top = 0
      for (let i = 0; i < initialPage - 1; i++) top += 800 + PAGE_GAP
      containerRef.current.scrollTop = top
    }
  }, [totalPages, initialPage])

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfRef.current || !pdfjsRef.current) return
    if (renderedRef.current.has(pageNum)) return
    if (renderingRef.current.has(pageNum)) return
    renderingRef.current.add(pageNum)

    const wrapper = pageWrappersRef.current[pageNum - 1]
    if (!wrapper) return

    const pdf = pdfRef.current
    const pdfjsLib = pdfjsRef.current
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    wrapper.innerHTML = ''
    wrapper.style.minHeight = `${viewport.height}px`

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.display = 'block'
    canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'

    const hlCanvas = document.createElement('canvas')
    hlCanvas.width = viewport.width
    hlCanvas.height = viewport.height
    hlCanvas.style.position = 'absolute'
    hlCanvas.style.top = '0'
    hlCanvas.style.left = '50%'
    hlCanvas.style.transform = 'translateX(-50%)'
    hlCanvas.style.pointerEvents = 'none'

    wrapper.appendChild(canvas)
    wrapper.appendChild(hlCanvas)

    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise

    if (searchQuery.trim()) {
      const textContent = await page.getTextContent()
      const hlCtx = hlCanvas.getContext('2d')!
      hlCtx.clearRect(0, 0, hlCanvas.width, hlCanvas.height)
      const query = searchQuery.toLowerCase()
      for (const item of textContent.items as any[]) {
        if (!item.str?.toLowerCase().includes(query)) continue
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
        hlCtx.save()
        hlCtx.globalAlpha = 0.4
        hlCtx.fillStyle = '#facc15'
        hlCtx.fillRect(tx[4], tx[5] - item.height * scale, item.width * scale, item.height * scale)
        hlCtx.restore()
      }
    }

    renderedRef.current.add(pageNum)
    renderingRef.current.delete(pageNum)
  }, [scale, searchQuery])

  // Determine visible pages and render them + buffer
  const checkVisible = useCallback(() => {
    const container = containerRef.current
    if (!container || !totalPages) return
    const { scrollTop, clientHeight } = container

    let top = 0
    for (let i = 0; i < totalPages; i++) {
      const wrapper = pageWrappersRef.current[i]
      if (!wrapper) { top += 800 + PAGE_GAP; continue }
      const h = wrapper.offsetHeight || 800
      const bottom = top + h
      const visible = bottom > scrollTop - clientHeight * BUFFER && top < scrollTop + clientHeight * (1 + BUFFER)
      if (visible) renderPage(i + 1)
      top = bottom + PAGE_GAP
    }
  }, [totalPages, renderPage])

  // Re-render all on scale/search change
  useEffect(() => {
    if (!totalPages) return
    renderedRef.current = new Set()
    renderingRef.current = new Set()
    // Reset placeholder heights
    pageWrappersRef.current.forEach(div => {
      if (div) { div.innerHTML = ''; div.style.minHeight = '800px' }
    })
    checkVisible()
  }, [scale, searchQuery, totalPages, checkVisible])

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', checkVisible, { passive: true })
    return () => container.removeEventListener('scroll', checkVisible)
  }, [checkVisible])

  // Trigger initial render after placeholders built
  useEffect(() => {
    if (!loading && totalPages) {
      setTimeout(checkVisible, 50)
    }
  }, [loading, totalPages, checkVisible])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', fontSize: '14px' }}>
      Loading PDF...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
        <span style={{ fontSize: '13px', color: '#475569' }}>{totalPages} pages</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
          style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: 'white', color: '#334155' }}>−</button>
        <span style={{ fontSize: '13px', color: '#475569', minWidth: '40px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
          style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: 'white', color: '#334155' }}>+</button>
        <button onClick={() => window.open(url, '_blank')}
          style={{ padding: '4px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: 'white', color: '#334155', fontSize: '13px' }}>
          Open ↗
        </button>
      </div>
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '16px', background: '#475569' }} />
    </div>
  )
}
