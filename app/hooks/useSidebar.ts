'use client'
import { useState, useRef } from 'react'

export function useSidebar() {
  const [subjectWidth, setSubjectWidth] = useState(260)
  const [sectionWidth, setSectionWidth] = useState(240)
  const [subjectCollapsed, setSubjectCollapsed] = useState(false)
  const [sectionCollapsed, setSectionCollapsed] = useState(false)
  const [subjectPinned, setSubjectPinned] = useState(true)
  const [sectionPinned, setSectionPinned] = useState(true)
  const resizingSidebar = useRef<{ panel: 'subject' | 'section'; startX: number; startW: number } | null>(null)

  const [resizingImg, setResizingImg] = useState<{ el: HTMLImageElement; startX: number; startW: number } | null>(null)

  function onMouseMove(e: React.MouseEvent) {
    if (resizingImg) {
      const newW = Math.max(40, resizingImg.startW + (e.clientX - resizingImg.startX))
      resizingImg.el.style.width = newW + 'px'
      resizingImg.el.style.maxWidth = '100%'
    }
    if (resizingSidebar.current) {
      const dx = e.clientX - resizingSidebar.current.startX
      const newW = Math.max(160, Math.min(480, resizingSidebar.current.startW + dx))
      if (resizingSidebar.current.panel === 'subject') setSubjectWidth(newW)
      else setSectionWidth(newW)
    }
  }

  function onMouseUp() {
    setResizingImg(null)
    resizingSidebar.current = null
  }

  return {
    subjectWidth, sectionWidth,
    subjectCollapsed, setSubjectCollapsed,
    sectionCollapsed, setSectionCollapsed,
    subjectPinned, setSubjectPinned,
    sectionPinned, setSectionPinned,
    resizingSidebar,
    resizingImg, setResizingImg,
    onMouseMove, onMouseUp,
  }
}
