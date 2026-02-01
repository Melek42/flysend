// app/dashboard/profile/page.tsx - CREATE THIS FILE
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        country: '',
        preferredLanguages: ['en'],
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);

            // Fetch user profile
            try {
                const profileDoc = await getDoc(doc(db, 'users', user.uid));
                if (profileDoc.exists()) {
                    const profileData = profileDoc.data();
                    setProfile(profileData);
                    setFormData({
                        fullName: profileData.fullName || '',
                        phone: profileData.phone || '',
                        country: profileData.country || 'ET',
                        preferredLanguages: profileData.preferredLanguages || ['en'],
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage('');

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                ...formData,
                updatedAt: new Date().toISOString(),
            });

            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Error updating profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleResendVerification = async () => {
        if (user) {
            // Firebase will handle email verification resend
            // For now, show a message
            alert('Verification email would be resent here. Check your inbox.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                >
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

                {message && (
                    <div className={`p-3 rounded mb-6 ${message.includes('Error')
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Account Type Badge */}
                <div className="mb-6">
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {profile?.userType === 'sender' ? '📦 Sender' : '✈️ Traveler'}
                    </div>
                    <p className="text-gray-600 mt-2">
                        {profile?.userType === 'sender'
                            ? 'You can send packages to Ethiopia through travelers.'
                            : 'You can carry packages and earn extra money.'}
                    </p>
                </div>

                {/* Email Verification Alert */}
                {!user?.emailVerified && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">⚠️</div>
                            <div className="ml-3">
                                <h3 className="font-medium">Email not verified</h3>
                                <p className="text-sm mt-1">
                                    Please verify your email address ({user?.email}) to access all features.
                                </p>
                                <button
                                    onClick={handleResendVerification}
                                    className="mt-2 text-sm text-amber-700 hover:text-amber-800 font-medium"
                                >
                                    Resend verification email
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+251 912 345678"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Country</label>
                        <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="ET">Ethiopia</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            <option value="DE">Germany</option>
                            <option value="SE">Sweden</option>
                            <option value="AU">Australia</option>
                            <option value="AE">United Arab Emirates</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Preferred Languages</label>
                        <div className="flex flex-wrap gap-2">
                            {['en', 'am', 'om', 'ti'].map((lang) => (
                                <label key={lang} className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferredLanguages.includes(lang)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({
                                                    ...formData,
                                                    preferredLanguages: [...formData.preferredLanguages, lang]
                                                });
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    preferredLanguages: formData.preferredLanguages.filter(l => l !== lang)
                                                });
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">
                                        {lang === 'en' ? 'English' :
                                            lang === 'am' ? 'Amharic' :
                                                lang === 'om' ? 'Oromo' : 'Tigrinya'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Display-only fields */}
                    <div className="pt-6 border-t">
                        <h3 className="font-medium mb-3">Account Information</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500">Email Address</div>
                                <div className="font-medium">{user?.email}</div>
                            </div>
                            <div>
                                <div className="text-gray-500">Account Type</div>
                                <div className="font-medium capitalize">{profile?.userType}</div>
                            </div>
                            <div>
                                <div className="text-gray-500">Member Since</div>
                                <div className="font-medium">
                                    {profile?.createdAt
                                        ? new Date(profile.createdAt).toLocaleDateString()
                                        : 'Recently'}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500">User ID</div>
                                <div className="font-medium text-xs truncate">{user?.uid}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t">
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}