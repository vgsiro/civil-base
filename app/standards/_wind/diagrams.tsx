'use client'

export function DiagramSideWalls({ e, h, d, b }: { e: number; h: number; d: number; b: number }) {
  const W = 320; const H = 180
  const eClamp = Math.min(e, d)
  const e4 = Math.min(eClamp / 4, d)
  const eEnd = Math.min(eClamp, d)
  const e2End = Math.min(2 * eClamp, d)
  const scale = (W - 60) / (d || 1)
  const yTop = 40; const yBot = H - 40; const bH = yBot - yTop
  const xA0 = 30; const xA1 = 30 + e4 * scale
  const xB1 = 30 + eEnd * scale
  const xC1 = Math.min(30 + e2End * scale, W - 30)
  const xD1 = W - 30
  const zones = [
    { label: 'A', x0: xA0, x1: xA1, fill: '#dbeafe', stroke: '#3b82f6' },
    { label: 'B', x0: xA1, x1: xB1, fill: '#fef3c7', stroke: '#f59e0b' },
    { label: 'C', x0: xB1, x1: xC1, fill: '#dcfce7', stroke: '#16a34a' },
    { label: 'D', x0: xA0 - 20, x1: xA0, fill: '#fee2e2', stroke: '#dc2626' },
  ]
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#1e293b" />
        </marker>
      </defs>
      {/* wind arrow */}
      <line x1={4} y1={(yTop+yBot)/2} x2={xA0-2} y2={(yTop+yBot)/2} stroke="#1e293b" strokeWidth={2} markerEnd="url(#arr)" />
      <text x={6} y={(yTop+yBot)/2-6} fontSize={10} fill="#1e293b">Wind</text>
      {/* wall D (windward) */}
      <rect x={xA0-20} y={yTop} width={20} height={bH} fill="#fee2e2" stroke="#dc2626" strokeWidth={1.5} />
      <text x={xA0-10} y={(yTop+yBot)/2} fontSize={10} fontWeight="bold" fill="#dc2626" textAnchor="middle" dominantBaseline="middle">D</text>
      {/* leeward wall E */}
      <rect x={xD1} y={yTop} width={20} height={bH} fill="#f3e8ff" stroke="#7c3aed" strokeWidth={1.5} />
      <text x={xD1+10} y={(yTop+yBot)/2} fontSize={10} fontWeight="bold" fill="#7c3aed" textAnchor="middle" dominantBaseline="middle">E</text>
      {/* side zones A, B, C */}
      {[{ label: 'A', x0: xA0, x1: xA1, fill: '#dbeafe', color: '#1d4ed8' },
        { label: 'B', x0: xA1, x1: xB1, fill: '#fef3c7', color: '#92400e' },
        { label: 'C', x0: xB1, x1: xC1, fill: '#dcfce7', color: '#166534' }].map(z => (
        <g key={z.label}>
          <rect x={z.x0} y={yTop} width={Math.max(0, z.x1-z.x0)} height={bH} fill={z.fill} stroke={z.color} strokeWidth={1} />
          {z.x1-z.x0 > 14 && <text x={(z.x0+z.x1)/2} y={(yTop+yBot)/2} fontSize={11} fontWeight="bold" fill={z.color} textAnchor="middle" dominantBaseline="middle">{z.label}</text>}
        </g>
      ))}
      {/* labels */}
      <text x={(xA0+xD1)/2} y={yTop-10} fontSize={10} fill="#1e293b" textAnchor="middle">Side wall (plan view)</text>
      <text x={(xA0+xD1)/2} y={H-6} fontSize={9} fill="#1e293b" textAnchor="middle">d = {d} m (depth parallel to wind)</text>
    </svg>
  )
}

