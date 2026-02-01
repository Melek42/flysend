// app/listings/[id]/page.tsx - CREATE THIS FILE
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getListing, findMatches } from '@/lib/listings';
import Link from 'next/link';
import { format } from 'date-fns';
import { createMatch } from '@/lib/chat';


export default function ListingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [listing, setListing] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [showMatches, setShowMatches] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [contacting, setContacting] = useState(false);

    const listingId = params.id as string;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);

            if (!user) {
                // Not required to view listing, but needed for contact
                // Continue loading listing anyway
            }

            loadListing();
        });

        return () => unsubscribe();
    }, [listingId]);

    const loadListing = async () => {
        setLoading(true);

        try {
            // Get listing details
            const listingResult = await getListing(listingId);
            if (listingResult.success) {
                setListing(listingResult.listing);

                // Increment view count
                if (user && user.uid !== listingResult.listing.userId) {
                    await updateDoc(doc(db, 'listings', listingId), {
                        views: (listingResult.listing.views || 0) + 1
                    });
                }

                // Load matches if user is logged in
                if (user) {
                    const matchesResult = await findMatches(listingId);
                    if (matchesResult.success) {
                        setMatches(matchesResult.matches);
                    }
                }
            } else {
                setError('Listing not found or has been removed.');
            }
        } catch (error) {
            console.error('Error loading listing:', error);
            setError('Failed to load listing. Please try again.');
        }

        setLoading(false);
    };

    // Replace the handleContact function in app/listings/[id]/page.tsx
    const handleContact = async (matchListing?: any) => {
        if (!user) {
            router.push('/login?returnTo=' + encodeURIComponent(`/listings/${listingId}`));
            return;
        }

        setContacting(true);
        setError('');

        try {
            // Check if it's the user's own listing
            if (user.uid === listing.userId) {
                setError("You can't contact yourself about your own listing.");
                setContacting(false);
                return;
            }

            // Determine which listing is sender and which is traveler
            let senderListingId, travelerListingId, senderUserId, travelerUserId;

            if (listing.type === 'sender') {
                // Current listing is sender, matchListing is traveler
                senderListingId = listingId;
                travelerListingId = matchListing?.id || listingId;
                senderUserId = listing.userId;
                travelerUserId = matchListing?.userId || user.uid;
            } else {
                // Current listing is traveler, matchListing is sender
                travelerListingId = listingId;
                senderListingId = matchListing?.id || listingId;
                travelerUserId = listing.userId;
                senderUserId = matchListing?.userId || user.uid;
            }

            // Create real match in Firestore
            const matchResult = await createMatch(
                senderListingId,
                travelerListingId,
                senderUserId,
                travelerUserId
            );

            if (matchResult.success) {
                setMessage('✅ Connection request sent! You can now chat with the other user.');

                // Redirect to chat after 2 seconds
                setTimeout(() => {
                    router.push(`/chat/${matchResult.matchId}`);
                }, 2000);
            } else {
                setError('Failed to create connection. Please try again.');
            }

        } catch (error: any) {
            console.error('Error creating connection:', error);
            setError(`Failed to send connection request: ${error.message}`);
        }

        setContacting(false);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';

        try {
            let date: Date;

            // If it's a Firestore Timestamp object
            if (timestamp.toDate) {
                date = timestamp.toDate();
            }
            // If it's a plain object with seconds (Firestore Timestamp data)
            else if (timestamp.seconds) {
                date = new Date(timestamp.seconds * 1000);
            }
            // If it's already a Date object
            else if (timestamp instanceof Date) {
                date = timestamp;
            }
            // If it's a string
            else {
                date = new Date(timestamp);
            }

            return format(date, 'MMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(price);
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

    if (error && !listing) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 text-gray-300">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Listing Not Found</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        href="/listings"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        Browse Other Listings
                    </Link>
                </div>
            </div>
        );
    }

    const isSender = listing?.type === 'sender';
    const isOwner = user?.uid === listing?.userId;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <nav className="flex text-sm text-gray-600">
                        <Link href="/" className="hover:text-blue-600">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/listings" className="hover:text-blue-600">Browse Listings</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 font-medium truncate">
                            {listing?.origin} → {listing?.destination}
                        </span>
                    </nav>
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

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Listing Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className={`p-6 ${isSender ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSender ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                <span className="text-2xl">{isSender ? '📦' : '✈️'}</span>
                                            </div>
                                            <div>
                                                <h1 className="text-2xl font-bold">
                                                    {listing?.origin} → {listing?.destination}
                                                </h1>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSender ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {isSender ? 'Package to Send' : 'Traveler Available'}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                        {listing?.status === 'active' ? 'Active' : listing?.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <div className="text-sm text-gray-500">Posted</div>
                                                <div className="font-medium">{formatDate(listing?.createdAt)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500">Views</div>
                                                <div className="font-medium">{listing?.views || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500">Matches</div>
                                                <div className="font-medium">{listing?.matches || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500">Deadline</div>
                                                <div className="font-medium">{formatDate(listing?.neededByDate || listing?.departureDate)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price Badge */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                                        <div className="text-sm text-gray-500 mb-1">
                                            {isSender ? 'Offering' : 'Price per kg'}
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatPrice(listing?.price || 0, listing?.priceCurrency)}
                                        </div>
                                        {listing?.negotiable && (
                                            <div className="text-sm text-green-600 mt-1">Price is negotiable</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details Content */}
                            <div className="p-6">
                                {isSender ? (
                                    <div className="space-y-6">
                                        {/* Item Details */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                                    📦
                                                </span>
                                                Item Details
                                            </h3>
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-sm text-gray-500">Item Type</div>
                                                        <div className="font-medium capitalize">{listing?.itemType}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Weight</div>
                                                        <div className="font-medium">{listing?.itemWeight} kg</div>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="text-sm text-gray-500 mb-2">Description</div>
                                                    <p className="text-gray-700">{listing?.itemDescription}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Restrictions */}
                                        {(listing?.fragile || listing?.perishable || listing?.requiresSpecialHandling) && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">⚠️ Special Handling</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {listing?.fragile && (
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                                            Fragile
                                                        </span>
                                                    )}
                                                    {listing?.perishable && (
                                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                                            Perishable
                                                        </span>
                                                    )}
                                                    {listing?.requiresSpecialHandling && (
                                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                                            Special Handling
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Preferences */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">🤝 Preferences</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-gray-500">Preferred Traveler</div>
                                                    <div className="font-medium capitalize">
                                                        {listing?.preferredTravelerType?.replace('-', ' ') || 'Any'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-500">Meetup Location</div>
                                                    <div className="font-medium">{listing?.meetupLocation || 'Flexible'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Travel Details */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                                                    ✈️
                                                </span>
                                                Travel Details
                                            </h3>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-sm text-gray-500">Available Space</div>
                                                        <div className="font-medium text-xl text-green-600">
                                                            {listing?.availableSpace} kg
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Airline</div>
                                                        <div className="font-medium">{listing?.airline || 'Not specified'}</div>
                                                    </div>
                                                    {listing?.flightNumber && (
                                                        <div>
                                                            <div className="text-sm text-gray-500">Flight Number</div>
                                                            <div className="font-medium">{listing?.flightNumber}</div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm text-gray-500">Max per Item</div>
                                                        <div className="font-medium">{listing?.maxWeightPerItem || '23'} kg</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accepted Items */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">📋 Accepts These Items</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { id: 'food', label: 'Food & Spices', accepted: listing?.acceptsFood, icon: '🌶️' },
                                                    { id: 'electronics', label: 'Electronics', accepted: listing?.acceptsElectronics, icon: '📱' },
                                                    { id: 'documents', label: 'Documents', accepted: listing?.acceptsDocuments, icon: '📄' },
                                                    { id: 'other', label: 'Other Items', accepted: listing?.acceptsOther, icon: '🎁' },
                                                ].map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`flex flex-col items-center p-3 border rounded-lg ${item.accepted
                                                                ? 'border-green-300 bg-green-50'
                                                                : 'border-gray-200 bg-gray-50 opacity-50'
                                                            }`}
                                                    >
                                                        <span className="text-2xl mb-2">{item.icon}</span>
                                                        <span className="text-sm text-center">{item.label}</span>
                                                        <span className="text-xs mt-1">
                                                            {item.accepted ? '✅ Accepted' : '❌ Not accepted'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Meeting Details */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">📍 Meeting Details</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-gray-500">Pickup Location</div>
                                                    <div className="font-medium">{listing?.pickupLocation || 'To be arranged'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-500">Dropoff Location</div>
                                                    <div className="font-medium">{listing?.dropoffLocation || 'To be arranged'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Matches Section */}
                        {matches.length > 0 && user && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center">
                                        <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                            🔥
                                        </span>
                                        Perfect Matches ({matches.length})
                                    </h2>
                                    <button
                                        onClick={() => setShowMatches(!showMatches)}
                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {showMatches ? 'Hide' : 'Show'} Matches
                                    </button>
                                </div>

                                {showMatches && (
                                    <div className="space-y-4">
                                        {matches.map((match) => (
                                            <div
                                                key={match.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${match.type === 'sender' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                                }`}>
                                                                {match.type === 'sender' ? '📦' : '✈️'}
                                                            </span>
                                                            <div>
                                                                <h4 className="font-semibold">
                                                                    {match.type === 'sender' ? 'Package to Send' : 'Traveler Available'}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    Posted {formatDate(match.createdAt)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <div className="text-gray-500">Weight/Space</div>
                                                                <div className="font-medium">
                                                                    {match.type === 'sender' ? `${match.itemWeight} kg` : `${match.availableSpace} kg`}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-500">Price</div>
                                                                <div className="font-medium text-blue-600">
                                                                    {formatPrice(match.price, match.priceCurrency)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-500">Dates</div>
                                                                <div className="font-medium">
                                                                    {formatDate(match.neededByDate || match.departureDate)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-500">Status</div>
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                                    Perfect Match
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleContact(match)}
                                                        disabled={contacting}
                                                        className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        Connect
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Action Panel */}
                    <div className="space-y-6">
                        {/* Action Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-24">
                            <h3 className="text-lg font-bold mb-6 text-center">Ready to Connect?</h3>

                            <div className="space-y-4">
                                {isOwner ? (
                                    <>
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <p className="text-blue-700 font-medium">This is your listing</p>
                                            <p className="text-sm text-blue-600 mt-1">Manage it from your dashboard</p>
                                        </div>

                                        <Link
                                            href="/dashboard/listings"
                                            className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                                        >
                                            Manage My Listings
                                        </Link>

                                        {matches.length > 0 && (
                                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                                <p className="text-green-700 font-medium">🎉 You have {matches.length} matches!</p>
                                                <button
                                                    onClick={() => setShowMatches(true)}
                                                    className="mt-2 w-full text-green-600 hover:text-green-700 font-medium"
                                                >
                                                    View Matches
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <p className="font-medium mb-2">💬 Chat with {isSender ? 'Sender' : 'Traveler'}</p>
                                            <p className="text-sm text-gray-600">
                                                Send a message to discuss details, negotiate price, and arrange meetup.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleContact()}
                                            disabled={contacting || !user}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium shadow-lg"
                                        >
                                            {contacting ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Sending Request...
                                                </span>
                                            ) : user ? (
                                                `Contact ${isSender ? 'Sender' : 'Traveler'}`
                                            ) : (
                                                'Login to Contact'
                                            )}
                                        </button>

                                        {!user && (
                                            <p className="text-sm text-gray-500 text-center mt-2">
                                                You need to be logged in to contact the lister
                                            </p>
                                        )}

                                        {user && !isOwner && (
                                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                                <p className="text-green-700 font-medium">✅ You're logged in</p>
                                                <p className="text-sm text-green-600 mt-1">You can message this user directly</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="mt-8 pt-6 border-t">
                                <h4 className="font-medium mb-3">📊 Listing Stats</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xl font-bold">{listing?.views || 0}</div>
                                        <div className="text-sm text-gray-500">Views</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xl font-bold">{listing?.matches || 0}</div>
                                        <div className="text-sm text-gray-500">Connections</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Safety Tips */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                            <h4 className="font-bold text-lg mb-3 flex items-center">
                                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    🛡️
                                </span>
                                Safety Tips
                            </h4>
                            <ul className="space-y-2 text-blue-800">
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-1">•</span>
                                    <span>Meet in public places</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-1">•</span>
                                    <span>Inspect items together</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-1">•</span>
                                    <span>Use in-app chat for records</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-1">•</span>
                                    <span>Verify identity when meeting</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}