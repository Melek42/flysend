// app/test-matches/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TestMatchesPage() {
    const [user, setUser] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                testMatches(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const testMatches = async (userId: string) => {
        try {
            setLoading(true);
            console.log('Testing matches for user:', userId);

            // Direct Firestore query
            const matchesRef = collection(db, 'matches');
            const q = query(
                matchesRef,
                where('userIds', 'array-contains', userId)
            );

            const querySnapshot = await getDocs(q);
            console.log('Direct query result:', querySnapshot.size);

            const matchesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('Matches data:', matchesData);
            setMatches(matchesData);

        } catch (error: any) {
            console.error('Test error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading test data...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Matches Test</h1>

            <div className="mb-6">
                <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
                <p><strong>User ID:</strong> {user?.uid || 'N/A'}</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                    <p className="text-red-700"><strong>Error:</strong> {error}</p>
                </div>
            )}

            <div className="mb-4">
                <p><strong>Matches found:</strong> {matches.length}</p>
            </div>

            <div className="space-y-4">
                {matches.map((match) => (
                    <div key={match.id} className="border p-4 rounded-lg">
                        <p><strong>Match ID:</strong> {match.id}</p>
                        <p><strong>Status:</strong> {match.status}</p>
                        <p><strong>User IDs:</strong> {JSON.stringify(match.userIds)}</p>
                        <p><strong>Created At:</strong> {JSON.stringify(match.createdAt)}</p>
                        <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
                            {JSON.stringify(match, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>

            {matches.length === 0 && (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No matches found in Firestore.</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Make sure you've created some matches through the listing details page.
                    </p>
                </div>
            )}
        </div>
    );
}