export function DiagramFlatRoof({ e, d, b, h }: { e: number; d: number; b: number; h: number }) {
  const W = 300; const H = 200
  const pad = 30
  const W2 = W - 2*pad; const H2 = H - 2*pad
  const eS = Math.min(e/2, d*0.5) / d * W2
  const eB = Math.min(e/10, b*0.5) / b * H2
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1e293b" /></marker></defs>
      {/* roof outline */}
      <rect x={pad} y={pad} width={W2} height={H2} fill="#f8fafc" stroke="#1e293b" strokeWidth={1.5} />
      {/* F zones (corners) */}
      {[[pad,pad],[pad+W2-eS,pad],[pad,pad+H2-eB],[pad+W2-eS,pad+H2-eB]].map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={eS} height={eB} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} />
      ))}
      {/* G zones (top/bottom strips) */}
      <rect x={pad+eS} y={pad} width={W2-2*eS} height={eB} fill="#dbeafe" stroke="#3b82f6" strokeWidth={1} />
      <rect x={pad+eS} y={pad+H2-eB} width={W2-2*eS} height={eB} fill="#dbeafe" stroke="#3b82f6" strokeWidth={1} />
      {/* H zone (side strips) */}
      <rect x={pad} y={pad+eB} width={eS} height={H2-2*eB} fill="#dcfce7" stroke="#16a34a" strokeWidth={1} />
      <rect x={pad+W2-eS} y={pad+eB} width={eS} height={H2-2*eB} fill="#dcfce7" stroke="#16a34a" strokeWidth={1} />
      {/* I zone (centre) */}
      <rect x={pad+eS} y={pad+eB} width={W2-2*eS} height={H2-2*eB} fill="#f3e8ff" stroke="#7c3aed" strokeWidth={1} />
      {/* labels */}
      <text x={pad+eS/2} y={pad+eB/2} fontSize={10} fontWeight="bold" fill="#92400e" textAnchor="middle" dominantBaseline="middle">F</text>
      <text x={pad+W2/2} y={pad+eB/2} fontSize={10} fontWeight="bold" fill="#1d4ed8" textAnchor="middle" dominantBaseline="middle">G</text>
      <text x={pad+eS/2} y={pad+H2/2} fontSize={10} fontWeight="bold" fill="#166534" textAnchor="middle" dominantBaseline="middle">H</text>
      <text x={pad+W2/2} y={pad+H2/2} fontSize={10} fontWeight="bold" fill="#6b21a8" textAnchor="middle" dominantBaseline="middle">I</text>
      {/* wind arrow */}
      <line x1={pad-22} y1={pad+H2/2} x2={pad-2} y2={pad+H2/2} stroke="#1e293b" strokeWidth={2} markerEnd="url(#arr2)" />
      <text x={pad-22} y={pad+H2/2-8} fontSize={9} fill="#1e293b">Wind</text>
      <text x={pad+W2/2} y={H-6} fontSize={9} fill="#1e293b" textAnchor="middle">Roof plan view (e = min(b,2h) = {e.toFixed(1)} m)</text>
    </svg>
  )
}

export function DiagramMonopitch({ alpha }: { alpha: number }) {
  const W = 300; const H = 160; const rad = alpha * Math.PI / 180
  const x0=40; const x1=260; const y0=120; const yRidge = y0 - (x1-x0)*Math.tan(rad)*0.6
  const mid = (x0+x1)/2
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arr3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1e293b" /></marker></defs>
      {/* walls */}
      <line x1={x0} y1={y0} x2={x0} y2={y0-50} stroke="#1e293b" strokeWidth={2} />
      <line x1={x1} y1={y0} x2={x1} y2={Math.min(yRidge, y0-10)} stroke="#1e293b" strokeWidth={2} />
      {/* ground */}
      <line x1={20} y1={y0} x2={280} y2={y0} stroke="#1e293b" strokeWidth={1.5} />
      {/* roof surface — zones F, G, H */}
      <polygon points={`${x0},${y0-50} ${x1},${Math.min(yRidge,y0-10)}`} fill="none" />
      {/* zone regions on roof */}
      {[['#fef3c7','#f59e0b','F',x0,x0+20],['#dbeafe','#3b82f6','G',x0+20,mid-10],['#f3e8ff','#7c3aed','I',mid-10,mid+10],['#dcfce7','#16a34a','H',mid+10,x1-20]].map(([fill,stroke,label,xa,xb],i) => {
        const ya = y0-50 - (Number(xa)-x0)*(50-(Math.min(yRidge,y0-10)-(y0-50)))/(x1-x0)
        const yb = y0-50 - (Number(xb)-x0)*(50-(Math.min(yRidge,y0-10)-(y0-50)))/(x1-x0)
        return <polygon key={String(label)} points={`${xa},${y0} ${xb},${y0} ${xb},${yb} ${xa},${ya}`} fill={String(fill)} stroke={String(stroke)} strokeWidth={1} opacity={0.85} />
      })}
      {/* roof outline */}
      <line x1={x0} y1={y0-50} x2={x1} y2={Math.min(yRidge,y0-10)} stroke="#334155" strokeWidth={2} />
      {/* labels */}
      {[['F',x0+10],['G',x0+50],['I',mid],['H',x1-40]].map(([l,x]) => (
        <text key={String(l)} x={Number(x)} y={y0-30} fontSize={10} fontWeight="bold" fill="#334155" textAnchor="middle">{String(l)}</text>
      ))}
      {/* angle */}
      <text x={x0+18} y={y0-8} fontSize={10} fill="#1e293b">α={alpha}°</text>
      {/* wind arrow */}
      <line x1={8} y1={y0-25} x2={x0-4} y2={y0-25} stroke="#1e293b" strokeWidth={2} markerEnd="url(#arr3)" />
      <text x={4} y={y0-30} fontSize={9} fill="#1e293b">W</text>
    </svg>
  )
}

