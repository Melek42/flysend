// components/notifications/NotificationBell.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/notifications';
import Link from 'next/link';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        const result = await getUserNotifications(user.uid);

        if (result.success) {
            setNotifications(result.notifications);
            setUnreadCount(result.notifications.filter(n => !n.read).length);
        }
        setLoading(false);
    };

    const handleMarkAllAsRead = async () => {
        const user = auth.currentUser;
        if (!user) return;

        await markAllNotificationsAsRead(user.uid);
        loadNotifications();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-lg hover:bg-gray-100"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No notifications</div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={notification.link || '#'}
                                    onClick={() => setShowDropdown(false)}
                                    className={`block p-4 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                        <div className="flex-1">
                                            <div className="font-medium">{notification.title}</div>
                                            <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                                            <div className="text-xs text-gray-400 mt-2">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t">
                        <Link
                            href="/notifications"
                            className="block text-center text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => setShowDropdown(false)}
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}