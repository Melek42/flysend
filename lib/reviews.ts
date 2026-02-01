// lib/reviews.ts
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
        const reviewRef = await addDoc(collection(db, 'reviews'), {
            ...reviewData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Update user stats
        await updateUserStats(reviewData.revieweeId);

        return { success: true, id: reviewRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getUserReviews(userId: string) {
    try {
        const reviewsQuery = query(
            collection(db, 'reviews'),
            where('revieweeId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const querySnapshot = await getDocs(reviewsQuery);
        const reviews: any[] = [];

        querySnapshot.forEach((doc) => {
            reviews.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, reviews };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateUserStats(userId: string) {
    try {
        const reviewsResult = await getUserReviews(userId);
        if (!reviewsResult.success) return;

        const reviews = reviewsResult.reviews;
        const totalReviews = reviews.length;
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            totalReviews,
            rating: averageRating,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
}