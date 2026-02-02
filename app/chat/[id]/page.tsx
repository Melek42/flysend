// app/chat/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [match, setMatch] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState<any>(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const matchId = params.id as string;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                loadChatData(currentUser);
            } else {
                router.push('/login?returnTo=' + encodeURIComponent(`/chat/${matchId}`));
            }
        });

        return () => unsubscribe();
    }, [matchId]);

    const loadChatData = async (currentUser: any) => {
        setLoading(true);

        try {
            // Load match details
            const matchDoc = await getDoc(doc(db, 'matches', matchId));
            if (!matchDoc.exists()) {
                console.error('Match not found');
                router.push('/chat');
                return;
            }

            const matchData = matchDoc.data();
            setMatch({ id: matchDoc.id, ...matchData });

            // Determine which user is the other party
            const otherUserId = 
                matchData.senderUserId === currentUser.uid 
                    ? matchData.travelerUserId 
                    : matchData.senderUserId;

            // Load other user's profile
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (otherUserDoc.exists()) {
                setOtherUser({ id: otherUserDoc.id, ...otherUserDoc.data() });
            }

            // Load messages for this match
            const messagesQuery = query(
                collection(db, 'messages'),
                where('matchId', '==', matchId),
                orderBy('createdAt', 'asc')
            );

            const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
                const loadedMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore timestamp to Date if needed
                    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
                }));
                setMessages(loadedMessages);

                // Mark messages as read
                markMessagesAsRead(currentUser.uid, loadedMessages);
            });

            // Cleanup on unmount
            return () => unsubscribeMessages();

        } catch (error) {
            console.error('Error loading chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async (userId: string, messages: any[]) => {
        try {
            const unreadMessages = messages.filter(
                msg => !msg.read && msg.receiverId === userId
            );

            for (const msg of unreadMessages) {
                await updateDoc(doc(db, 'messages', msg.id), {
                    read: true
                });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !user || !match) return;

        setSending(true);

        try {
            const otherUserId = 
                match.senderUserId === user.uid 
                    ? match.travelerUserId 
                    : match.senderUserId;

            // Add message to Firestore
            await addDoc(collection(db, 'messages'), {
                matchId,
                senderId: user.uid,
                receiverId: otherUserId,
                content: newMessage.trim(),
                read: false,
                createdAt: serverTimestamp()
            });

            // Update match with last message
            await updateDoc(doc(db, 'matches', matchId), {
                lastMessage: {
                    content: newMessage.trim(),
                    senderId: user.uid,
                    createdAt: serverTimestamp()
                },
                updatedAt: serverTimestamp()
            });

            setNewMessage('');
            scrollToBottom();

        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatMessageTime = (timestamp: any) => {
        if (!timestamp) return '';
        
        try {
            let date: Date;
            
            if (timestamp.toDate) {
                date = timestamp.toDate();
            } else if (timestamp.seconds) {
                date = new Date(timestamp.seconds * 1000);
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                date = new Date(timestamp);
            }
            
            return format(date, 'h:mm a');
        } catch {
            return '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading chat...</p>
                </div>
            </div>
        );
    }

    if (!match || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 text-gray-300">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Chat Not Found</h2>
                    <p className="text-gray-600 mb-6">This chat doesn't exist or you don't have permission to view it.</p>
                    <Link
                        href="/chat"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        Back to Inbox
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
            <div className="container mx-auto px-4 py-8">
                {/* Header with back button */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/chat"
                            className="flex items-center text-gray-600 hover:text-blue-600"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Inbox
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {otherUser?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">{otherUser?.fullName || 'User'}</h1>
                                <p className="text-sm text-gray-600">
                                    {match.status === 'pending' ? 'Pending Connection' : 'Connected'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${match.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                            {match.status === 'pending' ? 'Pending' : 'Connected'}
                        </span>
                    </div>
                </div>

                {/* Chat Container */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 mx-auto mb-6 text-gray-200">
                                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No messages yet</h3>
                                <p className="text-gray-500">Start the conversation by sending a message!</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isOwnMessage = message.senderId === user.uid;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                                            <div
                                                className={`rounded-2xl px-4 py-3 ${isOwnMessage
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none'
                                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                            </div>
                                            <div className={`flex items-center space-x-2 mt-1 text-xs ${isOwnMessage ? 'justify-end' : 'justify-start'
                                                }`}>
                                                <span className="text-gray-500">
                                                    {formatMessageTime(message.createdAt)}
                                                </span>
                                                {isOwnMessage && (
                                                    <span className={message.read ? 'text-blue-500' : 'text-gray-400'}>
                                                        {message.read ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {!isOwnMessage && (
                                            <div className="order-1 mr-3">
                                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {otherUser?.fullName?.charAt(0) || 'U'}
                                                </div>
                                            </div>
                                        )}
                                        {isOwnMessage && (
                                            <div className="order-3 ml-3">
                                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {user?.displayName?.charAt(0) || 'Y'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-gray-200 p-4">
                        <form onSubmit={handleSendMessage} className="flex space-x-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium"
                            >
                                {sending ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Press Enter to send • Messages are end-to-end encrypted
                        </p>
                    </div>
                </div>

                {/* Chat Info Panel */}
                <div className="mt-6 bg-white rounded-2xl shadow p-6 border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Chat Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">Connection Details</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium ${match.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                        {match.status === 'pending' ? 'Pending Approval' : 'Active'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Started:</span>
                                    <span className="font-medium">
                                        {formatMessageTime(match.createdAt) || 'Recently'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Messages:</span>
                                    <span className="font-medium">{messages.length}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">Safety Tips</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Always meet in public places
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Verify package contents together
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Use secure payment methods
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Report any suspicious behavior
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
