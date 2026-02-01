// Create: lib/matches.ts (if it doesn't exist)
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function createMatch(
    senderListingId: string,
    travelerListingId: string,
    senderUserId: string,
    travelerUserId: string
) {
    try {
        // Create the match document
        const matchRef = await addDoc(collection(db, 'matches'), {
            senderListingId,
            travelerListingId,
            senderUserId,
            travelerUserId,
            status: 'pending', // or 'accepted' based on your logic
            createdAt: serverTimestamp(),
            lastMessage: null,
            unreadCount: {
                [senderUserId]: 0,
                [travelerUserId]: 0
            }
        });

        // Also update both listings to increment match count
        // ... add this if you want to track matches per listing

        return {
            success: true,
            matchId: matchRef.id,
            message: 'Match created successfully'
        };
    } catch (error) {
        console.error('Error creating match:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}