// components/reviews/ReviewModal.tsx
'use client';

import { useState } from 'react';

interface ReviewModalProps {
    matchId: string;
    otherUserId: string;
    listingId: string;
    onClose: () => void;
    onSubmit: (reviewData: any) => void;
}

export default function ReviewModal({ matchId, otherUserId, listingId, onClose, onSubmit }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const reviewData = {
            matchId,
            reviewerId: '', // Will be set by parent
            revieweeId: otherUserId,
            listingId,
            rating,
            title,
            content,
            wouldRecommend
        };

        await onSubmit(reviewData);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Leave a Review</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Overall Rating</label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="text-3xl focus:outline-none"
                                >
                                    {star <= rating ? '⭐' : '☆'}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                            {rating === 5 && 'Excellent'}
                            {rating === 4 && 'Good'}
                            {rating === 3 && 'Average'}
                            {rating === 2 && 'Poor'}
                            {rating === 1 && 'Terrible'}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Review Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Detailed Review</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share details of your experience..."
                            rows={4}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    {/* Recommendation */}
                    <div>
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={wouldRecommend}
                                onChange={(e) => setWouldRecommend(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span>I would recommend this user to others</span>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}