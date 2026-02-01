// app/users/[id]/page.tsx - User Profile with Reviews
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserReviews } from '@/lib/reviews';
import Link from 'next/link';

export default function UserProfilePage() {
    const params = useParams();
    const [user, setUser] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const userId = params.id as string;

    useEffect(() => {
        loadUserData();
    }, [userId]);

    const loadUserData = async () => {
        setLoading(true);

        try {
            // Get user profile
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                setUser({ id: userDoc.id, ...userDoc.data() });
            }

            // Get user reviews
            const reviewsResult = await getUserReviews(userId);
            if (reviewsResult.success) {
                setReviews(reviewsResult.reviews);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }

        setLoading(false);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl font-bold text-blue-600">
                        {user.fullName?.charAt(0) || 'U'}
                    </div>

                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{user.fullName}</h1>
                        <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center">
                                <span className="text-2xl">⭐</span>
                                <span className="text-xl font-bold ml-2">{user.rating?.toFixed(1) || '5.0'}</span>
                                <span className="text-gray-500 ml-1">({user.totalReviews || 0} reviews)</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full ${user.userType === 'sender' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {user.userType === 'sender' ? '📦 Sender' : '✈️ Traveler'}
                            </span>
                            <span className="text-gray-500">{user.country}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{user.completedDeliveries || 0}</div>
                                <div className="text-sm text-gray-600">Deliveries</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{user.completedTrips || 0}</div>
                                <div className="text-sm text-gray-600">Trips</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">100%</div>
                                <div className="text-sm text-gray-600">Response Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Reviews ({reviews.length})</h2>

                {reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No reviews yet</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b pb-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className="text-xl">
                                                        {i < review.rating ? '⭐' : '☆'}
                                                    </span>
                                                ))}
                                            </div>
                                            <h3 className="font-bold text-lg">{review.title}</h3>
                                        </div>
                                        <p className="text-gray-600 mt-2">{review.content}</p>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {review.wouldRecommend && (
                                    <div className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                        ✅ Would recommend
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}