export function DiagramDuopitch({ alpha }: { alpha: number }) {
  const W = 300; const H = 160
  const x0=40; const x1=260; const xm=(x0+x1)/2; const y0=110
  const h = 45 + Math.abs(alpha) * 0.6
  const yRidge = alpha >= 0 ? y0-h : y0-10
  const yEave = alpha >= 0 ? y0-10 : y0-h
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arr4" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1e293b" /></marker></defs>
      <line x1={20} y1={y0} x2={280} y2={y0} stroke="#1e293b" strokeWidth={1.5} />
      <line x1={x0} y1={y0} x2={x0} y2={yEave} stroke="#1e293b" strokeWidth={2} />
      <line x1={x1} y1={y0} x2={x1} y2={yEave} stroke="#1e293b" strokeWidth={2} />
      {/* windward zones F,G,H */}
      {[['#fef3c7','#f59e0b','F',x0,x0+20],['#dbeafe','#3b82f6','G',x0+20,xm-10],['#dcfce7','#16a34a','H',xm-10,xm+10]].map(([fill,stroke,label,xa,xb])=>{
        const ya=yEave+(yRidge-yEave)*(Number(xa)-x0)/(xm-x0)
        const yb=yEave+(yRidge-yEave)*(Number(xb)-x0)/(xm-x0)
        return <polygon key={String(label)} points={`${xa},${y0} ${xb},${y0} ${xb},${yb} ${xa},${ya}`} fill={String(fill)} stroke={String(stroke)} strokeWidth={1} opacity={0.85}/>
      })}
      {/* leeward zones I, J */}
      {[['#f3e8ff','#7c3aed','I',xm+10,x1-20],['#fee2e2','#dc2626','J',x1-20,x1]].map(([fill,stroke,label,xa,xb])=>{
        const ya=yRidge+(yEave-yRidge)*(Number(xa)-xm)/(x1-xm)
        const yb=yRidge+(yEave-yRidge)*(Number(xb)-xm)/(x1-xm)
        return <polygon key={String(label)} points={`${xa},${y0} ${xb},${y0} ${xb},${yb} ${xa},${ya}`} fill={String(fill)} stroke={String(stroke)} strokeWidth={1} opacity={0.85}/>
      })}
      <polyline points={`${x0},${yEave} ${xm},${yRidge} ${x1},${yEave}`} fill="none" stroke="#334155" strokeWidth={2} />
      {[['F',x0+10],['G',x0+55],['H',xm],['I',xm+50],['J',x1-10]].map(([l,x]) => (
        <text key={String(l)} x={Number(x)} y={y0-20} fontSize={10} fontWeight="bold" fill="#334155" textAnchor="middle">{String(l)}</text>
      ))}
      <text x={x0+20} y={y0-5} fontSize={10} fill="#1e293b">α={alpha}°</text>
      <line x1={8} y1={y0-30} x2={x0-4} y2={y0-30} stroke="#1e293b" strokeWidth={2} markerEnd="url(#arr4)" />
      <text x={4} y={y0-35} fontSize={9} fill="#1e293b">W</text>
    </svg>
  )
}

