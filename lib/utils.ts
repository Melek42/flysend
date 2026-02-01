// lib/utils.ts
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// Create: lib/utils.ts (if not exists)
export function formatTimestamp(timestamp: any): string {
    if (!timestamp) return "N/A";

    // If it's a Firestore Timestamp
    if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // If it's already a Date
    if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // If it's a plain object with seconds (the error you're seeing)
    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    return "N/A";
}