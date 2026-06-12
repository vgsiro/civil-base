import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GIPHY_API_KEY!
const BASE = 'https://api.giphy.com/v1/gifs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)

  const endpoint = q
    ? `${BASE}/search?api_key=${API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g&lang=en`
    : `${BASE}/trending?api_key=${API_KEY}&limit=${limit}&rating=g`

  const res = await fetch(endpoint, { next: { revalidate: 60 } })
  if (!res.ok) return NextResponse.json({ error: 'Giphy error' }, { status: res.status })

  const json = await res.json()
  const gifs = (json.data as any[]).map((g: any) => ({
    id: g.id,
    title: g.title,
    url: g.images.fixed_height.url,
    preview: g.images.fixed_height_small.url,
    width: Number(g.images.fixed_height.width),
    height: Number(g.images.fixed_height.height),
  }))

  return NextResponse.json({ gifs })
}