export function DiagramCanopyMono({ alpha, d, b }: { alpha: number; d: number; b: number }) {
  const W = 300; const H = 140; const rad = alpha * Math.PI / 180
  const x0=40; const x1=260; const y0=110
  const rise = (x1-x0)*Math.tan(rad)*0.7
  const yLo = y0-30; const yHi = yLo-Math.min(rise, 60)
  const mid=(x0+x1)/2; const third=(x1-x0)/3
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arrC" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1e293b"/></marker></defs>
      <line x1={20} y1={y0} x2={280} y2={y0} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,3"/>
      {[['#dbeafe','#3b82f6','A',x0,x0+third],['#fef3c7','#f59e0b','B',x0+third,x0+2*third],['#dcfce7','#16a34a','C',x0+2*third,x1]].map(([fill,stroke,label,xa,xb])=>{
        const ya = yLo+(yHi-yLo)*(Number(xa)-x0)/(x1-x0)
        const yb = yLo+(yHi-yLo)*(Number(xb)-x0)/(x1-x0)
        return <polygon key={String(label)} points={`${xa},${y0} ${xb},${y0} ${xb},${yb} ${xa},${ya}`} fill={String(fill)} stroke={String(stroke)} strokeWidth={1.2} opacity={0.85}/>
      })}
      <line x1={x0} y1={yLo} x2={x1} y2={yHi} stroke="#334155" strokeWidth={2}/>
      {[['A',x0+third/2],['B',x0+third*1.5],['C',x0+third*2.5]].map(([l,x])=>(
        <text key={String(l)} x={Number(x)} y={yLo-8} fontSize={11} fontWeight="bold" fill="#334155" textAnchor="middle">{String(l)}</text>
      ))}
      <text x={x0+16} y={yLo+12} fontSize={10} fill="#1e293b">α={alpha}°</text>
      <line x1={8} y1={y0-15} x2={x0-4} y2={y0-15} stroke="#1e293b" strokeWidth={2} markerEnd="url(#arrC)"/>
      <text x={4} y={y0-20} fontSize={9} fill="#1e293b">W</text>
    </svg>
  )
}

export function DiagramFreewall({ l, h }: { l: number; h: number }) {
  const W = 300; const H = 140
  const x0=30; const y0=100; const wScale = Math.min((W-60)/l, 8); const hScale = Math.min((H-50)/h, 12)
  const wPx = l*wScale; const hPx = h*hScale
  const e = Math.min(l, 2*h); const e4=e/4; const e1=e; const e2=Math.min(2*e,l)
  const zones = [
    { label:'A', x0: x0, w: e4*wScale, fill:'#dbeafe', color:'#1d4ed8' },
    { label:'B', x0: x0+e4*wScale, w: (e1-e4)*wScale, fill:'#fef3c7', color:'#92400e' },
    { label:'C', x0: x0+e1*wScale, w: (e2-e1)*wScale, fill:'#dcfce7', color:'#166534' },
    { label:'D', x0: x0+e2*wScale, w: Math.max(0,(l-e2)*wScale), fill:'#f3e8ff', color:'#6b21a8' },
  ]
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arrFW" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1e293b"/></marker></defs>
      <line x1={10} y1={y0-hPx/2} x2={x0-4} y2={y0-hPx/2} stroke="#1e293b" strokeWidth={2} markerEnd="url(#arrFW)"/>
      <text x={6} y={y0-hPx/2-6} fontSize={9} fill="#1e293b">Wind</text>
      {zones.filter(z=>z.w>0).map(z=>(
        <g key={z.label}>
          <rect x={z.x0} y={y0-hPx} width={z.w} height={hPx} fill={z.fill} stroke={z.color} strokeWidth={1.2}/>
          {z.w>12 && <text x={z.x0+z.w/2} y={y0-hPx/2} fontSize={11} fontWeight="bold" fill={z.color} textAnchor="middle" dominantBaseline="middle">{z.label}</text>}
        </g>
      ))}
      <line x1={x0} y1={y0} x2={x0+wPx} y2={y0} stroke="#334155" strokeWidth={1}/>
      <text x={x0+wPx/2} y={H-4} fontSize={9} fill="#1e293b" textAnchor="middle">l = {l} m</text>
      <text x={x0-4} y={y0-hPx/2} fontSize={9} fill="#1e293b" textAnchor="end" dominantBaseline="middle">h={h}m</text>
    </svg>
  )
}

