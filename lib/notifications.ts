// lib/notifications.ts
import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
    id?: string;
    userId: string;
    type: 'message' | 'match' | 'review' | 'system';
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: Date;
}

export async function createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    try {
        await addDoc(collection(db, 'notifications'), {
            ...notification,
            read: false,
            createdAt: new Date()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getUserNotifications(userId: string) {
    try {
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(notificationsQuery);
        const notifications: Notification[] = [];

        snapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });

        return { success: true, notifications };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function markAllNotificationsAsRead(userId: string) {
    try {
        const notifications = await getUserNotifications(userId);
        if (!notifications.success) return notifications;

        const updatePromises = notifications.notifications
            .filter(n => !n.read)
            .map(n => markNotificationAsRead(n.id!));

        await Promise.all(updatePromises);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}