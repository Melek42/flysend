// app/listings/page.tsx - CREATE THIS FILE
'use client';

import { useState, useEffect } from 'react';
import { getActiveListings } from '@/lib/listings';
import { popularRoutes } from '@/types';
import Link from 'next/link';

export default function BrowseListingsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'sender' | 'traveler'>('all');
    const [routeFilter, setRouteFilter] = useState('all');

    useEffect(() => {
        loadListings();
    }, [filter]);

    const loadListings = async () => {
        setLoading(true);
        const result = await getActiveListings(filter === 'all' ? undefined : filter);

        if (result.success) {
            setListings(result.listings);
        }
        setLoading(false);
    };

    // Filter listings by route
    const filteredListings = routeFilter === 'all'
        ? listings
        : listings.filter(listing =>
            `${listing.origin} → ${listing.destination}` === routeFilter
        );

    // Get unique routes from listings
    const availableRoutes = Array.from(
        new Set(listings.map(l => `${l.origin} → ${l.destination}`))
    ).slice(0, 6);

    // Calculate stats
    const senderCount = listings.filter(l => l.type === 'sender').length;
    const travelerCount = listings.filter(l => l.type === 'traveler').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl">
                        <h1 className="text-4xl font-bold mb-4">Browse Active Listings</h1>
                        <p className="text-xl text-blue-100 mb-8">
                            Find packages to send or travelers with available space
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-6 mb-8">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-2xl font-bold">{listings.length}</div>
                                <div className="text-blue-100">Active Listings</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-2xl font-bold">{senderCount}</div>
                                <div className="text-blue-100">Packages to Send</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-2xl font-bold">{travelerCount}</div>
                                <div className="text-blue-100">Travelers Available</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Filters</h2>

                            {/* Type Filter */}
                            <div className="flex space-x-2">
                                {[
                                    { value: 'all', label: 'All', icon: '📋' },
                                    { value: 'sender', label: 'Packages', icon: '📦' },
                                    { value: 'traveler', label: 'Travelers', icon: '✈️' },
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() => setFilter(item.value as any)}
                                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${filter === item.value
                                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                : 'border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Route Filter */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Filter by Route</label>
                            <select
                                value={routeFilter}
                                onChange={(e) => setRouteFilter(e.target.value)}
                                className="w-full md:w-64 p-2 border rounded-lg"
                            >
                                <option value="all">All Routes</option>
                                {availableRoutes.map((route) => (
                                    <option key={route} value={route}>{route}</option>
                                ))}
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={loadListings}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Popular Routes Quick Filter */}
                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Popular Routes:</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setRouteFilter('all')}
                                className={`px-3 py-1 rounded-full text-sm ${routeFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All Routes
                            </button>
                            {popularRoutes.slice(0, 5).map((route) => (
                                <button
                                    key={route.code}
                                    onClick={() => setRouteFilter(`${route.from} → ${route.to}`)}
                                    className={`px-3 py-1 rounded-full text-sm ${routeFilter === `${route.from} → ${route.to}`
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {route.code}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading listings...</p>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow">
                        <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                        <p className="text-gray-600 mb-6">Be the first to create a listing!</p>
                        <div className="space-x-4">
                            <Link
                                href="/dashboard/send"
                                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                            >
                                Send a Package
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                )}

                {/* Call to Action */}
                <div className="mt-12 text-center">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-4">Ready to make your own listing?</h2>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Join our community of senders and travelers. Create your first listing in just 2 minutes.
                        </p>
                        <div className="space-x-4">
                            <Link
                                href="/dashboard/send"
                                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-medium"
                            >
                                Send a Package
                            </Link>
                            <Link
                                href="/dashboard/travel"
                                className="inline-block border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 text-lg font-medium"
                            >
                                Travel with Packages
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Listing Card Component
function ListingCard({ listing }: { listing: any }) {
    const isSender = listing.type === 'sender';

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate days until
    const getDaysUntil = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays > 0) return `In ${diffDays} days`;
        return 'Past date';
    };

    return (
        <Link href={`/listings/${listing.id}`}>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border border-gray-100">
                {/* Header */}
                <div className={`p-4 ${isSender ? 'bg-blue-50' : 'bg-green-50'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSender ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                    {isSender ? '📦' : '✈️'}
                                </span>
                                <div>
                                    <h3 className="font-semibold">
                                        {listing.origin} → {listing.destination}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {isSender ? 'Package to send' : 'Traveler available'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${listing.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {listing.status === 'active' ? 'Active' : 'Matched'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {isSender ? (
                        <>
                            <div className="mb-4">
                                <div className="text-sm text-gray-500 mb-1">Item</div>
                                <div className="font-medium truncate">{listing.itemDescription}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-sm text-gray-500">Weight</div>
                                    <div className="font-semibold">{listing.itemWeight} kg</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Price</div>
                                    <div className="font-semibold text-blue-600">
                                        ${listing.price} {listing.priceCurrency}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-4">
                                <div className="text-sm text-gray-500 mb-1">Available Space</div>
                                <div className="font-semibold text-green-600 text-xl">
                                    {listing.availableSpace} kg
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-sm text-gray-500">Price/kg</div>
                                    <div className="font-semibold">${listing.price}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Airline</div>
                                    <div className="font-medium">{listing.airline || 'Any'}</div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Dates */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-sm text-gray-500">
                                    {isSender ? 'Needed by' : 'Departure'}
                                </div>
                                <div className="font-medium">
                                    {formatDate(listing.neededByDate || listing.departureDate)}
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                {getDaysUntil(listing.neededByDate || listing.departureDate)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-gray-600">{listing.views || 0} views</span>
                        </div>

                        <div className="text-blue-600 font-medium">
                            View Details →
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}