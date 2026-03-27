import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserProfile, ChatMessage, ChatPeer } from '../types';
import { supabase } from '../auth';
import { useAuthModal } from '../contexts/AuthModalContext';
import type { Database } from '../supabase.types';

interface ChatPageProps {
  user: UserProfile | null;
}

interface RawPeerMessage {
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

const PAGE_LIMIT = 300;
const READ_MARKER_KEY_PREFIX = 'eduswap-chat-read-v1';
const PEER_NAME_CACHE_KEY_PREFIX = 'eduswap-chat-peer-names-v1';
const looksLikeUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const toFriendlyPeerName = (peerId: string, candidate?: string) => {
  const clean = (candidate || '').trim();
  if (clean && clean !== peerId) return clean;
  if (looksLikeUuid(peerId)) return `Student (${peerId.slice(0, 8)})`;
  return peerId || 'Student';
};

export const ChatPage: React.FC<ChatPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openAuthModal } = useAuthModal();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastReadByPeer, setLastReadByPeer] = useState<Record<string, string>>({});
  const [peerNameCache, setPeerNameCache] = useState<Record<string, string>>({});
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerTypingTimeoutRef = useRef<number | null>(null);
  const stopTypingDebounceRef = useRef<number | null>(null);
  const amTypingRef = useRef(false);

  const prefilledPeerId = searchParams.get('peer') || '';
  const prefilledPeerName = searchParams.get('name') || 'Student';
  const prefilledPeerAvatar = searchParams.get('avatar') || '';

  const peers = useMemo<ChatPeer[]>(() => {
    if (!user) return [];

    const byPeer = new Map<string, ChatPeer>();
    for (const msg of messages) {
      const peerId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
      if (!peerId || peerId === user.uid) continue;
      if (!byPeer.has(peerId)) {
        byPeer.set(peerId, {
          uid: peerId,
          displayName: toFriendlyPeerName(peerId, peerNameCache[peerId]),
          photoURL: '',
        });
      }
    }

    if (prefilledPeerId && prefilledPeerId !== user.uid) {
      const existing = byPeer.get(prefilledPeerId);
      byPeer.set(prefilledPeerId, {
        uid: prefilledPeerId,
        displayName: toFriendlyPeerName(
          prefilledPeerId,
          prefilledPeerName || existing?.displayName || peerNameCache[prefilledPeerId]
        ),
        photoURL: prefilledPeerAvatar || existing?.photoURL || '',
      });
    }

    return Array.from(byPeer.values());
  }, [messages, peerNameCache, prefilledPeerAvatar, prefilledPeerId, prefilledPeerName, user]);

  const activePeerId = useMemo(() => {
    if (!user) return '';
    if (prefilledPeerId && prefilledPeerId !== user.uid) return prefilledPeerId;
    return peers[0]?.uid || '';
  }, [peers, prefilledPeerId, user]);

  const activeMessages = useMemo(
    () =>
      messages
        .filter(
          (m) =>
            (m.senderId === user?.uid && m.receiverId === activePeerId) ||
            (m.receiverId === user?.uid && m.senderId === activePeerId)
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [activePeerId, messages, user?.uid]
  );

  const activePeer = peers.find((p) => p.uid === activePeerId);

  const unreadByPeer = useMemo(() => {
    if (!user) return {} as Record<string, number>;
    const counts: Record<string, number> = {};

    for (const msg of messages) {
      if (msg.receiverId !== user.uid) continue;
      const peerId = msg.senderId;
      const lastRead = lastReadByPeer[peerId];
      if (lastRead && msg.createdAt <= lastRead) continue;
      counts[peerId] = (counts[peerId] || 0) + 1;
    }

    return counts;
  }, [lastReadByPeer, messages, user]);

  const emitTyping = async (typing: boolean) => {
    if (!user || !activePeerId || !typingChannelRef.current) return;
    await typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { from: user.uid, to: activePeerId, typing },
    });
  };

  const updateTypingStatus = (typing: boolean) => {
    if (amTypingRef.current === typing) return;
    amTypingRef.current = typing;
    void emitTyping(typing);
  };

  const markPeerAsRead = (peerId: string, readAt?: string) => {
    if (!user || !peerId) return;
    const marker = readAt || new Date().toISOString();
    setLastReadByPeer((prev) => {
      if ((prev[peerId] || '') >= marker) return prev;
      const next = { ...prev, [peerId]: marker };
      localStorage.setItem(`${READ_MARKER_KEY_PREFIX}:${user.uid}`, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.uid},receiver_id.eq.${user.uid}`)
        .order('created_at', { ascending: true })
        .limit(PAGE_LIMIT);

      if (error) {
        console.error('Failed to fetch messages:', error);
        setLoading(false);
        return;
      }

      const mapped: ChatMessage[] = (data || []).map((row: Database['public']['Tables']['messages']['Row']) => ({
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        createdAt: row.created_at,
      }));
      setMessages(mapped);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${user.uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as RawPeerMessage & { id: string; content: string };
          if (row.sender_id !== user.uid && row.receiver_id !== user.uid) return;

          setMessages((prev) => [
            ...prev,
            {
              id: row.id,
              senderId: row.sender_id,
              receiverId: row.receiver_id,
              content: row.content,
              createdAt: row.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(`${READ_MARKER_KEY_PREFIX}:${user.uid}`);
    if (!raw) {
      setLastReadByPeer({});
      return;
    }
    try {
      setLastReadByPeer(JSON.parse(raw) as Record<string, string>);
    } catch {
      setLastReadByPeer({});
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(`${PEER_NAME_CACHE_KEY_PREFIX}:${user.uid}`);
    if (!raw) {
      setPeerNameCache({});
      return;
    }
    try {
      setPeerNameCache(JSON.parse(raw) as Record<string, string>);
    } catch {
      setPeerNameCache({});
    }
  }, [user]);

  useEffect(() => {
    if (!user || !prefilledPeerId || !prefilledPeerName || prefilledPeerId === user.uid) return;
    setPeerNameCache((prev) => {
      if (prev[prefilledPeerId] === prefilledPeerName) return prev;
      const next = { ...prev, [prefilledPeerId]: prefilledPeerName };
      localStorage.setItem(`${PEER_NAME_CACHE_KEY_PREFIX}:${user.uid}`, JSON.stringify(next));
      return next;
    });
  }, [prefilledPeerId, prefilledPeerName, user]);

  useEffect(() => {
    if (!user || peers.length === 0) return;
    const unresolvedIds = peers
      .map((p) => p.uid)
      .filter((id) => {
        const known = peerNameCache[id];
        return !known || known === id;
      });

    if (unresolvedIds.length === 0) return;

    const targetIds = unresolvedIds.filter(looksLikeUuid);
    if (targetIds.length === 0) return;

    const resolvePeerNames = async () => {
      const [materialsRes, swapReqRes, profilesRes] = await Promise.all([
        supabase.from('materials').select('author_id,author_name').in('author_id', targetIds),
        supabase.from('swap_requests').select('user_id,user_name').in('user_id', targetIds),
        // Optional table (if present) for reliable user display names.
        (supabase as unknown as {
          from: (table: string) => {
            select: (query: string) => {
              in: (
                column: string,
                values: string[]
              ) => Promise<{ data: Array<{ user_id: string; display_name: string }> | null }>;
            };
          };
        })
          .from('user_profiles')
          .select('user_id,display_name')
          .in('user_id', targetIds),
      ]);

      const resolved: Record<string, string> = {};
      for (const row of profilesRes.data || []) {
        if (row.user_id && row.display_name && !resolved[row.user_id]) {
          resolved[row.user_id] = row.display_name;
        }
      }
      for (const row of materialsRes.data || []) {
        if (row.author_id && row.author_name && !resolved[row.author_id]) {
          resolved[row.author_id] = row.author_name;
        }
      }
      for (const row of swapReqRes.data || []) {
        if (row.user_id && row.user_name && !resolved[row.user_id]) {
          resolved[row.user_id] = row.user_name;
        }
      }

      if (Object.keys(resolved).length === 0) return;
      setPeerNameCache((prev) => {
        const next = { ...prev, ...resolved };
        localStorage.setItem(`${PEER_NAME_CACHE_KEY_PREFIX}:${user.uid}`, JSON.stringify(next));
        return next;
      });
    };

    void resolvePeerNames();
  }, [peerNameCache, peers, user]);

  useEffect(() => {
    if (!user || !activePeerId) {
      setIsPeerTyping(false);
      return;
    }

    if (peerTypingTimeoutRef.current) {
      window.clearTimeout(peerTypingTimeoutRef.current);
      peerTypingTimeoutRef.current = null;
    }
    setIsPeerTyping(false);

    const typingChannel = supabase
      .channel(`typing:${[user.uid, activePeerId].sort().join(':')}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const data = payload as { from?: string; to?: string; typing?: boolean };
        if (data.from !== activePeerId || data.to !== user.uid) return;
        if (!data.typing) {
          setIsPeerTyping(false);
          return;
        }

        setIsPeerTyping(true);
        if (peerTypingTimeoutRef.current) window.clearTimeout(peerTypingTimeoutRef.current);
        peerTypingTimeoutRef.current = window.setTimeout(() => setIsPeerTyping(false), 1800);
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      updateTypingStatus(false);
      typingChannelRef.current = null;
      supabase.removeChannel(typingChannel);
      setIsPeerTyping(false);
      if (peerTypingTimeoutRef.current) {
        window.clearTimeout(peerTypingTimeoutRef.current);
        peerTypingTimeoutRef.current = null;
      }
    };
  }, [activePeerId, user]);

  useEffect(() => {
    if (!user || !activePeerId) return;
    const latestUnreadFromPeer = [...activeMessages]
      .reverse()
      .find((msg) => msg.senderId === activePeerId && msg.receiverId === user.uid);
    if (!latestUnreadFromPeer) return;
    markPeerAsRead(activePeerId, latestUnreadFromPeer.createdAt);
  }, [activeMessages, activePeerId, user]);

  const requestLogin = async () => {
    await openAuthModal();
  };

  const selectPeer = (peer: ChatPeer) => {
    markPeerAsRead(peer.uid);
    setSearchParams({
      peer: peer.uid,
      name: peer.displayName,
      avatar: peer.photoURL || '',
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await requestLogin();
      return;
    }
    const content = messageInput.trim();
    if (!content || !activePeerId) return;

    setSending(true);
    try {
      const payload: Database['public']['Tables']['messages']['Insert'] = {
        sender_id: user.uid,
        receiver_id: activePeerId,
        content,
      };

      const { error } = await supabase.from('messages').insert(payload);
      if (error) throw error;
      setMessageInput('');
      updateTypingStatus(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Message send failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-12 text-center">
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">Direct Chat</h1>
          <p className="mt-3 text-on-surface-variant">Log in to connect directly with sellers and students.</p>
          <button
            onClick={requestLogin}
            className="mt-8 rounded-full bg-primary px-8 py-3 font-headline font-bold text-on-primary"
          >
            Login to Chat
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-8 px-4 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-xl font-extrabold text-on-surface">Chats</h2>
            <button
              onClick={() => navigate('/explore')}
              className="text-xs font-bold uppercase tracking-wider text-primary"
            >
              Find Users
            </button>
          </div>

          <div className="space-y-2">
            {peers.length === 0 ? (
              <p className="rounded-xl bg-surface-container p-4 text-sm text-on-surface-variant">
                No chats yet. Start by messaging a user from Explore or Community.
              </p>
            ) : (
              peers.map((peer) => (
                <button
                  key={peer.uid}
                  onClick={() => selectPeer(peer)}
                  className={`w-full rounded-xl p-3 text-left transition-colors ${
                    peer.uid === activePeerId ? 'bg-primary/10' : 'hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-on-surface">{peer.displayName}</p>
                    {(unreadByPeer[peer.uid] || 0) > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary">
                        {unreadByPeer[peer.uid]}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-lowest">
          <div className="border-b border-outline-variant/20 p-4">
            <h3 className="font-headline text-lg font-bold text-on-surface">
              {activePeer ? `Chat with ${activePeer.displayName}` : 'Select a user to start chat'}
            </h3>
            {isPeerTyping && activePeer && (
              <p className="mt-1 text-xs font-medium text-secondary">{activePeer.displayName} is typing...</p>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? (
              <p className="text-sm text-on-surface-variant">Loading messages...</p>
            ) : activeMessages.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No messages yet. Start the conversation.</p>
            ) : (
              activeMessages.map((msg) => {
                const mine = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mine ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`mt-1 text-[10px] ${mine ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-outline-variant/20 p-4">
            <div className="flex gap-3">
              <input
                value={messageInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setMessageInput(value);

                  if (!activePeerId) return;
                  const hasText = value.trim().length > 0;
                  if (hasText) updateTypingStatus(true);

                  if (stopTypingDebounceRef.current) {
                    window.clearTimeout(stopTypingDebounceRef.current);
                    stopTypingDebounceRef.current = null;
                  }
                  stopTypingDebounceRef.current = window.setTimeout(
                    () => updateTypingStatus(false),
                    hasText ? 1200 : 0
                  );
                }}
                placeholder={activePeerId ? 'Type your message...' : 'Select a user first'}
                disabled={!activePeerId || sending}
                className="h-12 flex-1 rounded-xl border border-outline-variant/30 px-4 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!activePeerId || !messageInput.trim() || sending}
                className="h-12 rounded-xl bg-primary px-6 font-headline font-bold text-on-primary disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
