// lib/listings.ts - CREATE THIS FILE
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { SenderListing, TravelerListing, BaseListing } from '@/types';

// Create a new listing
export async function createListing(listingData: any) {
    try {
        // Ensure dates are Firestore Timestamps
        const processedData = {
            ...listingData,
            createdAt: new Date(),
            updatedAt: new Date(),
            views: 0,
            matches: 0,
            status: 'active', // Ensure status is set

            // Convert dates to ISO strings
            departureDate: listingData.departureDate instanceof Date
                ? listingData.departureDate
                : new Date(listingData.departureDate),
            neededByDate: listingData.neededByDate instanceof Date
                ? listingData.neededByDate
                : new Date(listingData.neededByDate),
        };

        console.log('Creating listing with data:', processedData);

        const listingRef = await addDoc(collection(db, 'listings'), processedData);

        return { success: true, id: listingRef.id };
    } catch (error) {
        console.error('Error creating listing:', error);
        return { success: false, error: error.message };
    }
}








// Add this function to lib/listings.ts
export async function getUserActiveListings(userId: string, type?: 'sender' | 'traveler') {
    try {
        let listingsQuery;

        if (type) {
            listingsQuery = query(
                collection(db, 'listings'),
                where('userId', '==', userId),
                where('type', '==', type),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );
        } else {
            listingsQuery = query(
                collection(db, 'listings'),
                where('userId', '==', userId),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );
        }

        const querySnapshot = await getDocs(listingsQuery);
        const listings: any[] = [];

        querySnapshot.forEach((doc) => {
            listings.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, listings };
    } catch (error) {
        console.error('Error fetching user active listings:', error);
        return { success: false, error: error.message };
    }
}









// lib/listings.ts - ADD THIS FUNCTION
export async function getActiveListings(type?: 'sender' | 'traveler') {
    try {
        let listingsQuery;

        if (type) {
            listingsQuery = query(
                collection(db, 'listings'),
                where('type', '==', type),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
        } else {
            listingsQuery = query(
                collection(db, 'listings'),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
        }

        const querySnapshot = await getDocs(listingsQuery);
        const listings: any[] = [];

        querySnapshot.forEach((doc) => {
            listings.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, listings };
    } catch (error) {
        console.error('Error fetching listings:', error);
        return { success: false, error: error.message };
    }
}

// Get user's listings
export async function getUserListings(userId: string) {
    try {
        const listingsQuery = query(
            collection(db, 'listings'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(listingsQuery);
        const listings: any[] = [];

        querySnapshot.forEach((doc) => {
            listings.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, listings };
    } catch (error) {
        console.error('Error fetching user listings:', error);
        return { success: false, error: error.message };
    }
}

// Get single listing
export async function getListing(listingId: string) {
    try {
        const listingDoc = await getDoc(doc(db, 'listings', listingId));

        if (!listingDoc.exists()) {
            return { success: false, error: 'Listing not found' };
        }

        return {
            success: true,
            listing: { id: listingDoc.id, ...listingDoc.data() }
        };
    } catch (error) {
        console.error('Error fetching listing:', error);
        return { success: false, error: error.message };
    }
}

// Update listing
export async function updateListing(listingId: string, updates: Partial<BaseListing>) {
    try {
        await updateDoc(doc(db, 'listings', listingId), {
            ...updates,
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating listing:', error);
        return { success: false, error: error.message };
    }
}

// Delete listing (soft delete by changing status)
export async function deleteListing(listingId: string) {
    try {
        await updateDoc(doc(db, 'listings', listingId), {
            status: 'cancelled',
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting listing:', error);
        return { success: false, error: error.message };
    }
}

// Find matches for a listing
export async function findMatches(listingId: string) {
    try {
        // Get the listing
        const listingResult = await getListing(listingId);
        if (!listingResult.success) return listingResult;

        const listing = listingResult.listing;

        // Find opposite type listings with matching routes
        const oppositeType = listing.type === 'sender' ? 'traveler' : 'sender';

        const matchesQuery = query(
            collection(db, 'listings'),
            where('type', '==', oppositeType),
            where('status', '==', 'active'),
            where('origin', '==', listing.origin),
            where('destination', '==', listing.destination),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const querySnapshot = await getDocs(matchesQuery);
        const matches: any[] = [];

        querySnapshot.forEach((doc) => {
            matches.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, matches };
    } catch (error) {
        console.error('Error finding matches:', error);
        return { success: false, error: error.message };
    }
}