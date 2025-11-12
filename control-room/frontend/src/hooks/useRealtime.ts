'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions<T> {
  table: string
  event?: RealtimeEvent
  filter?: string
  schema?: string
  onInsert?: (payload: T) => void
  onUpdate?: (payload: { old: T; new: T }) => void
  onDelete?: (payload: T) => void
}

/**
 * Real-time subscription hook for Supabase tables
 * Automatically subscribes to table changes and manages cleanup
 */
export function useRealtime<T = any>(options: UseRealtimeOptions<T>) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const {
    table,
    event = '*',
    filter,
    schema = 'public',
    onInsert,
    onUpdate,
    onDelete,
  } = options

  // Establish real-time connection
  useEffect(() => {
    const channelName = `${schema}:${table}:${filter || 'all'}`
    
    // Create channel
    const realtimeChannel = supabase.channel(channelName)

    // Configure event handlers
    if (event === '*' || event === 'INSERT') {
      realtimeChannel.on(
        'postgres_changes',
        { event: 'INSERT', schema, table, filter },
        (payload) => {
          onInsert?.(payload.new as T)
        }
      )
    }

    if (event === '*' || event === 'UPDATE') {
      realtimeChannel.on(
        'postgres_changes',
        { event: 'UPDATE', schema, table, filter },
        (payload) => {
          onUpdate?.({ old: payload.old as T, new: payload.new as T })
        }
      )
    }

    if (event === '*' || event === 'DELETE') {
      realtimeChannel.on(
        'postgres_changes',
        { event: 'DELETE', schema, table, filter },
        (payload) => {
          onDelete?.(payload.old as T)
        }
      )
    }

    // Subscribe to channel
    realtimeChannel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setError(new Error('Failed to connect to real-time channel'))
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setError(new Error('Real-time connection timed out'))
        }
      })

    setChannel(realtimeChannel)

    // Cleanup on unmount
    return () => {
      realtimeChannel.unsubscribe()
      setIsConnected(false)
      setChannel(null)
    }
  }, [table, event, filter, schema, onInsert, onUpdate, onDelete])

  return {
    isConnected,
    error,
    channel,
  }
}

/**
 * Hook for real-time presence tracking
 * Useful for showing who's online in the admin panel
 */
export function usePresence(channelName: string) {
  const [users, setUsers] = useState<Record<string, any>>({})
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const presenceChannel = supabase.channel(channelName)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setUsers(state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    setChannel(presenceChannel)

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [channelName])

  return { users, channel }
}

/**
 * Hook for broadcasting messages between tabs/users
 */
export function useBroadcast<T = any>(channelName: string) {
  const [messages, setMessages] = useState<T[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const broadcastChannel = supabase.channel(channelName)

    broadcastChannel
      .on('broadcast', { event: 'message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload as T])
      })
      .subscribe()

    setChannel(broadcastChannel)

    return () => {
      broadcastChannel.unsubscribe()
    }
  }, [channelName])

  const broadcast = useCallback(
    async (message: T) => {
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'message',
          payload: message,
        })
      }
    },
    [channel]
  )

  return { messages, broadcast, channel }
}
