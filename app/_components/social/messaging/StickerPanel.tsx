'use client'
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface Gif {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function StickerPanel({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<'trending' | 'search'>('trending')
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<Gif[]>([])
  const [loading, setLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchGifs('')
  }, [])

  async function fetchGifs(q: string) {
    setLoading(true)
    const url = q ? `/api/giphy?q=${encodeURIComponent(q)}&limit=20` : `/api/giphy?limit=20`
    const res = await fetch(url)
    const data = await res.json()
    setGifs(data.gifs ?? [])
    setLoading(false)
  }

  function onQueryChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchGifs(val), 400)
  }

  function switchToSearch() {
    setTab('search')
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
      width: 320, background: '#fff', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb',
      overflow: 'hidden', zIndex: 700,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px 0' }}>
        <button
          onClick={() => { setTab('trending'); setQuery(''); fetchGifs('') }}
          style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: tab === 'trending' ? '#e7f3ff' : 'none', color: tab === 'trending' ? '#0084ff' : '#65676b' }}>
          Trending
        </button>
        <button
          onClick={switchToSearch}
          style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: tab === 'search' ? '#e7f3ff' : 'none', color: tab === 'search' ? '#0084ff' : '#65676b' }}>
          Search
        </button>
        <button onClick={onClose}
          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <X size={13} color="#65676b" />
        </button>
      </div>

      {/* Search input */}
      {tab === 'search' && (
        <div style={{ padding: '8px 10px 0', display: 'flex', alignItems: 'center', gap: 6, background: '#f0f2f5', margin: '8px 10px 0', borderRadius: 20, paddingLeft: 12 }}>
          <Search size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search GIFs..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 12, padding: '6px 0', color: '#050505' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); fetchGifs('') }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
              <X size={11} color="#94a3b8" />
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      <div style={{ height: 260, overflowY: 'auto', padding: '6px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {loading && (
          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 12 }}>
            Loading…
          </div>
        )}
        {!loading && gifs.length === 0 && (
          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 12 }}>
            No GIFs found
          </div>
        )}
        {!loading && gifs.map(gif => (
          <button key={gif.id} onClick={() => { onSelect(gif.url); onClose() }}
            title={gif.title}
            style={{ border: 'none', padding: 0, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: '#e2e8f0', height: 100, display: 'block', width: '100%' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
            <img src={gif.preview} alt={gif.title} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>

      {/* Powered by GIPHY */}
      <div style={{ padding: '4px 10px 8px', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
        Powered by GIPHY
      </div>
    </div>
  )
}
