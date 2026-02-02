// app/dashboard/listings/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getListing } from '@/lib/listings';
import Link from 'next/link';

export default function EditListingPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        origin: '',
        destination: '',
        price: '',
        priceCurrency: 'USD',
        status: 'active',
        // Sender specific
        itemType: '',
        itemWeight: '',
        itemDescription: '',
        fragile: false,
        perishable: false,
        requiresSpecialHandling: false,
        preferredTravelerType: 'any',
        neededByDate: '',
        meetupLocation: '',
        negotiable: false,
        // Traveler specific
        availableSpace: '',
        airline: '',
        flightNumber: '',
        departureDate: '',
        arrivalDate: '',
        acceptsFood: true,
        acceptsElectronics: true,
        acceptsDocuments: true,
        acceptsOther: true,
        maxWeightPerItem: '23',
        pickupLocation: '',
        dropoffLocation: '',
    });

    const listingId = params.id as string;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                loadListing(currentUser.uid);
            } else {
                router.push('/login?returnTo=' + encodeURIComponent(`/dashboard/listings/${listingId}`));
            }
        });

        return () => unsubscribe();
    }, [listingId]);

    const loadListing = async (userId: string) => {
        setLoading(true);
        setError('');

        try {
            const result = await getListing(listingId);
            
            if (!result.success || !result.listing) {
                setError('Listing not found or has been removed.');
                return;
            }

            // Check if this listing belongs to the current user
            if (result.listing.userId !== userId) {
                setError('You do not have permission to edit this listing.');
                router.push('/dashboard/listings');
                return;
            }

            // Populate form with listing data
            const listing = result.listing;
            setFormData({
                title: listing.title || '',
                description: listing.description || '',
                origin: listing.origin || '',
                destination: listing.destination || '',
                price: listing.price?.toString() || '',
                priceCurrency: listing.priceCurrency || 'USD',
                status: listing.status || 'active',
                itemType: listing.itemType || '',
                itemWeight: listing.itemWeight?.toString() || '',
                itemDescription: listing.itemDescription || '',
                fragile: listing.fragile || false,
                perishable: listing.perishable || false,
                requiresSpecialHandling: listing.requiresSpecialHandling || false,
                preferredTravelerType: listing.preferredTravelerType || 'any',
                neededByDate: listing.neededByDate ? new Date(listing.neededByDate).toISOString().split('T')[0] : '',
                meetupLocation: listing.meetupLocation || '',
                negotiable: listing.negotiable || false,
                availableSpace: listing.availableSpace?.toString() || '',
                airline: listing.airline || '',
                flightNumber: listing.flightNumber || '',
                departureDate: listing.departureDate ? new Date(listing.departureDate).toISOString().split('T')[0] : '',
                arrivalDate: listing.arrivalDate ? new Date(listing.arrivalDate).toISOString().split('T')[0] : '',
                acceptsFood: listing.acceptsFood ?? true,
                acceptsElectronics: listing.acceptsElectronics ?? true,
                acceptsDocuments: listing.acceptsDocuments ?? true,
                acceptsOther: listing.acceptsOther ?? true,
                maxWeightPerItem: listing.maxWeightPerItem?.toString() || '23',
                pickupLocation: listing.pickupLocation || '',
                dropoffLocation: listing.dropoffLocation || '',
            });

        } catch (err) {
            console.error('Error loading listing:', err);
            setError('Failed to load listing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            setError('You must be logged in to update a listing.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!formData.origin.trim() || !formData.destination.trim()) {
                setError('Origin and destination are required.');
                setSaving(false);
                return;
            }

            const price = parseFloat(formData.price);
            if (isNaN(price) || price < 0) {
                setError('Please enter a valid price.');
                setSaving(false);
                return;
            }

            // Prepare update data
            const updateData: any = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                origin: formData.origin.trim(),
                destination: formData.destination.trim(),
                price: price,
                priceCurrency: formData.priceCurrency,
                status: formData.status,
                negotiable: formData.negotiable,
                updatedAt: new Date(),
            };

            // Add type-specific fields
            const isSender = listingId.includes('sender'); // Adjust based on your logic
            if (isSender) {
                updateData.itemType = formData.itemType;
                updateData.itemWeight = parseFloat(formData.itemWeight) || 0;
                updateData.itemDescription = formData.itemDescription.trim();
                updateData.fragile = formData.fragile;
                updateData.perishable = formData.perishable;
                updateData.requiresSpecialHandling = formData.requiresSpecialHandling;
                updateData.preferredTravelerType = formData.preferredTravelerType;
                updateData.neededByDate = formData.neededByDate ? new Date(formData.neededByDate) : null;
                updateData.meetupLocation = formData.meetupLocation.trim();
            } else {
                updateData.availableSpace = parseFloat(formData.availableSpace) || 0;
                updateData.airline = formData.airline.trim();
                updateData.flightNumber = formData.flightNumber.trim();
                updateData.departureDate = formData.departureDate ? new Date(formData.departureDate) : null;
                updateData.arrivalDate = formData.arrivalDate ? new Date(formData.arrivalDate) : null;
                updateData.acceptsFood = formData.acceptsFood;
                updateData.acceptsElectronics = formData.acceptsElectronics;
                updateData.acceptsDocuments = formData.acceptsDocuments;
                updateData.acceptsOther = formData.acceptsOther;
                updateData.maxWeightPerItem = parseFloat(formData.maxWeightPerItem) || 23;
                updateData.pickupLocation = formData.pickupLocation.trim();
                updateData.dropoffLocation = formData.dropoffLocation.trim();
            }

            // Update in Firestore
            await updateDoc(doc(db, 'listings', listingId), updateData);

            setSuccess('Listing updated successfully!');
            
            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/dashboard/listings');
            }, 2000);

        } catch (err: any) {
            console.error('Error updating listing:', err);
            setError(err.message || 'Failed to update listing. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        setError('');

        try {
            await updateDoc(doc(db, 'listings', listingId), {
                status: 'deleted',
                deletedAt: new Date(),
            });

            setSuccess('Listing deleted successfully!');
            
            setTimeout(() => {
                router.push('/dashboard/listings');
            }, 2000);

        } catch (err: any) {
            console.error('Error deleting listing:', err);
            setError(err.message || 'Failed to delete listing. Please try again.');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading listing...</p>
                </div>
            </div>
        );
    }

    const isSender = formData.itemType !== ''; // Simple check - adjust based on your logic

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Edit Listing</h1>
                            <p className="text-gray-600 mt-2">Update your listing details</p>
                        </div>
                        <Link
                            href="/dashboard/listings"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            ← Back to Listings
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        {success}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-8">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 pb-3 border-b">Basic Information</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Origin *
                                        </label>
                                        <input
                                            type="text"
                                            name="origin"
                                            value={formData.origin}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                            disabled={saving}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Destination *
                                        </label>
                                        <input
                                            type="text"
                                            name="destination"
                                            value={formData.destination}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                            disabled={saving}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price *
                                        </label>
                                        <div className="flex">
                                            <select
                                                name="priceCurrency"
                                                value={formData.priceCurrency}
                                                onChange={handleInputChange}
                                                className="px-3 py-2 border border-gray-300 rounded-l-lg border-r-0 bg-gray-50"
                                                disabled={saving}
                                            >
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                                <option value="ETB">ETB</option>
                                            </select>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                step="0.01"
                                                min="0"
                                                required
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="negotiable"
                                            name="negotiable"
                                            checked={formData.negotiable}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            disabled={saving}
                                        />
                                        <label htmlFor="negotiable" className="ml-2 block text-sm text-gray-700">
                                            Price is negotiable
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Type-Specific Fields */}
                            {isSender ? (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b">Package Details</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Item Type
                                            </label>
                                            <select
                                                name="itemType"
                                                value={formData.itemType}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={saving}
                                            >
                                                <option value="">Select type</option>
                                                <option value="food">Food & Spices</option>
                                                <option value="clothing">Clothing</option>
                                                <option value="electronics">Electronics</option>
                                                <option value="documents">Documents</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Weight (kg)
                                            </label>
                                            <input
                                                type="number"
                                                name="itemWeight"
                                                value={formData.itemWeight}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                step="0.1"
                                                min="0"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                name="itemDescription"
                                                value={formData.itemDescription}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={saving}
                                                placeholder="Describe your package in detail..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Special Handling
                                            </label>
                                            <div className="flex flex-wrap gap-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="fragile"
                                                        checked={formData.fragile}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        disabled={saving}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Fragile</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="perishable"
                                                        checked={formData.perishable}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        disabled={saving}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Perishable</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="requiresSpecialHandling"
                                                        checked={formData.requiresSpecialHandling}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        disabled={saving}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Special Handling</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Needed By Date
                                            </label>
                                            <input
                                                type="date"
                                                name="neededByDate"
                                                value={formData.neededByDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Preferred Traveler
                                            </label>
                                            <select
                                                name="preferredTravelerType"
                                                value={formData.preferredTravelerType}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={saving}
                                            >
                                                <option value="any">Any Traveler</option>
                                                <option value="verified">Verified Travelers Only</option>
                                                <option value="experienced">Experienced Travelers</option>
                                                <option value="same-gender">Same Gender</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b">Travel Details</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Available Space (kg)
                                            </label>
                                            <input
                                                type="number"
                                                name="availableSpace"
                                                value={formData.availableSpace}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                step="0.1"
                                                min="0"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Max Weight Per Item (kg)
                                            </label>
                                            <input
                                                type="number"
                                                name="maxWeightPerItem"
                                                value={formData.maxWeightPerItem}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                step="0.1"
                                                min="0"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Departure Date
                                            </label>
                                            <input
                                                type="date"
                                                name="departureDate"
                                                value={formData.departureDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Arrival Date
                                            </label>
                                            <input
                                                type="date"
                                                name="arrivalDate"
                                                value={formData.arrivalDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Accepted Items
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { name: 'acceptsFood', label: 'Food & Spices' },
                                                    { name: 'acceptsElectronics', label: 'Electronics' },
                                                    { name: 'acceptsDocuments', label: 'Documents' },
                                                    { name: 'acceptsOther', label: 'Other Items' },
                                                ].map((item) => (
                                                    <label key={item.name} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            name={item.name}
                                                            checked={formData[item.name as keyof typeof formData] as boolean}
                                                            onChange={handleInputChange}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            disabled={saving}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 pb-3 border-b">Listing Status</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={saving}
                                        >
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium"
                            >
                                {saving ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : (
                                    'Update Listing'
                                )}
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={saving}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            >
                                Delete Listing
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