export function DiagramRect({ d, b }: { d: number; b: number }) {
  const W = 180; const H = 140; const sc = Math.min(60/Math.max(d,b), 20)
  const dPx = d*sc; const bPx = b*sc
  const cx=W/2; const cy=H/2
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arrR" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2563eb"/></marker></defs>
      <rect x={cx-dPx/2} y={cy-bPx/2} width={dPx} height={bPx} fill="#dbeafe" stroke="#2563eb" strokeWidth={2}/>
      {/* wind arrow */}
      <line x1={cx-dPx/2-40} y1={cy} x2={cx-dPx/2-4} y2={cy} stroke="#2563eb" strokeWidth={2} markerEnd="url(#arrR)"/>
      <text x={cx-dPx/2-42} y={cy-6} fontSize={10} fill="#2563eb">Wind</text>
      {/* dimensions */}
      <text x={cx} y={cy+bPx/2+14} fontSize={10} fill="#334155" textAnchor="middle">d = {d} m</text>
      <text x={cx+dPx/2+14} y={cy} fontSize={10} fill="#334155" textAnchor="start" dominantBaseline="middle">b = {b} m</text>
    </svg>
  )
}

export function DiagramCylinder({ diam, l }: { diam: number; l: number }) {
  const W = 180; const H = 140
  const cx=W/2; const cy=H/2; const rx=Math.min(40, diam*8); const ry=Math.min(20, diam*4)
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arrCy" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2563eb"/></marker></defs>
      <ellipse cx={cx} cy={cy-ry} rx={rx} ry={ry/2} fill="#bfdbfe" stroke="#2563eb" strokeWidth={1.5}/>
      <rect x={cx-rx} y={cy-ry} width={rx*2} height={ry*2} fill="#dbeafe" stroke="#2563eb" strokeWidth={1.5}/>
      <ellipse cx={cx} cy={cy+ry} rx={rx} ry={ry/2} fill="#dbeafe" stroke="#2563eb" strokeWidth={1.5}/>
      <line x1={cx-rx-38} y1={cy} x2={cx-rx-4} y2={cy} stroke="#2563eb" strokeWidth={2} markerEnd="url(#arrCy)"/>
      <text x={cx-rx-40} y={cy-6} fontSize={10} fill="#2563eb">Wind</text>
      <text x={cx} y={cy+ry+16} fontSize={10} fill="#334155" textAnchor="middle">b (dia) = {diam} m</text>
      <text x={cx+rx+6} y={cy} fontSize={10} fill="#334155" dominantBaseline="middle">l = {l} m</text>
    </svg>
  )
}

export function DiagramSignboard({ w, h, zg }: { w: number; h: number; zg: number }) {
  const W = 200; const H = 160; const sc = Math.min(50/Math.max(w,h+zg), 14)
  const wPx=w*sc; const hPx=h*sc; const zgPx=zg*sc
  const x0=(W-wPx)/2; const yGnd=H-20
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      <defs><marker id="arrSg" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2563eb"/></marker></defs>
      <line x1={10} y1={yGnd} x2={W-10} y2={yGnd} stroke="#1e293b" strokeWidth={2}/>
      <rect x={x0} y={yGnd-zgPx-hPx} width={wPx} height={hPx} fill="#dbeafe" stroke="#2563eb" strokeWidth={2}/>
      {/* post */}
      <line x1={W/2} y1={yGnd} x2={W/2} y2={yGnd-zgPx} stroke="#334155" strokeWidth={2.5}/>
      {/* wind arrow */}
      <line x1={10} y1={yGnd-zgPx-hPx/2} x2={x0-4} y2={yGnd-zgPx-hPx/2} stroke="#2563eb" strokeWidth={2} markerEnd="url(#arrSg)"/>
      <text x={6} y={yGnd-zgPx-hPx/2-7} fontSize={9} fill="#2563eb">Wind</text>
      {/* dims */}
      <text x={W/2} y={yGnd-zgPx-hPx-8} fontSize={10} fill="#334155" textAnchor="middle">b={w}m</text>
      <text x={x0-4} y={yGnd-zgPx-hPx/2} fontSize={10} fill="#334155" textAnchor="end" dominantBaseline="middle">h={h}m</text>
      <text x={x0-4} y={yGnd-zgPx/2} fontSize={9} fill="#1e293b" textAnchor="end" dominantBaseline="middle">zg={zg}m</text>
      <text x={W/2} y={yGnd+14} fontSize={9} fill="#1e293b" textAnchor="middle">Ground</text>
    </svg>
  )
}

