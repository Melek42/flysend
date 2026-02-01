// app/dashboard/travel/page.tsx - CREATE THIS FILE
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createListing } from '@/lib/listings';
import { popularRoutes } from '@/types';
import Link from 'next/link';

export default function TravelPage() {
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
        departureAirport: '',
        arrivalAirport: '',

        // Flight details
        airline: '',
        flightNumber: '',
        departureDate: '',
        departureTime: '',

        // Capacity
        availableSpace: '',
        maxWeightPerItem: '',

        // Price
        pricePerKg: '',
        priceCurrency: 'USD',
        negotiable: true,

        // Preferences
        acceptsFood: true,
        acceptsElectronics: true,
        acceptsDocuments: true,
        acceptsOther: true,
        allowsInspection: true,

        // Pickup/Dropoff
        pickupLocation: '',
        dropoffLocation: '',
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
                        destination: userCountry === 'Ethiopia' ? '' : 'Addis Ababa',
                        pickupLocation: 'Airport departure area',
                        dropoffLocation: 'Airport arrival area'
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

        if (!formData.departureDate || !formData.availableSpace) {
            setError('Please provide departure date and available space');
            setSubmitting(false);
            return;
        }

        // Combine date and time
        const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime || '12:00'}`);

        const listingData = {
            userId: user.uid,
            userType: 'traveler' as const,
            type: 'traveler' as const,

            // Route
            origin: formData.origin,
            destination: formData.destination,
            departureAirport: formData.departureAirport || `${formData.origin.split(' ')[0]} Airport`,
            arrivalAirport: formData.arrivalAirport || `${formData.destination.split(' ')[0]} Airport`,

            // Flight details
            airline: formData.airline,
            flightNumber: formData.flightNumber,

            // Dates
            departureDate: departureDateTime,
            neededByDate: departureDateTime, // For base listing
            flexibleDates: false, // Travelers usually have fixed dates

            // Capacity
            availableSpace: parseFloat(formData.availableSpace),
            maxWeightPerItem: formData.maxWeightPerItem ? parseFloat(formData.maxWeightPerItem) : 23, // Default 23kg

            // Price
            price: parseFloat(formData.pricePerKg) || 0,
            priceCurrency: formData.priceCurrency,
            negotiable: formData.negotiable,

            // Preferences
            acceptsFood: formData.acceptsFood,
            acceptsElectronics: formData.acceptsElectronics,
            acceptsDocuments: formData.acceptsDocuments,
            acceptsOther: formData.acceptsOther,
            allowsInspection: formData.allowsInspection,

            // Pickup/Dropoff
            pickupLocation: formData.pickupLocation,
            dropoffLocation: formData.dropoffLocation,
        };

        const result = await createListing(listingData);

        if (result.success) {
            setMessage('✅ Travel listing created successfully! Looking for senders...');
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

    // Calculate estimated earnings
    const calculateEarnings = () => {
        const space = parseFloat(formData.availableSpace) || 0;
        const price = parseFloat(formData.pricePerKg) || 20; // Default $20/kg
        return space * price;
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
                <h1 className="text-3xl font-bold text-gray-900">Post Your Travel Plan</h1>
                <p className="text-gray-600 mt-2">
                    Share your flight details and available space to earn extra money
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
                    {/* Earnings Calculator */}
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold mb-2">💰 Estimated Earnings</h2>
                                <p className="text-gray-600">Based on your available space and price</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-green-600">
                                    ${calculateEarnings().toFixed(0)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Potential extra income
                                </div>
                            </div>
                        </div>

                        {/* Calculator sliders */}
                        <div className="mt-6 space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Available Space: {formData.availableSpace || 0} kg</span>
                                    <span className="text-sm text-gray-500">Max: 50kg</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={formData.availableSpace || 0}
                                    onChange={(e) => setFormData({ ...formData, availableSpace: e.target.value })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Price per kg: ${formData.pricePerKg || 20}</span>
                                    <span className="text-sm text-gray-500">Avg: $20-30/kg</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    step="5"
                                    value={formData.pricePerKg || 20}
                                    onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Route Selection */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4">✈️ Popular Routes</h2>
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
                        {/* Flight Details Section */}
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    ✈️
                                </span>
                                Flight Details
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

                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Departure Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.departureDate}
                                        onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Departure Time (Optional)
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.departureTime}
                                        onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Airline (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.airline}
                                        onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Ethiopian Airlines"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Flight Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.flightNumber}
                                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., ET501"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Capacity & Pricing Section */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Capacity */}
                            <div className="bg-green-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                        ⚖️
                                    </span>
                                    Luggage Capacity
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Available Space (kg) *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                step="0.5"
                                                value={formData.availableSpace}
                                                onChange={(e) => setFormData({ ...formData, availableSpace: e.target.value })}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., 10"
                                                required
                                            />
                                            <div className="absolute right-3 top-3 text-gray-500">kg</div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Standard checked baggage: 23kg × 2 = 46kg total
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Max Weight per Item (kg)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="32"
                                                value={formData.maxWeightPerItem}
                                                onChange={(e) => setFormData({ ...formData, maxWeightPerItem: e.target.value })}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., 23"
                                            />
                                            <div className="absolute right-3 top-3 text-gray-500">kg</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
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
                                            Price per kg *
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
                                                min="5"
                                                step="5"
                                                value={formData.pricePerKg}
                                                onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                                                className="flex-1 p-3 border-l-0 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., 20"
                                                required
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Average: $20-30/kg for this route
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

                        {/* Item Preferences */}
                        <div className="bg-purple-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                    📋
                                </span>
                                Item Preferences
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { id: 'food', label: 'Food & Spices', checked: formData.acceptsFood, icon: '🌶️' },
                                    { id: 'electronics', label: 'Electronics', checked: formData.acceptsElectronics, icon: '📱' },
                                    { id: 'documents', label: 'Documents', checked: formData.acceptsDocuments, icon: '📄' },
                                    { id: 'other', label: 'Other Items', checked: formData.acceptsOther, icon: '🎁' },
                                ].map((item) => (
                                    <label
                                        key={item.id}
                                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${item.checked
                                                ? 'border-purple-500 bg-purple-100'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={(e) => {
                                                const key = `accepts${item.id.charAt(0).toUpperCase() + item.id.slice(1)}` as keyof typeof formData;
                                                setFormData({ ...formData, [key]: e.target.checked });
                                            }}
                                            className="hidden"
                                        />
                                        <span className="text-2xl mb-2">{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-6">
                                <label className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowsInspection}
                                        onChange={(e) => setFormData({ ...formData, allowsInspection: e.target.checked })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span>Allow senders to inspect items at meetup</span>
                                </label>
                            </div>
                        </div>

                        {/* Meeting Details */}
                        <div className="bg-indigo-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                    🤝
                                </span>
                                Meeting Details
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Pickup Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.pickupLocation}
                                        onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Airport departure area"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Dropoff Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.dropoffLocation}
                                        onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Airport arrival area"
                                    />
                                </div>
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
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transition-all"
                            >
                                {submitting ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Listing...
                                    </span>
                                ) : 'Post Travel Plan & Find Senders'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tips Section */}
            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">💡 Tips for Better Matches</h3>
                <ul className="space-y-2 text-green-800">
                    <li className="flex items-start space-x-2">
                        <span className="text-green-600">•</span>
                        <span>Be honest about available space and weight limits</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-green-600">•</span>
                        <span>Clear meeting instructions reduce confusion</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-green-600">•</span>
                        <span>Communicate early and clearly with senders</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-green-600">•</span>
                        <span>Check airline baggage policies for restrictions</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}