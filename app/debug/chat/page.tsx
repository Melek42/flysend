// app/debug/chat/page.tsx - CREATE THIS FILE
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ChatDebugPage() {
    const [user, setUser] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                loadChatData(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    const loadChatData = async (userId: string) => {
        setLoading(true);

        try {
            console.log('Loading chat data for user:', userId);

            // 1. Get matches
            const matchesQuery = query(
                collection(db, 'matches'),
                where('userIds', 'array-contains', userId)
            );

            const matchesSnapshot = await getDocs(matchesQuery);
            const matchesData: any[] = [];
            matchesSnapshot.forEach((doc) => {
                matchesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('Matches found:', matchesData);
            setMatches(matchesData);

            // 2. Get all messages
            const messagesSnapshot = await getDocs(collection(db, 'messages'));
            const messagesData: any[] = [];
            messagesSnapshot.forEach((doc) => {
                messagesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('Messages found:', messagesData);
            setMessages(messagesData);

        } catch (error) {
            console.error('Chat debug error:', error);
        }

        setLoading(false);
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Chat Debug</h1>

            <div className="mb-6">
                <p>User: {user?.email || 'Not logged in'}</p>
                <p>User ID: {user?.uid || 'N/A'}</p>
            </div>

            {loading ? (
                <p>Loading chat data...</p>
            ) : (
                <>
                    {/* Matches */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-3">Matches ({matches.length})</h2>
                        {matches.length === 0 ? (
                            <p className="text-gray-600">No matches found.</p>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded overflow-auto">
                                <pre className="text-sm">{JSON.stringify(matches, null, 2)}</pre>
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-3">All Messages ({messages.length})</h2>
                        {messages.length === 0 ? (
                            <p className="text-gray-600">No messages found.</p>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded overflow-auto">
                                <pre className="text-sm">{JSON.stringify(messages, null, 2)}</pre>
                            </div>
                        )}
                    </div>

                    {/* Database Structure */}
                    <div className="p-4 bg-blue-50 rounded">
                        <h3 className="font-bold mb-2">Required Database Structure:</h3>
                        <div className="text-sm">
                            <p><strong>matches collection:</strong></p>
                            <pre>{`{
  senderUserId: "user123",
  travelerUserId: "user456",
  userIds: ["user123", "user456"],
  status: "pending",
  unreadCount: {
    user123: 0,
    user456: 1
  },
  lastMessage: {
    content: "Hello",
    senderId: "user123",
    createdAt: timestamp
  },
  lastMessageAt: timestamp
}`}</pre>

                            <p className="mt-4"><strong>messages collection:</strong></p>
                            <pre>{`{
  matchId: "match123",
  senderId: "user123",
  receiverId: "user456",
  content: "Hello",
  read: false,
  createdAt: timestamp
}`}</pre>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}