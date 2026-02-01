// app/chat/page.tsx - FIXED & IMPROVED VERSION
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { format } from 'date-fns';

export default function InboxPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted'>('all');
    const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);
            await loadMatches(user.uid);
        });

        return () => unsubscribe();
    }, [router]);

    const loadMatches = async (userId: string) => {
        setLoading(true);
        console.log('Loading matches for user:', userId);

        try {
            // Query matches directly - try different field names
            const matchesRef = collection(db, 'matches');

            // Try multiple query patterns since your match structure might vary
            let querySnapshot;

            // Pattern 1: Query by userIds array (most common)
            const q1 = query(
                matchesRef,
                where('userIds', 'array-contains', userId)
            );

            // Pattern 2: Query by senderUserId or travelerUserId
            const q2 = query(
                matchesRef,
                where('senderUserId', '==', userId)
            );

            // Pattern 3: Query by travelerUserId
            const q3 = query(
                matchesRef,
                where('travelerUserId', '==', userId)
            );

            try {
                querySnapshot = await getDocs(q1);
                console.log('Query 1 results:', querySnapshot.size);

                if (querySnapshot.size === 0) {
                    const q2Snapshot = await getDocs(q2);
                    console.log('Query 2 results:', q2Snapshot.size);

                    if (q2Snapshot.size > 0) {
                        querySnapshot = q2Snapshot;
                    } else {
                        const q3Snapshot = await getDocs(q3);
                        console.log('Query 3 results:', q3Snapshot.size);
                        querySnapshot = q3Snapshot;
                    }
                }
            } catch (error) {
                console.log('Query 1 failed, trying alternative:', error);
                querySnapshot = await getDocs(q2);
            }

            console.log('Total matches found:', querySnapshot.size);

            const matchesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Match data for', doc.id, ':', data);

                // Determine user IDs from different possible structures
                let userIds: string[] = [];
                if (data.userIds && Array.isArray(data.userIds)) {
                    userIds = data.userIds;
                } else if (data.senderUserId && data.travelerUserId) {
                    userIds = [data.senderUserId, data.travelerUserId];
                } else if (data.users && Array.isArray(data.users)) {
                    userIds = data.users;
                }

                // Determine other user ID
                const otherUserId = userIds.find((id: string) => id !== userId) || '';

                return {
                    id: doc.id,
                    ...data,
                    userIds,
                    otherUserId,
                    status: data.status || 'pending',
                    createdAt: data.createdAt,
                    lastMessageAt: data.lastMessageAt || data.updatedAt || data.createdAt,
                    unreadCount: data.unreadCount || { [userId]: 0 },
                    lastMessage: data.lastMessage || null
                };
            });

            // Sort by last activity
            matchesData.sort((a, b) => {
                const getTime = (obj: any) => {
                    const ts = obj.lastMessageAt || obj.updatedAt || obj.createdAt;
                    if (!ts) return 0;
                    if (ts.toDate) return ts.toDate().getTime();
                    if (ts.seconds) return ts.seconds * 1000;
                    return new Date(ts).getTime();
                };
                return getTime(b) - getTime(a);
            });

            console.log('Processed matches:', matchesData);
            setMatches(matchesData);

            // Load user profiles
            const profiles: Record<string, any> = {};
            const uniqueUserIds = new Set<string>();

            matchesData.forEach((match) => {
                if (match.otherUserId) {
                    uniqueUserIds.add(match.otherUserId);
                }
            });

            console.log('Loading profiles for:', Array.from(uniqueUserIds));

            for (const otherUserId of Array.from(uniqueUserIds)) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (userDoc.exists()) {
                        profiles[otherUserId] = userDoc.data();
                        console.log('Loaded profile for:', otherUserId, userDoc.data());
                    }
                } catch (error) {
                    console.error('Error loading profile for', otherUserId, error);
                }
            }

            setUserProfiles(profiles);

        } catch (error) {
            console.error('Error loading matches:', error);
        }

        setLoading(false);
    };

    const getOtherUser = (match: any) => {
        if (!user) return null;

        const otherUserId = match.otherUserId;
        if (!otherUserId) return null;

        const profile = userProfiles[otherUserId];

        return {
            id: otherUserId,
            ...profile,
            displayName: profile?.fullName || profile?.displayName || profile?.email?.split('@')[0] || 'User',
            userType: profile?.userType || 'user',
            avatarLetter: (profile?.fullName?.charAt(0) || profile?.email?.charAt(0) || 'U').toUpperCase()
        };
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';

        try {
            let date: Date;

            // Handle Firestore Timestamp
            if (timestamp?.toDate) {
                date = timestamp.toDate();
            } else if (timestamp?.seconds) {
                date = new Date(timestamp.seconds * 1000);
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                date = new Date(timestamp);
            }

            if (isNaN(date.getTime())) return '';

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 1) {
                const diffMinutes = Math.floor(diffHours * 60);
                return `${diffMinutes}m ago`;
            } else if (diffHours < 24) {
                return `${Math.floor(diffHours)}h ago`;
            } else if (diffHours < 168) {
                return `${Math.floor(diffHours / 24)}d ago`;
            } else {
                return format(date, 'MMM d');
            }
        } catch {
            return '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' };
            case 'accepted': return { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' };
            default: return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💬' };
        }
    };

    const getTypeIcon = (userType: string) => {
        return userType === 'sender' ? '📦' : userType === 'traveler' ? '✈️' : '👤';
    };

    const filteredMatches = matches.filter(match => {
        if (activeFilter === 'all') return true;
        return match.status === activeFilter;
    });

    const stats = {
        total: matches.length,
        pending: matches.filter(m => m.status === 'pending').length,
        accepted: matches.filter(m => m.status === 'accepted').length,
        unread: matches.reduce((total, match) => {
            return total + (match.unreadCount?.[user?.uid] || 0);
        }, 0),
    };

    const handleRefresh = () => {
        if (user) {
            loadMatches(user.uid);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your conversations...</p>
                        <button
                            onClick={() => setLoading(false)}
                            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                        >
                            Cancel loading
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                            <p className="text-gray-600 mt-2">
                                Chat with your connections about package details
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Link
                                href="/listings"
                                className="px-4 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                            >
                                Browse Listings
                            </Link>
                            <Link
                                href="/dashboard/listings"
                                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-sm transition-all"
                            >
                                My Listings
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-sm text-gray-500">Total Conversations</div>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-gray-500">Pending</div>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                            <div className="text-sm text-gray-500">Accepted</div>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
                            <div className="text-sm text-gray-500">Unread Messages</div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'All', count: stats.total },
                                { value: 'pending', label: 'Pending', count: stats.pending },
                                { value: 'accepted', label: 'Accepted', count: stats.accepted },
                            ].map((filter) => {
                                const isActive = activeFilter === filter.value;
                                return (
                                    <button
                                        key={filter.value}
                                        onClick={() => setActiveFilter(filter.value as any)}
                                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm'
                                            : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        <span>{filter.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${isActive
                                            ? 'bg-white/20'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {filter.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh</span>
                            </button>

                            {stats.unread > 0 && (
                                <button
                                    onClick={() => {
                                        // Optional: Mark all as read functionality
                                        alert('Mark all as read feature would go here');
                                    }}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Matches List */}
                {filteredMatches.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-3">No conversations yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {activeFilter === 'all'
                                ? "Connect with travelers or senders by browsing listings and sending connection requests."
                                : `You don't have any ${activeFilter} conversations.`}
                        </p>
                        <div className="space-x-4">
                            <Link
                                href="/listings"
                                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-sm transition-all"
                            >
                                Browse Listings
                            </Link>
                            <Link
                                href="/dashboard/listings"
                                className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                            >
                                View My Listings
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {filteredMatches.map((match) => {
                                const otherUser = getOtherUser(match);
                                const unreadCount = match.unreadCount?.[user?.uid] || 0;
                                const statusColors = getStatusColor(match.status);
                                const lastMessageTime = formatTime(match.lastMessageAt);

                                return (
                                    <Link
                                        key={match.id}
                                        href={`/chat/${match.id}`}
                                        className="block hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-1 min-w-0">
                                                    {/* Avatar with Status */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                            <span className="text-xl font-bold text-blue-600">
                                                                {otherUser?.avatarLetter || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs ${statusColors.bg} ${statusColors.text}`}>
                                                            {statusColors.icon}
                                                        </div>
                                                        {unreadCount > 0 && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                                                                {unreadCount}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <h3 className="font-bold truncate text-gray-900">
                                                                    {otherUser?.displayName || 'User'}
                                                                </h3>
                                                                <span className="text-sm text-gray-500">
                                                                    {getTypeIcon(otherUser?.userType)} {otherUser?.userType || 'User'}
                                                                </span>
                                                            </div>
                                                            {lastMessageTime && (
                                                                <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
                                                                    {lastMessageTime}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                                                {match.status?.charAt(0).toUpperCase() + match.status?.slice(1)}
                                                            </span>
                                                            {match.listingIds?.[0] && (
                                                                <span className="text-xs text-gray-500">
                                                                    • Listing connected
                                                                </span>
                                                            )}
                                                        </div>

                                                        {match.lastMessage ? (
                                                            <p className="text-gray-600 truncate">
                                                                {match.lastMessage.senderId === user?.uid ? (
                                                                    <span className="text-blue-600 font-medium">You: </span>
                                                                ) : ''}
                                                                {match.lastMessage.content}
                                                            </p>
                                                        ) : (
                                                            <p className="text-gray-500 italic text-sm">Start the conversation...</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Chevron */}
                                                <div className="ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Actions & Tips */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                💡
                            </span>
                            Chatting Best Practices
                        </h3>
                        <ul className="space-y-3 text-blue-800">
                            <li className="flex items-start space-x-3">
                                <span className="text-blue-500 mt-1">•</span>
                                <span className="text-sm">Always confirm meeting details 24h in advance</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <span className="text-blue-500 mt-1">•</span>
                                <span className="text-sm">Share photos of items for verification</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <span className="text-blue-500 mt-1">•</span>
                                <span className="text-sm">Discuss payment method before meeting</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <span className="text-blue-500 mt-1">•</span>
                                <span className="text-sm">Keep communication within FlySend for safety</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                🛡️
                            </span>
                            Safety Guidelines
                        </h3>
                        <ul className="space-y-3 text-green-800">
                            <li className="flex items-start space-x-3">
                                <span className="text-green-500 mt-1">•</span>
                                <span className="text-sm">Meet in public, well-lit areas</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <span className="text-green-500 mt-1">•</span>
                                <span className="text-sm">Bring a friend if possible</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <span className="text-green-500 mt-1">•</span>
                                <span className="text-sm">Inspect items together before payment</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <span className="text-green-500 mt-1">•</span>
                                <span className="text-sm">Verify identity through profile verification</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}