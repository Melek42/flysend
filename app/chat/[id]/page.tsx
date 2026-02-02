// app/chat/[id]/page.tsx - CREATE THIS FILE
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    getMatchMessages,
    sendMessage,
    markMessagesAsRead,
    subscribeToMatchMessages
} from '@/lib/chat';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [match, setMatch] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const matchId = params.id as string;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);
            await loadMatch();
        });

        return () => unsubscribe();
    }, [matchId, router]);

    useEffect(() => {
        if (match && user) {
            // Mark messages as read when opening chat
            markMessagesAsRead(matchId, user.uid);

            // Set up real-time listener for messages
            const unsubscribe = subscribeToMatchMessages(matchId, (newMessages) => {
                setMessages(newMessages);
                scrollToBottom();

                // Mark new messages as read
                if (user) {
                    const unreadMessages = newMessages.filter(
                        msg => !msg.read && msg.receiverId === user.uid
                    );
                    if (unreadMessages.length > 0) {
                        markMessagesAsRead(matchId, user.uid);
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [matchId, match, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Update app/chat/[id]/page.tsx - Fix loading state
    const loadMatch = async () => {
        setLoading(true);

        try {
            // Get match details
            const matchDoc = await getDoc(doc(db, 'matches', matchId));
            if (!matchDoc.exists()) {
                router.push('/chat');
                return;
            }

            const matchData = matchDoc.data();
            setMatch({ id: matchDoc.id, ...matchData });

            // Determine other user
            if (user) {
                const otherUserId = matchData.userIds.find((id: string) => id !== user.uid);
                if (otherUserId) {
                    const userDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (userDoc.exists()) {
                        setOtherUser(userDoc.data());
                    }
                }
            }

            // Load initial messages
            const messagesResult = await getMatchMessages(matchId);
            if (messagesResult.success) {
                setMessages(messagesResult.messages || []);
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }

        setLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !match) return;

        setSending(true);

        const otherUserId = match.userIds.find((id: string) => id !== user.uid);

        if (otherUserId) {
            const result = await sendMessage(matchId, user.uid, otherUserId, newMessage.trim());

            if (result.success) {
                setNewMessage('');
            }
        }

        setSending(false);
    };

    const formatMessageTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

            if (diffHours < 24) {
                return format(date, 'h:mm a');
            } else {
                return format(date, 'MMM d, h:mm a');
            }
        } catch {
            return dateString;
        }
    };

    const formatDateHeader = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();

            if (date.toDateString() === now.toDateString()) {
                return 'Today';
            }

            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            }

            return format(date, 'MMMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = new Date(message.createdAt).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {} as Record<string, any[]>);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading conversation...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            href="/chat"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        >
                            ← Back to Inbox
                        </Link>

                        <div className="flex items-center space-x-3">
                            <Link
                                href={`/listings/${match?.listingIds?.[0] || '#'}`}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                View Listing
                            </Link>
                        </div>
                    </div>

                    {/* Chat Header */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-white shadow-lg flex items-center justify-center">
                                    <span className="text-2xl font-bold text-blue-600">
                                        {otherUser?.fullName?.charAt(0) || otherUser?.email?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Chat with {otherUser?.fullName || 'User'}
                                    </h1>
                                    <p className="text-gray-600 flex items-center space-x-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${match?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                match?.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {match?.status?.charAt(0).toUpperCase() + match?.status?.slice(1)}
                                        </span>
                                        <span>•</span>
                                        <span>{otherUser?.userType === 'sender' ? '📦 Sender' : '✈️ Traveler'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm text-gray-500">Match Created</div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Container */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    {/* Messages Area */}
                    <div
                        ref={chatContainerRef}
                        className="h-[60vh] overflow-y-auto p-6 bg-gradient-to-b from-gray-50/50 to-white scrollbar-thin"
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 mb-6 text-gray-300">
                                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
                                <p className="text-gray-600 max-w-md">
                                    Introduce yourself and discuss the package details. Be clear about meeting arrangements and pricing.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">


{Object.entries(groupedMessages).map(([date, dateMessages]) => {
    // Type assertion for dateMessages
    const messagesArray = dateMessages as any[];
    
    return (
        <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-6">
                <div className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                    {formatDateHeader(date)}
                </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-4">
                {messagesArray.map((message, index) => {
                    const isOwn = message.senderId === user?.uid;
                    const showAvatar = index === 0 ||
                        messagesArray[index - 1]?.senderId !== message.senderId;

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
                        >
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                {!isOwn && showAvatar && (
                                    <div className="flex items-end space-x-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-sm font-medium text-blue-600">
                                            {otherUser?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <span className="text-sm text-gray-600">{otherUser?.fullName || 'User'}</span>
                                    </div>
                                )}

                                <div className={`relative ${isOwn ? 'mr-2' : 'ml-10'}`}>
                                    <div
                                        className={`px-4 py-3 rounded-2xl ${isOwn
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                    </div>
                                    <div
                                        className={`text-xs mt-1 ${isOwn ? 'text-right text-gray-500' : 'text-gray-400'
                                            }`}
                                    >
                                        {formatMessageTime(message.createdAt)}
                                        {isOwn && (
                                            <span className="ml-2">
                                                {message.read ? '✅ Read' : '✓ Sent'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isOwn && showAvatar && (
                                <div className="order-1 mr-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-sm font-medium text-green-600">
                                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'Y'}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
})}


                                
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-gray-200 p-4 bg-white">
                        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                            <div className="flex-1">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    placeholder="Type your message here... Press Enter to send, Shift+Enter for new line."
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    rows={1}
                                    style={{ minHeight: '44px', maxHeight: '120px' }}
                                    disabled={sending}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                            >
                                {sending ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending
                                    </div>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </form>

                        <div className="mt-3 text-sm text-gray-500 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button className="flex items-center space-x-1 hover:text-blue-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Photo</span>
                                </button>
                                <button className="flex items-center space-x-1 hover:text-blue-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span>Attachment</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${match?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        match?.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            'bg-blue-100 text-blue-800'
                                    }`}>
                                    {match?.status?.charAt(0).toUpperCase() + match?.status?.slice(1)}
                                </span>
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                        <h4 className="font-bold mb-3 flex items-center">
                            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                🤝
                            </span>
                            Meeting Arrangements
                        </h4>
                        <p className="text-blue-800 text-sm mb-3">
                            Discuss and confirm meeting details like location, time, and handover process.
                        </p>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Suggest Meeting →
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                        <h4 className="font-bold mb-3 flex items-center">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                💰
                            </span>
                            Price & Payment
                        </h4>
                        <p className="text-green-800 text-sm mb-3">
                            Agree on final price and discuss payment method (cash, mobile money, etc.)
                        </p>
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                            Discuss Payment →
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                        <h4 className="font-bold mb-3 flex items-center">
                            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                📝
                            </span>
                            Item Details
                        </h4>
                        <p className="text-purple-800 text-sm mb-3">
                            Share photos, dimensions, and special handling instructions for the package.
                        </p>
                        <Link
                            href={`/listings/${match?.listingIds?.[0] || '#'}`}
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                            View Listing →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
