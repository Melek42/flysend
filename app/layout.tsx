// app/layout.tsx - UPDATED WITH CHAT INTEGRATION
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { subscribeToUserMatches } from '@/lib/chat';
import './globals.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0); // Add this line

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Add scroll listener for header effect
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            unsubscribe();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (user) {
            // Subscribe to unread message counts
            const unsubscribe = subscribeToUserMatches(user.uid, (matches) => {
                const totalUnread = matches.reduce((total, match) => {
                    return total + (match.unreadCount?.[user.uid] || 0);
                }, 0);
                setUnreadCount(totalUnread);
            });

            return () => unsubscribe();
        } else {
            setUnreadCount(0);
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <html lang="en" className="h-full">
                <body className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="text-center">
                        <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-gray-600 font-medium">Loading FlySend...</p>
                        <p className="text-sm text-gray-500 mt-2">Connecting travelers and senders</p>
                    </div>
                </body>
            </html>
        );
    }

    return (
        <html lang="en" className="h-full">
            <body className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
                {/* Modern Header with Glass Effect */}
                <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
                        ? 'bg-white/80 backdrop-blur-md shadow-soft'
                        : 'bg-white/95 backdrop-blur-sm'
                    }`}>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <Link href="/" className="flex items-center space-x-3 group">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        FlySend
                                    </h1>
                                    <p className="text-xs text-gray-500">Travel & Deliver</p>
                                </div>
                            </Link>

                            {/* Navigation */}
                            <nav className="hidden md:flex items-center space-x-1">
                                <Link
                                    href="/"
                                    className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/listings"
                                    className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                >
                                    Browse
                                </Link>

                                {/* Chat/Messages Link with Unread Badge */}
                                <Link
                                    href="/chat"
                                    className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium relative"
                                >
                                    Messages
                                    {user && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>

                                {user ? (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="px-4 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-medium"
                                        >
                                            Logout
                                        </button>
                                        <div className="ml-4 w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-white shadow-sm flex items-center justify-center">
                                            <span className="font-medium text-blue-600">
                                                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="ml-2 px-5 py-2.5 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all font-medium shadow-sm"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </nav>

                            {/* Mobile menu button */}
                            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-4rem)]">
                    {children}
                </main>

                {/* Modern Footer */}
                <footer className="bg-gradient-to-b from-white to-gray-50 border-t mt-16">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
                        <div className="grid md:grid-cols-4 gap-8">
                            <div>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">FlySend</h3>
                                        <p className="text-sm text-gray-500">Travel & Deliver</p>
                                    </div>
                                </div>
                                <p className="text-gray-600">
                                    Connecting travelers with spare luggage space to people who need to send packages.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">Platform</h4>
                                <ul className="space-y-2">
                                    <li><Link href="/listings" className="text-gray-600 hover:text-blue-600">Browse Listings</Link></li>
                                    <li><Link href="/dashboard/send" className="text-gray-600 hover:text-blue-600">Send a Package</Link></li>
                                    <li><Link href="/dashboard/travel" className="text-gray-600 hover:text-blue-600">Become a Traveler</Link></li>
                                    <li><Link href="/chat" className="text-gray-600 hover:text-blue-600">Messages</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">Company</h4>
                                <ul className="space-y-2">
                                    <li><Link href="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
                                    <li><Link href="/blog" className="text-gray-600 hover:text-blue-600">Blog</Link></li>
                                    <li><Link href="/careers" className="text-gray-600 hover:text-blue-600">Careers</Link></li>
                                    <li><Link href="/press" className="text-gray-600 hover:text-blue-600">Press</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">Legal</h4>
                                <ul className="space-y-2">
                                    <li><Link href="/privacy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
                                    <li><Link href="/cookies" className="text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
                                    <li><Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact Us</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-500 text-sm">
                                © {new Date().getFullYear()} FlySend. All rights reserved.
                            </p>
                            <div className="flex space-x-4 mt-4 md:mt-0">
                                <a href="#" className="text-gray-400 hover:text-blue-600">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-blue-600">
                                    <span className="sr-only">Facebook</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-blue-600">
                                    <span className="sr-only">Instagram</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.904 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}