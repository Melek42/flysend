// app/dashboard/listings/[id]/page.tsx - CREATE THIS FILE
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getListing } from '@/lib/listings';
import Link from 'next/link';

export default function DashboardListingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const listingId = params.id as string;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);
            await loadListing(user.uid);
        });

        return () => unsubscribe();
    }, [listingId, router]);

    const loadListing = async (userId: string) => {
        setLoading(true);

        try {
            const result = await getListing(listingId);
            if (result.success) {
                // Check if this listing belongs to the current user
                if (result.listing.userId !== userId) {
                    router.push('/dashboard/listings');
                    return;
                }

                setListing(result.listing);
            } else {
                setError('Listing not found.');
            }
        } catch (error) {
            console.error('Error loading listing:', error);
            setError('Failed to load listing.');
        }

        setLoading(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true);
        setMessage('');

        try {
            await updateDoc(doc(db, 'listings', listingId), {
                status: newStatus,
                updatedAt: new Date()
            });

            setListing({ ...listing, status: newStatus });
            setMessage(`Listing status updated to ${newStatus}.`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating status:', error);
            setError('Failed to update status.');
        }

        setUpdating(false);
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading listing details...</p>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 text-gray-300">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Listing Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'This listing does not exist or you do not have access to it.'}</p>
                    <Link
                        href="/dashboard/listings"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        Back to My Listings
                    </Link>
                </div>
            </div>
        );
    }

    const isSender = listing.type === 'sender';

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/listings"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center mb-4"
                >
                    ← Back to My Listings
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Listing</h1>
                    <Link
                        href={`/listings/${listingId}`}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                        target="_blank"
                    >
                        View Public Page
                    </Link>
                </div>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Listing Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
                {/* Header */}
                <div className={`p-6 ${isSender ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSender ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                <span className="text-2xl">{isSender ? '📦' : '✈️'}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {listing.origin} → {listing.destination}
                                </h2>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
                                            listing.status === 'matched' ? 'bg-yellow-100 text-yellow-800' :
                                                listing.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        Posted {formatDate(listing.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-medium mb-2">Listing Details</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium">{isSender ? 'Package to Send' : 'Traveler Available'}</span>
                                </div>
                                {isSender ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Item:</span>
                                            <span className="font-medium">{listing.itemDescription}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Weight:</span>
                                            <span className="font-medium">{listing.itemWeight} kg</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Available Space:</span>
                                            <span className="font-medium">{listing.availableSpace} kg</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Airline:</span>
                                            <span className="font-medium">{listing.airline || 'Not specified'}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Price:</span>
                                    <span className="font-medium">${listing.price} {listing.priceCurrency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Deadline:</span>
                                    <span className="font-medium">{formatDate(listing.neededByDate || listing.departureDate)}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Statistics</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Views:</span>
                                    <span className="font-medium">{listing.views || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Matches:</span>
                                    <span className="font-medium">{listing.matches || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Updated:</span>
                                    <span className="font-medium">{formatDate(listing.updatedAt || listing.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Management */}
                    <div className="border-t pt-6">
                        <h3 className="font-medium mb-4">Update Listing Status</h3>
                        <div className="flex flex-wrap gap-2">
                            {['active', 'matched', 'completed', 'cancelled'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={updating || listing.status === status}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${listing.status === status
                                            ? status === 'active' ? 'bg-green-600 text-white' :
                                                status === 'matched' ? 'bg-yellow-600 text-white' :
                                                    status === 'completed' ? 'bg-blue-600 text-white' :
                                                        'bg-gray-600 text-white'
                                            : status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                status === 'matched' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                                    status === 'completed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                        'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        } disabled:opacity-50`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                    {listing.status === status && ' (Current)'}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            • Active: Listing is visible to everyone<br />
                            • Matched: You've connected with someone<br />
                            • Completed: Delivery was successful<br />
                            • Cancelled: Listing is no longer available
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <Link
                    href="/dashboard/listings"
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Back to Listings
                </Link>

                <div className="flex space-x-3">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                                // Add delete functionality here
                                alert('Delete functionality would go here');
                            }
                        }}
                        className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                    >
                        Delete Listing
                    </button>

                    <Link
                        href={`/dashboard/send?edit=${listingId}`}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Edit Listing
                    </Link>
                </div>
            </div>
        </div>
    );
}