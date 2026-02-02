// app/dashboard/listings/[id]/page.tsx - FIXED VERSION
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getListing, updateListing } from '@/lib/listings';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const listingId = params.id as string;
  
  // Form state - simplified for now
  const [formData, setFormData] = useState({
    price: '',
    status: 'active',
    availableSpace: '',
    itemDescription: '',
    notes: ''
  });

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
  }, [router, listingId]);

  const loadListing = async (userId: string) => {
    setLoading(true);
    
    try {
      const result = await getListing(listingId);
      if (result.success && result.listing) { // ✅ FIXED: Check if listing exists
        // Check if this listing belongs to the current user
        if (result.listing.userId !== userId) {
          router.push('/dashboard/listings');
          return;
        }
        
        // Populate form with existing data
        setFormData({
          price: result.listing.price?.toString() || '',
          status: result.listing.status || 'active',
          availableSpace: result.listing.availableSpace?.toString() || result.listing.itemWeight?.toString() || '',
          itemDescription: result.listing.itemDescription || '',
          notes: ''
        });
      } else {
        setError('Listing not found');
      }
    } catch (error) {
      console.error('Error loading listing:', error);
      setError('Failed to load listing');
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updates: any = {
        status: formData.status,
        updatedAt: new Date()
      };

      // Add price update if changed
      if (formData.price) {
        updates.price = parseFloat(formData.price);
      }

      // Add appropriate field based on listing type
      const result = await getListing(listingId);
      if (result.success && result.listing) {
        if (result.listing.type === 'traveler' && formData.availableSpace) {
          updates.availableSpace = parseFloat(formData.availableSpace);
        } else if (result.listing.type === 'sender' && formData.availableSpace) {
          updates.itemWeight = parseFloat(formData.availableSpace);
        }

        if (formData.itemDescription) {
          updates.itemDescription = formData.itemDescription;
        }
      }

      const updateResult = await updateListing(listingId, updates);

      if (updateResult.success) {
        setMessage('✅ Listing updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/listings');
        }, 2000);
      } else {
        setError(updateResult.error || 'Failed to update listing');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      setError('An error occurred. Please try again.');
    }
    
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      // Soft delete by changing status
      await updateDoc(doc(db, 'listings', listingId), {
        status: 'cancelled',
        updatedAt: new Date()
      });

      router.push('/dashboard/listings');
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
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

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 text-gray-300">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard/listings"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/listings" 
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center mb-4"
        >
          ← Back to My Listings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
        <p className="text-gray-600 mt-2">
          Update your listing details
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="matched">Matched</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                • Active: Looking for matches
                • Matched: Found a connection
                • Completed: Delivery done
                • Cancelled: No longer available
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Price
              </label>
              <div className="flex items-center">
                <span className="p-3 border border-r-0 rounded-l-lg bg-gray-50">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="flex-1 p-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter price"
                />
              </div>
            </div>

            {/* Weight/Space */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Weight / Available Space (kg)
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.availableSpace}
                  onChange={(e) => setFormData({...formData, availableSpace: e.target.value})}
                  className="flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 10.5"
                />
                <span className="p-3 border border-l-0 rounded-r-lg bg-gray-50">kg</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Item Description
              </label>
              <textarea
                value={formData.itemDescription}
                onChange={(e) => setFormData({...formData, itemDescription: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Update your item description..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Update Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Any updates or changes to mention..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                >
                  Delete Listing
                </button>
              </div>
              
              <div className="flex space-x-4">
                <Link
                  href="/dashboard/listings"
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </Link>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="font-bold text-lg mb-3">💡 Editing Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Update status promptly to keep your listing accurate</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Adjust prices based on demand and market rates</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Be specific in descriptions to avoid confusion</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Use "Cancelled" status instead of deleting to maintain history</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
