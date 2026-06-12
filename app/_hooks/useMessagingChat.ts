'use client'
import { useCallback, useRef, useState } from 'react'

/**
 * Owns all the floating-ChatBox + MessageDropdown wiring that was previously duplicated in
 * every nav container (HomeNavBar, AppHeader, and the per-page nav bars). Centralising it
 * here means a callback-signature change (e.g. adding `deletedAt` to onDeleteChat) is made
 * in ONE place instead of seven.
 *
 * Usage in a container:
 *   const chat = useMessagingChat(user?.id)
 *   ...
 *   {user && chat.openChats.map((c, i) => (
 *     <ChatBox key={c.convId} {...chat.chatBoxProps(c, i)} userId={user.id} />
 *   ))}
 *   <MessageDropdown {...chat.dropdownHandlers} ... />
 */
export interface OpenChat {
  convId: string
  peer: any
  startFocused?: boolean
  showAfter?: string
}

export function useMessagingChat() {
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [minimizedChats, setMinimizedChats] = useState<Set<string>>(new Set())

  // Callbacks registered by MessageDropdown so the ChatBoxes can call back into it.
  const markConvReadRef = useRef<((convId: string) => void) | null>(null)
  const sentCallbackRef = useRef<((convId: string, body: string) => void) | null>(null)
  const removeConvCallbackRef = useRef<((convId: string, deletedAt?: string) => void) | null>(null)

  const onRegisterMarkRead = useCallback((fn: (convId: string) => void) => { markConvReadRef.current = fn }, [])
  const onRegisterSent = useCallback((fn: (convId: string, body: string) => void) => { sentCallbackRef.current = fn }, [])
  const onRegisterRemoveConv = useCallback((fn: (convId: string, deletedAt?: string) => void) => { removeConvCallbackRef.current = fn }, [])

  // Dropdown → open a chat the user explicitly clicked (focus it).
  const onOpenChat = useCallback((conv: any, peer: any) => {
    setOpenChats(prev => prev.some(c => c.convId === conv.id) ? prev : [...prev, { convId: conv.id, peer, startFocused: true }])
  }, [])

  // Dropdown → a new message arrived. Skip auto-open when the user deleted this conversation
  // (showAfter set): they still get the unread badge and can open it manually.
  const onNewMessage = useCallback((convId: string, peer: any, showAfter?: string) => {
    if (showAfter) return
    setOpenChats(prev => prev.some(c => c.convId === convId) ? prev : [...prev, { convId, peer, startFocused: false, showAfter }])
  }, [])

  const closeChat = useCallback((convId: string) => {
    setOpenChats(prev => prev.filter(c => c.convId !== convId))
    setMinimizedChats(prev => { const next = new Set(prev); next.delete(convId); return next })
  }, [])

  const setMinimized = useCallback((convId: string, min: boolean) => {
    setMinimizedChats(prev => {
      const next = new Set(prev)
      if (min) next.add(convId); else next.delete(convId)
      return next
    })
  }, [])

  // Props every ChatBox needs except userId (the container supplies that). Pass the chat and
  // its stacking index.
  const chatBoxProps = useCallback((chat: OpenChat, index: number) => ({
    convId: chat.convId,
    peer: chat.peer,
    index,
    minimizedProp: minimizedChats.has(chat.convId),
    startFocused: chat.startFocused,
    showAfter: chat.showAfter,
    onMinimize: setMinimized,
    onClose: () => closeChat(chat.convId),
    onOpenFull: () => { window.location.href = `/messages?conv=${chat.convId}` },
    onMarkRead: (convId: string) => markConvReadRef.current?.(convId),
    onSent: (convId: string, body: string) => sentCallbackRef.current?.(convId, body),
    onDeleteChat: (convId: string, deletedAt?: string) => removeConvCallbackRef.current?.(convId, deletedAt),
  }), [minimizedChats, setMinimized, closeChat])

  // Props the MessageDropdown needs to wire itself to the open chats.
  const dropdownHandlers = {
    onOpenChat,
    onNewMessage,
    onRegisterMarkRead,
    onRegisterSent,
    onRegisterRemoveConv,
    openConvIds: openChats.map(c => c.convId),
  }

  return { openChats, minimizedChats, chatBoxProps, dropdownHandlers, closeChat, setMinimized }
}
