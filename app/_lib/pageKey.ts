export function derivePageKey(pathname: string, params: URLSearchParams): string {
  if (pathname.includes('/standards')) {
    const parts = ['std']
    const tab = params.get('tab'); if (tab) parts.push(tab)
    const sub = params.get('sub'); if (sub) parts.push(sub)
    const section = params.get('section'); if (section) parts.push(section.replace(/-/g, '_'))
    const calc = params.get('calc'); if (calc) parts.push(calc)
    return parts.join('_')
  }
  return pathname.replace(/^\//, '').replace(/\//g, '_') || 'home'
}
