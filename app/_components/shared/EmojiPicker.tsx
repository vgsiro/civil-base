'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Smile } from 'lucide-react'

const GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯','😲','😳','🥺','🫠','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿'] },
  { label: 'Gestures', emojis: ['👋','🤚','🖐','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄','🫦','💋'] },
  { label: 'People', emojis: ['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🫃','🤱','👼','🎅','🤶','🧑‍🎄','🦸','🦹','🧙','🧝','🧛','🧟','🧌','🧞','🧜','🧚','🪄','👤','👥'] },
  { label: 'Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🪳','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🪸','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🫎','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🦫','🦦','🦥','🐁','🐀','🐿️','🦔'] },
  { label: 'Food', emojis: ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🫒','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥦','🧄','🧅','🥗','🫙','🍄','🌰','🦪','🍞','🥐','🥖','🫓','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫔','🌮','🌯','🥙','🧆','🥚','🍜','🍝','🍠','🦐','🍱','🍘','🍣','🍚','🍛','🍤','🍙','🦞','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','☕','🍵','🧉','🍺','🍻','🥂','🍷','🍸','🍹','🧊'] },
  { label: 'Travel', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🛞','🚨','🚥','🛑','🚦','🛸','🚁','🛺','🚟','🚠','🚡','✈️','🛩️','🪂','💺','🚀','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','🏖️','🏝️','⛰️','🏔️','🗻','🏕️','🏜️','🏟️','🏛️','🏗️','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏧','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','⛩️','🕍','🌁','🌃','🌄','🌅','🌆','🌇','🌉','♾️','🎠','🎡','🎢','💈','🎪'] },
  { label: 'Objects', emojis: ['⌚','📱','📲','💻','🖥️','🖨️','🖱️','🖲️','💽','💾','💿','📀','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🧭','🕰️','⏰','⏱️','⏲️','🗑️','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💰','💴','💵','💶','💷','💸','💳','🪙','💹','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','🛡️','🔧','🔩','⚙️','🗜️','⚖️','🦯','🔗','⛓️','🧲','🪜','🧰','🧲','🔬','🔭','📡','💉','🩸','💊','🩹','🩼','🩺','🩻','🚪','🪞','🛋️','🪑','🚽','🪠','🚿','🛁','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🫧','🪥','🧽','🧯','🛒'] },
  { label: 'Symbols', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛰️','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️','🔼','⏫','🔽','⏬','⏸️','⏹️','⏺️','🎦','🔅','🔆','📶','📳','📴','📵','📳','🔈','🔉','🔊','📢','📣','📯','🔔','🔕','🎵','🎶','⭐','🌟','💫','✨','🔥','💥','❄️','🌈','🌊','🎉','🎊','🎈','🎁','🏆','🥇','🥈','🥉','🎖️','🎗️','🎫','🎟️','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🎸','🎻','🪕','🎯','🎱','🎮','🕹️','🎲','♟️','🧩','🧸','🪅','🪆','🎭'] },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    const pickerH = 320
    const pickerW = 300
    const spaceBelow = window.innerHeight - r.bottom - 8
    const top = spaceBelow >= pickerH ? r.bottom + 4 : r.top - pickerH - 4
    const left = Math.min(r.left, window.innerWidth - pickerW - 8)
    setPos({ top, left: Math.max(8, left) })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Add emoji"
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: open ? '#fef9c3' : '#f8fafc', color: open ? '#b45309' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = '#fef9c3'; e.currentTarget.style.color = '#b45309' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b' } }}>
        <Smile size={14} /> Emoji
      </button>

      {mounted && open && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9000 }} />
          {pos && (
            <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9001, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0', width: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Group tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', overflowX: 'auto', padding: '4px 6px 0', gap: 2, flexShrink: 0 }}>
                {GROUPS.map((g, i) => (
                  <button key={g.label} onClick={() => setActiveGroup(i)}
                    title={g.label}
                    style={{ padding: '4px 8px', borderRadius: '6px 6px 0 0', border: 'none', background: activeGroup === i ? '#eff6ff' : 'transparent', color: activeGroup === i ? '#3b82f6' : '#64748b', fontSize: 11, fontWeight: activeGroup === i ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {g.label}
                  </button>
                ))}
              </div>
              {/* Emoji grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: 8, maxHeight: 260, overflowY: 'auto' }}>
                {GROUPS[activeGroup].emojis.map(emoji => (
                  <button key={emoji} onClick={() => { onSelect(emoji); setOpen(false) }}
                    style={{ fontSize: 20, lineHeight: 1, padding: '4px 2px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6, textAlign: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  )
}
