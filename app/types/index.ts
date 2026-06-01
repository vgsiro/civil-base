export interface Subject {
  id: string
  name: string
  code: string
  category: string
  color: string
}

export interface Section {
  id: string
  name: string
  subject_id: string
  section_type: 'notes' | 'formula' | 'mindmap' | null
}

export interface MindMapNode {
  id: string
  label: string
  description: string
  lec: number | null
  page: number | null
  children: MindMapNode[]
}

export interface MindMap {
  id: string
  section_id: string
  pdf_id: string
  title: string
  nodes: MindMapNode[]
  created_at: string
  updated_at: string
}

export interface LectureMindMap {
  lecNumber: number
  pdfId: string
  pdfName: string
  pdfUrl: string
  map: MindMap | null
}

export interface Pdf {
  id: string
  name: string
  section_id: string
  pages: number
  file_url: string
  file_type: 'pdf' | 'image'
}

export interface Formula {
  id: string
  section_id: string
  name: string
  content: string
  images: string[]
  created_at: string
  updated_at: string
}

export interface SearchResult {
  id: string
  page_number: number
  heading: string
  content: string
  pdfs: {
    name: string
    file_url: string
    sections: {
      name: string
      subjects: { name: string }
    }
  }
}

export interface UploadQueueItem {
  name: string
  progress: number
  msg: string
  done: boolean
  error: boolean
}

export interface ChatSource {
  type: 'pdf' | 'formula'
  name: string
  page?: number
  pdf_id?: string
  section_id?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  model?: string
  sources?: ChatSource[]
}

export interface ChatSession {
  id: string
  scope: string
  scope_name: string
  updated_at: string
}

export interface StorageInfo {
  usedMB: string
  limitGB: string
  percent: number
  fileCount: number
}

export interface RenameState {
  type: 'subject' | 'section'
  id: string
  name: string
  code?: string
  category?: string
}
