// app/debug/page.tsx - CREATE THIS FILE
'use client';

import { useEffect, useState } from 'react';
import { getActiveListings } from '@/lib/listings';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DebugPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        try {
            // Test 1: Use our function
            const result = await getActiveListings();
            console.log('getActiveListings result:', result);
            if (result.success) {
                setListings(result.listings);
            }

            // Test 2: Direct Firestore query
            const querySnapshot = await getDocs(collection(db, 'listings'));
            const allListings: any[] = [];
            querySnapshot.forEach((doc) => {
                allListings.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            console.log('All listings from Firestore:', allListings);
            setRawData(allListings);

        } catch (error) {
            console.error('Debug error:', error);
        }

        setLoading(false);
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Debug Page</h1>

            <button
                onClick={loadData}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded"
            >
                Refresh Data
            </button>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {/* Raw Data */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-3">All Listings in Firestore ({rawData.length})</h2>
                        <div className="bg-gray-100 p-4 rounded overflow-auto">
                            <pre className="text-sm">{JSON.stringify(rawData, null, 2)}</pre>
                        </div>
                    </div>

                    {/* Processed Data */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-3">Processed Listings ({listings.length})</h2>
                        <div className="bg-gray-100 p-4 rounded overflow-auto">
                            <pre className="text-sm">{JSON.stringify(listings, null, 2)}</pre>
                        </div>
                    </div>

                    {/* Issues Found */}
                    <div className="mb-8 p-4 bg-yellow-50 rounded">
                        <h3 className="font-bold mb-2">Common Issues:</h3>
                        <ul className="list-disc pl-5">
                            <li>Listings missing 'status' field or not 'active'</li>
                            <li>Firestore rules blocking access</li>
                            <li>Date fields not being Date objects</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}