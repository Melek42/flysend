// app/dashboard/listings/page.tsx - CREATE THIS FILE
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserListings, deleteListing } from '@/lib/listings';
import Link from 'next/link';
import { format } from 'date-fns';

export default function MyListingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'matched' | 'completed'>('all');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);

            // Fetch user profile
            try {
                const profileDoc = await getDoc(doc(db, 'users', user.uid));
                if (profileDoc.exists()) {
                    setProfile(profileDoc.data());
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }

            loadListings();
        });

        return () => unsubscribe();
    }, [router]);

    const loadListings = async () => {
        if (!user) return;

        setLoading(true);
        const result = await getUserListings(user.uid);

        if (result.success) {
            setListings(result.listings);
        }
        setLoading(false);
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        setDeletingId(listingId);

        const result = await deleteListing(listingId);

        if (result.success) {
            setMessage('Listing deleted successfully.');
            // Refresh listings
            loadListings();
            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } else {
            alert('Failed to delete listing. Please try again.');
        }

        setDeletingId(null);
    };

    const handleStatusChange = async (listingId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'listings', listingId), {
                status: newStatus,
                updatedAt: new Date()
            });

            setMessage('Listing status updated.');
            loadListings();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    const getDaysUntil = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            const diffTime = date.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Tomorrow';
            if (diffDays > 0) return `In ${diffDays} days`;
            return 'Past date';
        } catch {
            return 'Invalid date';
        }
    };

    const filteredListings = listings.filter(listing => {
        if (filter === 'all') return true;
        return listing.status === filter;
    });

    const stats = {
        total: listings.length,
        active: listings.filter(l => l.status === 'active').length,
        matched: listings.filter(l => l.status === 'matched').length,
        completed: listings.filter(l => l.status === 'completed').length,
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your listings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center mb-4"
                >
                    ← Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                        <p className="text-gray-600 mt-2">
                            Manage your package requests and travel plans
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <Link
                            href="/dashboard/send"
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-sm"
                        >
                            + Send Package
                        </Link>
                        <Link
                            href="/dashboard/travel"
                            className="px-5 py-2.5 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium"
                        >
                            + Post Travel Plan
                        </Link>
                    </div>
                </div>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {message}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Listings</div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                    <div className="text-sm text-gray-500">Active</div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-600">{stats.matched}</div>
                    <div className="text-sm text-gray-500">Matched</div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'all', label: 'All Listings', count: stats.total },
                        { value: 'active', label: 'Active', count: stats.active },
                        { value: 'matched', label: 'Matched', count: stats.matched },
                        { value: 'completed', label: 'Completed', count: stats.completed },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setFilter(item.value as any)}
                            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${filter === item.value
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span>{item.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${filter === item.value
                                    ? 'bg-blue-200 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {item.count}
                            </span>
                        </button>
                    ))}

                    <button
                        onClick={loadListings}
                        className="ml-auto px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Listings Table */}
            {filteredListings.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 text-gray-200">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">No listings found</h3>
                    <p className="text-gray-600 mb-6">
                        {filter === 'all'
                            ? "You haven't created any listings yet. Start by posting what you want to send or your travel plans."
                            : `You don't have any ${filter} listings.`}
                    </p>
                    <div className="space-x-4">
                        <Link
                            href="/dashboard/send"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                        >
                            Send Your First Package
                        </Link>
                        <Link
                            href="/dashboard/travel"
                            className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50"
                        >
                            Post Travel Plan
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Listing</th>
                                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Status</th>
                                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Dates</th>
                                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Stats</th>
                                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredListings.map((listing) => (
                                    <tr key={listing.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <Link href={`/listings/${listing.id}`} className="block hover:text-blue-600">
                                                <div className="flex items-start space-x-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${listing.type === 'sender' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                        }`}>
                                                        {listing.type === 'sender' ? '📦' : '✈️'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {listing.origin} → {listing.destination}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {listing.type === 'sender'
                                                                ? `${listing.itemWeight}kg ${listing.itemType}`
                                                                : `${listing.availableSpace}kg available`
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>

                                        <td className="py-4 px-6">
                                            <select
                                                value={listing.status}
                                                onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        listing.status === 'matched' ? 'bg-yellow-100 text-yellow-800' :
                                                            listing.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    } border-none focus:ring-2 focus:ring-blue-500`}
                                            >
                                                <option value="active">Active</option>
                                                <option value="matched">Matched</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="text-sm">
                                                <div className="font-medium">{formatDate(listing.neededByDate || listing.departureDate)}</div>
                                                <div className="text-gray-500">{getDaysUntil(listing.neededByDate || listing.departureDate)}</div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="flex space-x-4">
                                                <div className="text-center">
                                                    <div className="font-bold">{listing.views || 0}</div>
                                                    <div className="text-xs text-gray-500">Views</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-blue-600">{listing.matches || 0}</div>
                                                    <div className="text-xs text-gray-500">Matches</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/listings/${listing.id}`}
                                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    View
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(listing.id)}
                                                    disabled={deletingId === listing.id}
                                                    className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    {deletingId === listing.id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tips Section */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-3">💡 Listing Management Tips</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-2 text-blue-700">For Active Listings</h4>
                        <ul className="space-y-1 text-blue-800 text-sm">
                            <li>• Respond quickly to messages (within 24 hours)</li>
                            <li>• Update listing if dates or details change</li>
                            <li>• Use "Matched" status when you find a connection</li>
                            <li>• Mark as "Completed" after successful delivery</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2 text-green-700">For Better Results</h4>
                        <ul className="space-y-1 text-green-800 text-sm">
                            <li>• Include clear photos when possible</li>
                            <li>• Be specific about meeting locations</li>
                            <li>• Set realistic prices based on market rates</li>
                            <li>• Be flexible with dates to get more matches</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}