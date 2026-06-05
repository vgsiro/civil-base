import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { searchSiteIndex } from '../lib/siteIndex'
import type { SearchResult, MindMapNode } from '../types'

function flattenNodes(nodes: MindMapNode[], query: string, ancestors: string[] = []): { node: MindMapNode; path: string[] }[] {
  const q = query.toLowerCase()
  const results: { node: MindMapNode; path: string[] }[] = []
  for (const node of nodes) {
    const path = [...ancestors, node.label]
    if (node.label.toLowerCase().includes(q)) results.push({ node, path })
    results.push(...flattenNodes(node.children, query, path))
  }
  return results
}

export function useSearch(isAdmin = false) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [previewResult, setPreviewResult] = useState<SearchResult | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('searchHistory') || '[]') } catch { return [] }
  })
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!searchWrapperRef.current?.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSearch(query: string) {
    setSearchQuery(query)
    setPreviewResult(null)
    if (!query.trim()) { setSearchResults([]); return }

    // Site index — public, available to all users
    const siteResults = searchSiteIndex(query).map(e => ({ ...e, _type: 'site' as const }))

    // Private content — admin only
    if (!isAdmin) {
      setSearchResults(siteResults as any)
      setSearchOpen(true)
      return
    }

    const [{ data: chunks }, { data: formulas }, { data: mindMaps }] = await Promise.all([
      supabase.from('pdf_chunks').select('*, pdfs(name, file_url, sections(name, subjects(name)))')
        .ilike('content', `%${query}%`).order('page_number').limit(40),
      supabase.from('formulas').select('*, sections(name, subject_id, subjects(name))')
        .ilike('name', `%${query}%`).limit(10),
      supabase.from('mind_maps').select('*, sections(id, name, subject_id, subjects(name)), pdfs(name, file_url)')
        .not('nodes', 'is', null),
    ])
    const pdfResults = (chunks || []).map((r: any) => ({ ...r, _type: 'pdf' }))
    const formulaResults = (formulas || []).map((r: any) => ({ ...r, _type: 'formula' }))

    const mindmapResults: any[] = []
    for (const mm of (mindMaps || [])) {
      const matches = flattenNodes(mm.nodes || [], query)
      for (const { node, path } of matches.slice(0, 5)) {
        mindmapResults.push({
          _type: 'mindmap',
          id: `${mm.id}-${node.id}`,
          mapId: mm.id,
          pdfId: mm.pdf_id,
          sectionId: mm.section_id,
          subjectId: mm.sections?.subject_id,
          label: node.label,
          lec: node.lec,
          page: node.page,
          path,
          mapTitle: mm.title,
          pdfName: mm.pdfs?.name,
          sectionName: mm.sections?.name,
          subjectName: mm.sections?.subjects?.name,
        })
      }
    }

    setSearchResults([...siteResults, ...formulaResults, ...mindmapResults.slice(0, 15), ...pdfResults] as any)
    setSearchOpen(true)
  }

  function saveToHistory(query: string) {
    if (!query.trim()) return
    setSearchHistory(prev => {
      const updated = [query, ...prev.filter(h => h !== query)].slice(0, 10)
      localStorage.setItem('searchHistory', JSON.stringify(updated))
      return updated
    })
  }

  function clearHistory() {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  function removeHistoryItem(index: number) {
    setSearchHistory(prev => {
      const updated = prev.filter((_, i) => i !== index)
      localStorage.setItem('searchHistory', JSON.stringify(updated))
      return updated
    })
  }

  return {
    searchQuery, searchResults, previewResult, setPreviewResult,
    searchOpen, setSearchOpen,
    searchHistory, searchWrapperRef, searchInputRef,
    handleSearch, saveToHistory, clearHistory, removeHistoryItem,
  }
}
