// lib/chat.ts - CREATE THIS FILE
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Update lib/chat.ts - CREATE MATCH FUNCTION
export async function createMatch(
    senderListingId: string,
    travelerListingId: string,
    senderUserId: string,
    travelerUserId: string
) {
    try {
        // Check if match already exists
        const existingMatchesQuery = query(
            collection(db, 'matches'),
            where('senderListingId', '==', senderListingId),
            where('travelerListingId', '==', travelerListingId)
        );

        const existingMatches = await getDocs(existingMatchesQuery);

        if (!existingMatches.empty) {
            // Match already exists, return existing match ID
            const existingMatch = existingMatches.docs[0];
            return { success: true, matchId: existingMatch.id, existing: true };
        }

        const matchData = {
            senderListingId,
            travelerListingId,
            senderUserId,
            travelerUserId,
            listingIds: [senderListingId, travelerListingId],
            userIds: [senderUserId, travelerUserId],
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            meetingConfirmed: false,
            paymentStatus: 'pending',
            unreadCount: {
                [senderUserId]: 0,
                [travelerUserId]: 0
            }
        };

        const matchRef = await addDoc(collection(db, 'matches'), matchData);

        // Update both listings to 'matched' status
        try {
            await updateDoc(doc(db, 'listings', senderListingId), {
                status: 'matched',
                updatedAt: new Date()
            });

            await updateDoc(doc(db, 'listings', travelerListingId), {
                status: 'matched',
                updatedAt: new Date()
            });
        } catch (updateError) {
            console.warn('Could not update listing status:', updateError);
            // Continue even if status update fails
        }

        return { success: true, matchId: matchRef.id, existing: false };
    } catch (error: any) {
        console.error('Error creating match:', error);
        return { success: false, error: error.message };
    }
}




// Send a message
export async function sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string
) {
    try {
        const messageData = {
            matchId,
            senderId,
            receiverId,
            content,
            read: false,
            createdAt: new Date()
        };

        await addDoc(collection(db, 'messages'), messageData);

        // Update match's last message and unread count
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchRef);

        if (matchDoc.exists()) {
            const matchData = matchDoc.data();
            const newUnreadCount = {
                ...matchData.unreadCount,
                [receiverId]: (matchData.unreadCount?.[receiverId] || 0) + 1
            };

            await updateDoc(matchRef, {
                lastMessage: {
                    content,
                    senderId,
                    createdAt: new Date()
                },
                lastMessageAt: new Date(),
                unreadCount: newUnreadCount,
                updatedAt: new Date()
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
}

// Get all matches for a user
export async function getUserMatches(userId: string) {
    try {
        console.log('Querying matches for user:', userId);

        // Query matches where user is involved
        const matchesRef = collection(db, 'matches');
        const q = query(
            matchesRef,
            where('userIds', 'array-contains', userId)
        );

        const querySnapshot = await getDocs(q);
        console.log('Found matches count:', querySnapshot.size);

        const matches = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Match document:', doc.id, data);
            return {
                id: doc.id,
                ...data,
                // Ensure createdAt is a timestamp object
                createdAt: data.createdAt || null,
                lastMessageAt: data.lastMessageAt || null
            };
        });

        // Sort by last message or creation date
        matches.sort((a, b) => {
            const dateA = a.lastMessageAt || a.createdAt;
            const dateB = b.lastMessageAt || b.createdAt;

            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            const timeA = dateA.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
            const timeB = dateB.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();

            return timeB - timeA; // Most recent first
        });

        return {
            success: true,
            matches
        };
    } catch (error) {
        console.error('Error in getUserMatches:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
// Get messages for a match
export async function getMatchMessages(matchId: string) {
    try {
        const messagesQuery = query(
            collection(db, 'messages'),
            where('matchId', '==', matchId),
            orderBy('createdAt', 'asc')
        );

        const querySnapshot = await getDocs(messagesQuery);
        const messages: any[] = [];

        querySnapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, messages };
    } catch (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error: error.message };
    }
}

// Mark messages as read
export async function markMessagesAsRead(matchId: string, userId: string) {
    try {
        // Update match unread count
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchRef);

        if (matchDoc.exists()) {
            const matchData = matchDoc.data();
            await updateDoc(matchRef, {
                unreadCount: {
                    ...matchData.unreadCount,
                    [userId]: 0
                }
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return { success: false, error: error.message };
    }
}

// Real-time listener for matches
export function subscribeToUserMatches(userId: string, callback: (matches: any[]) => void) {
    const matchesQuery = query(
        collection(db, 'matches'),
        where('userIds', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(matchesQuery, (snapshot) => {
        const matches: any[] = [];
        snapshot.forEach((doc) => {
            matches.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(matches);
    });
}

// Real-time listener for messages
export function subscribeToMatchMessages(matchId: string, callback: (messages: any[]) => void) {
    const messagesQuery = query(
        collection(db, 'messages'),
        where('matchId', '==', matchId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
        const messages: any[] = [];
        snapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(messages);
    });
}