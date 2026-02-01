// app/dashboard/page.tsx - UPDATED VERSION
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserListings } from '@/lib/listings'; // Import this function
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<any[]>([]); // Add this state

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

            // Fetch user listings
            await loadListings(user.uid);

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Add this function to load listings
    const loadListings = async (userId: string) => {
        const result = await getUserListings(userId);
        if (result.success) {
            setListings(result.listings);
        }
    };

    // Add this helper function
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Recently';
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh]">
            <div className="max-w-6xl mx-auto">
                {/* Dashboard Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome back, {profile?.fullName || user?.displayName}!</h1>
                            <p className="text-gray-600 mt-1">
                                {profile?.userType === 'sender'
                                    ? 'You can now post items you want to send.'
                                    : 'You can now post your travel plans and available space.'}
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                await auth.signOut();
                                router.push('/');
                            }}
                            className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium">Account Type</div>
                            <div className="text-lg font-semibold capitalize mt-1">
                                {profile?.userType || 'Not set'}
                            </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm text-green-600 font-medium">Verification</div>
                            <div className="text-lg font-semibold mt-1">
                                {user?.emailVerified ? '✅ Verified' : '⏳ Pending'}
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-sm text-purple-600 font-medium">Country</div>
                            <div className="text-lg font-semibold mt-1">
                                {profile?.country || 'Not set'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Action Cards - ADD THIS SECTION */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link
                        href="/dashboard/send"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                            </div>
                            <div>
                                <div className="font-bold text-lg">Send a Package</div>
                                <div className="text-blue-100 text-sm">Post items you want to send</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/travel"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">✈️</span>
                            </div>
                            <div>
                                <div className="font-bold text-lg">Post Travel Plan</div>
                                <div className="text-green-100 text-sm">Earn money with spare luggage space</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/listings"
                        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🔍</span>
                            </div>
                            <div>
                                <div className="font-bold text-lg">Browse Listings</div>
                                <div className="text-purple-100 text-sm">Find packages or travelers</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* My Listings Stats - ADD THIS SECTION */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">My Listings Overview</h2>
                        <Link
                            href="/dashboard/listings"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View All →
                        </Link>
                    </div>

                    {listings.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="font-semibold mb-2">No listings yet</h3>
                            <p className="text-gray-600 mb-4">Create your first listing to start connecting</p>
                            <div className="space-x-3">
                                <Link
                                    href="/dashboard/send"
                                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    Send Package
                                </Link>
                                <Link
                                    href="/dashboard/travel"
                                    className="inline-block border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm"
                                >
                                    Travel with Packages
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: 'Total', value: listings.length, color: 'text-gray-700' },
                                    { label: 'Active', value: listings.filter(l => l.status === 'active').length, color: 'text-blue-700' },
                                    { label: 'Matched', value: listings.filter(l => l.status === 'matched').length, color: 'text-yellow-700' },
                                    { label: 'Completed', value: listings.filter(l => l.status === 'completed').length, color: 'text-green-700' },
                                ].map((stat, index) => (
                                    <div key={index} className="text-center p-4 rounded-lg border">
                                        <div className={`text-2xl font-bold mb-1 ${stat.color}`}>
                                            {stat.value}
                                        </div>
                                        <div className="text-sm text-gray-600">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Listings */}
                            <div>
                                <h3 className="font-medium mb-3">Recent Listings</h3>
                                <div className="space-y-3">
                                    {listings.slice(0, 3).map((listing) => (
                                        <Link
                                            key={listing.id}
                                            href={`/listings/${listing.id}`}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-3">
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
                                            <div className="text-right">
                                                <div className={`px-2 py-1 rounded-full text-xs ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        listing.status === 'matched' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {listing.status}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {formatDate(listing.createdAt)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Dashboard Content */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                {profile?.userType === 'sender' ? (
                                    <>
                                        <Link
                                            href="/dashboard/send"
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Send a Package</div>
                                                    <div className="text-sm text-gray-500">Post what you want to send</div>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>

                                        <Link
                                            href="/dashboard/listings"
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Active Requests</div>
                                                    <div className="text-sm text-gray-500">View your active listings</div>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/dashboard/travel"
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Post Travel Plan</div>
                                                    <div className="text-sm text-gray-500">Add your flight details</div>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>

                                        <Link
                                            href="/dashboard/listings"
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Available Space</div>
                                                    <div className="text-sm text-gray-500">Manage your capacity</div>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Getting Started</h2>
                            <ul className="space-y-3">
                                <li className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${user?.emailVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {user?.emailVerified ? '✓' : '1'}
                                    </div>
                                    <span className={user?.emailVerified ? 'text-gray-900' : 'text-gray-600'}>
                                        Verify your email address
                                    </span>
                                </li>
                                <li className="flex items-center space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                        2
                                    </div>
                                    <span className="text-gray-600">
                                        Complete your profile
                                    </span>
                                </li>
                                <li className="flex items-center space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                        3
                                    </div>
                                    <span className="text-gray-600">
                                        {profile?.userType === 'sender'
                                            ? 'Post your first item to send'
                                            : 'Post your first travel plan'}
                                    </span>
                                </li>
                                <li className="flex items-center space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                        4
                                    </div>
                                    <span className="text-gray-600">
                                        Connect with your first match
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Profile Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Your Profile</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-500">Name</div>
                                    <div className="font-medium">{profile?.fullName || 'Not set'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Email</div>
                                    <div className="font-medium">{user?.email}</div>
                                    {!user?.emailVerified && (
                                        <div className="text-sm text-amber-600 mt-1">
                                            ⚠️ Please verify your email
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Phone</div>
                                    <div className="font-medium">{profile?.phone || 'Not set'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Member Since</div>
                                    <div className="font-medium">
                                        {profile?.createdAt
                                            ? formatDate(profile.createdAt)
                                            : 'Recently'}
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard/profile"
                                    className="inline-block mt-2 text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    Edit Profile →
                                </Link>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="font-bold text-blue-800 mb-3">💡 Tips for Success</h3>
                            <ul className="space-y-2 text-blue-700">
                                <li className="flex items-start space-x-2">
                                    <span>•</span>
                                    <span>Complete your profile to build trust</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span>•</span>
                                    <span>Be clear about what you're sending or carrying</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span>•</span>
                                    <span>Communicate clearly with matches</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span>•</span>
                                    <span>Leave reviews after successful deliveries</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}