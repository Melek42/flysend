// app/(auth)/register/page.tsx - UPDATED WITH FIREBASE
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

// Define form validation schema
const registerSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    userType: z.enum(['sender', 'traveler']),
    country: z.string().min(1, 'Please select a country'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Country options
const countries = [
    { value: 'ET', label: 'Ethiopia' },
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'SE', label: 'Sweden' },
    { value: 'AU', label: 'Australia' },
    { value: 'AE', label: 'United Arab Emirates' },
];

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultType = searchParams.get('type') as 'sender' | 'traveler' || 'sender';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            userType: defaultType,
            country: 'ET',
        },
    });

    const userType = watch('userType');

    const handleRegister = async (data: RegisterFormData) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // 2. Update display name
            await updateProfile(userCredential.user, {
                displayName: data.fullName
            });

            // 3. Send email verification
            await sendEmailVerification(userCredential.user);

            // 4. Create user profile in Firestore
            const userProfile = {
                uid: userCredential.user.uid,
                email: data.email,
                fullName: data.fullName,
                phone: data.phone,
                userType: data.userType,
                country: data.country,

                // Verification status
                emailVerified: false,
                phoneVerified: false,
                idVerified: false,
                verificationStatus: 'pending',

                // Stats
                rating: 0,
                totalReviews: 0,
                completedTrips: 0,
                completedDeliveries: 0,

                // Dates
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),

                // Preferences
                preferredLanguages: ['en'],
                notificationPreferences: {
                    email: true,
                    sms: true,
                    push: true
                }
            };

            await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);

            // 5. Show success message
            setSuccess(`Account created successfully! Please check your email (${data.email}) to verify your account.`);

            // 6. Redirect after 3 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);

        } catch (error: any) {
            console.error('Registration error:', error);

            // User-friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please login instead.');
            } else if (error.code === 'auth/weak-password') {
                setError('Password is too weak. Please use a stronger password.');
            } else if (error.code === 'auth/invalid-email') {
                setError('Invalid email address. Please check and try again.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold">Join FlySend</h2>
                    <p className="text-gray-600 mt-2">Create your account to start sending or carrying packages</p>
                </div>

                {/* User Type Selection */}
                <div className="mb-6">
                    <p className="font-medium mb-3">I want to:</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setValue('userType', 'sender')}
                            className={`p-4 border-2 rounded-lg text-center transition-colors ${userType === 'sender'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <div className="font-medium mb-1">Send Packages</div>
                            <div className="text-sm text-gray-500">I have items to send</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue('userType', 'traveler')}
                            className={`p-4 border-2 rounded-lg text-center transition-colors ${userType === 'traveler'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <div className="font-medium mb-1">Carry Packages</div>
                            <div className="text-sm text-gray-500">I travel with spare space</div>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
                    <input type="hidden" {...register('userType')} />

                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="John Doe"
                            {...register('fullName')}
                        />
                        {errors.fullName && (
                            <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="you@example.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="tel"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+251 912 345678"
                            {...register('phone')}
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <select
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            {...register('country')}
                        >
                            {countries.map((country) => (
                                <option key={country.value} value={country.value}>
                                    {country.label}
                                </option>
                            ))}
                        </select>
                        {errors.country && (
                            <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <div className="flex items-start space-x-2">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            className="mt-1"
                        />
                        <label htmlFor="terms" className="text-sm">
                            I agree to the{' '}
                            <Link href="/terms" className="text-blue-600 hover:underline">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-blue-600 hover:underline">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t">
                    <p className="text-gray-600 text-center">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}