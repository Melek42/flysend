// app/dashboard/send/page.tsx - CREATE THIS FILE
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createListing } from '@/lib/listings';
import { popularRoutes, commonItems } from '@/types';
import Link from 'next/link';

export default function SendPackagePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        // Route
        origin: '',
        destination: '',

        // Item details
        itemType: 'food',
        itemDescription: '',
        itemWeight: '',
        itemValue: '',

        // Dates
        neededByDate: '',
        flexibleDates: true,

        // Price
        price: '',
        priceCurrency: 'USD',
        negotiable: true,

        // Restrictions
        fragile: false,
        perishable: false,
        requiresSpecialHandling: false,

        // Preferences
        preferredTravelerType: 'any',
        meetupLocation: '',
        insuranceRequired: false,
    });

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

                    // Set user's country as default origin/destination
                    const userCountry = profileDoc.data().country === 'ET' ? 'Ethiopia' : 'Other';
                    setFormData(prev => ({
                        ...prev,
                        origin: userCountry === 'Ethiopia' ? 'Addis Ababa' : '',
                        meetupLocation: profileDoc.data().city || 'City center'
                    }));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        setMessage('');
        setError('');

        // Validation
        if (!formData.origin || !formData.destination) {
            setError('Please select origin and destination');
            setSubmitting(false);
            return;
        }

        if (!formData.itemDescription || !formData.itemWeight) {
            setError('Please provide item description and weight');
            setSubmitting(false);
            return;
        }

        // Parse values, handling empty strings
        const itemWeight = parseFloat(formData.itemWeight);
        const itemValue = formData.itemValue ? parseFloat(formData.itemValue) : null;
        const price = parseFloat(formData.price) || 0;

        // Validate parsed values
        if (isNaN(itemWeight) || itemWeight <= 0) {
            setError('Please enter a valid weight greater than 0');
            setSubmitting(false);
            return;
        }

        if (isNaN(price) || price < 0) {
            setError('Please enter a valid price');
            setSubmitting(false);
            return;
        }

        const listingData = {
            userId: user.uid,
            userType: 'sender' as const,
            type: 'sender' as const,

            // Route
            origin: formData.origin,
            destination: formData.destination,

            // Item details
            itemType: formData.itemType,
            itemDescription: formData.itemDescription,
            itemWeight: itemWeight,
            itemValue: itemValue, // Can be null/undefined

            // Dates
            neededByDate: new Date(formData.neededByDate),
            departureDate: new Date(formData.neededByDate), // For base listing
            flexibleDates: formData.flexibleDates,

            // Price
            price: price,
            priceCurrency: formData.priceCurrency,
            negotiable: formData.negotiable,

            // Restrictions
            fragile: formData.fragile,
            perishable: formData.perishable,
            requiresSpecialHandling: formData.requiresSpecialHandling,

            // Preferences
            preferredTravelerType: formData.preferredTravelerType,
            meetupLocation: formData.meetupLocation,
            insuranceRequired: formData.insuranceRequired,

            // Default values for required fields
            status: 'active' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            views: 0,
            matches: 0,
        };

        const result = await createListing(listingData);

        if (result.success) {
            setMessage('✅ Package listing created successfully! Redirecting to matches...');
            setTimeout(() => {
                router.push(`/dashboard/listings/${result.id}`);
            }, 2000);
        } else {
            setError(result.error || 'Failed to create listing. Please try again.');
        }

        setSubmitting(false);
    };

    const handleRouteSelect = (route: typeof popularRoutes[0]) => {
        setFormData({
            ...formData,
            origin: route.from,
            destination: route.to
        });
    };

    const handleItemSelect = (item: typeof commonItems[0]) => {
        setFormData({
            ...formData,
            itemType: item.category as any,
            itemDescription: item.label
        });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center mb-4"
                >
                    ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Send a Package</h1>
                <p className="text-gray-600 mt-2">
                    Post what you want to send and connect with travelers heading that way
                </p>
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

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-8">
                    {/* Quick Route Selection */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4">🚀 Popular Routes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {popularRoutes
                                .filter(route => route.from.includes('Addis Ababa') || route.to.includes('Addis Ababa'))
                                .slice(0, 6)
                                .map((route) => (
                                    <button
                                        key={route.code}
                                        type="button"
                                        onClick={() => handleRouteSelect(route)}
                                        className={`p-3 border rounded-lg text-left transition-all hover:shadow-md ${formData.origin === route.from && formData.destination === route.to
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="font-medium">{route.code}</div>
                                        <div className="text-sm text-gray-600">
                                            {route.from} → {route.to}
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Route Section */}
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    🗺️
                                </span>
                                Route Details
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        From (Origin) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.origin}
                                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Addis Ababa"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        To (Destination) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Washington DC"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Item Details Section */}
                        <div className="bg-green-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    📦
                                </span>
                                Item Details
                            </h2>

                            {/* Common Items */}
                            <div className="mb-6">
                                <h3 className="font-medium mb-3">Common Items (Click to select)</h3>
                                <div className="flex flex-wrap gap-2">
                                    {commonItems.slice(0, 8).map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => handleItemSelect(item)}
                                            className={`px-3 py-2 rounded-full text-sm transition-colors ${formData.itemDescription === item.label
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-white border border-green-200 text-green-700 hover:bg-green-100'
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Item Type *
                                    </label>
                                    <select
                                        value={formData.itemType}
                                        onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="food">Food & Spices</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="documents">Documents</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Weight (kg) *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="50"
                                            value={formData.itemWeight}
                                            onChange={(e) => setFormData({ ...formData, itemWeight: e.target.value })}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., 2.5"
                                            required
                                        />
                                        <div className="absolute right-3 top-3 text-gray-500">kg</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium mb-2">
                                    Item Description *
                                </label>
                                <textarea
                                    value={formData.itemDescription}
                                    onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Describe your item in detail..."
                                    required
                                />
                            </div>

                            {/* Item Restrictions */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.fragile}
                                        onChange={(e) => setFormData({ ...formData, fragile: e.target.checked })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span>Fragile Item</span>
                                </label>

                                <label className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.perishable}
                                        onChange={(e) => setFormData({ ...formData, perishable: e.target.checked })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span>Perishable</span>
                                </label>

                                <label className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.requiresSpecialHandling}
                                        onChange={(e) => setFormData({ ...formData, requiresSpecialHandling: e.target.checked })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span>Special Handling</span>
                                </label>
                            </div>
                        </div>

                        {/* Dates & Price Section */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Dates */}
                            <div className="bg-purple-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                        📅
                                    </span>
                                    Timeline
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Needed By Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.neededByDate}
                                            onChange={(e) => setFormData({ ...formData, neededByDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <label className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.flexibleDates}
                                            onChange={(e) => setFormData({ ...formData, flexibleDates: e.target.checked })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Flexible with dates (± 3 days)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="bg-amber-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                                        💰
                                    </span>
                                    Pricing
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Price Offered *
                                        </label>
                                        <div className="flex items-center">
                                            <select
                                                value={formData.priceCurrency}
                                                onChange={(e) => setFormData({ ...formData, priceCurrency: e.target.value })}
                                                className="p-3 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                                <option value="ETB">ETB</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="0"
                                                step="5"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="flex-1 p-3 border-l-0 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., 50"
                                                required
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Average price for this route: $20-30/kg
                                        </p>
                                    </div>

                                    <label className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.negotiable}
                                            onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Price is negotiable</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Meeting & Preferences */}
                        <div className="bg-indigo-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                    🤝
                                </span>
                                Meeting & Preferences
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Meetup Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.meetupLocation}
                                        onChange={(e) => setFormData({ ...formData, meetupLocation: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Airport, City Center, etc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Preferred Traveler Type
                                    </label>
                                    <select
                                        value={formData.preferredTravelerType}
                                        onChange={(e) => setFormData({ ...formData, preferredTravelerType: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="any">Any Traveler</option>
                                        <option value="flight-crew">Flight Crew</option>
                                        <option value="student">Student</option>
                                        <option value="family">Family Traveler</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.insuranceRequired}
                                        onChange={(e) => setFormData({ ...formData, insuranceRequired: e.target.checked })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span>Require insurance for valuable items</span>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-between items-center pt-8 border-t">
                            <Link
                                href="/dashboard"
                                className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transition-all"
                            >
                                {submitting ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Listing...
                                    </span>
                                ) : 'Post Listing & Find Travelers'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tips Section */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">💡 Tips for Better Matches</h3>
                <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600">•</span>
                        <span>Be specific about item details and weight</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600">•</span>
                        <span>Offer competitive pricing (check average rates)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600">•</span>
                        <span>Be flexible with dates to find more travelers</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600">•</span>
                        <span>Provide clear meetup instructions</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}