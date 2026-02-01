// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalListings: 0,
        totalMatches: 0,
        totalMessages: 0,
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            // Check if admin (simple check for now)
            const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
            const userData = userDoc.docs[0]?.data();

            // In real app, you'd have an admin field
            setUser(user);
            loadStats();
        });

        return () => unsubscribe();
    }, [router]);

    const loadStats = async () => {
        try {
            // Get counts
            const [usersSnapshot, listingsSnapshot, matchesSnapshot, messagesSnapshot] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'listings')),
                getDocs(collection(db, 'matches')),
                getDocs(collection(db, 'messages')),
            ]);

            setStats({
                totalUsers: usersSnapshot.size,
                totalListings: listingsSnapshot.size,
                totalMatches: matchesSnapshot.size,
                totalMessages: messagesSnapshot.size,
            });

            // Get recent users
            const recentUsersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const recentUsersSnapshot = await getDocs(recentUsersQuery);
            const users = recentUsersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentUsers(users);

        } catch (error) {
            console.error('Error loading stats:', error);
        }

        setLoading(false);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <div className="text-gray-600">Total Users</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="text-2xl font-bold text-green-600">{stats.totalListings}</div>
                    <div className="text-gray-600">Total Listings</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalMatches}</div>
                    <div className="text-gray-600">Total Matches</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="text-2xl font-bold text-yellow-600">{stats.totalMessages}</div>
                    <div className="text-gray-600">Total Messages</div>
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Recent Users</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Email</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-left p-3">Joined</th>
                                <th className="text-left p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.map((user) => (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{user.fullName}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.userType === 'sender' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.userType}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                        <Link
                                            href={`/users/${user.id}`}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold mb-4">Content Moderation</h3>
                    <div className="space-y-2">
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">Review Listings</Link>
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">Manage Users</Link>
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">View Reports</Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold mb-4">Analytics</h3>
                    <div className="space-y-2">
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">View Reports</Link>
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">User Growth</Link>
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">Revenue Stats</Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold mb-4">System</h3>
                    <div className="space-y-2">
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">Server Status</Link>
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">Backup Data</Link>
                        <Link href="#" className="block text-blue-600 hover:text-blue-800">Settings</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}