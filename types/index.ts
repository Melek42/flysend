// types/index.ts - UPDATE THIS FILE
export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
}




export interface Review {
    id?: string;
    matchId: string;
    reviewerId: string;      // Who wrote the review
    revieweeId: string;      // Who is being reviewed
    listingId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    title: string;
    content: string;
    wouldRecommend: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserStats {
    totalReviews: number;
    averageRating: number;
    completionRate: number;
    responseRate?: number;
    verifiedUser: boolean;
}




export interface Message {
    id?: string;
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    imageUrl?: string;
    read: boolean;
    createdAt: Date;
}

export interface Match {
    id?: string;
    senderListingId: string;
    travelerListingId: string;
    senderUserId: string;
    travelerUserId: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;

    // Communication
    lastMessage?: {
        content: string;
        senderId: string;
        createdAt: Date;
    };
    lastMessageAt?: Date;
    unreadCount?: {
        [userId: string]: number;
    };

    // Meeting details
    meetingLocation?: string;
    meetingDate?: Date;
    meetingConfirmed: boolean;

    // Payment
    agreedPrice?: number;
    paymentStatus: 'pending' | 'partial' | 'completed' | 'refunded';

    // For easy access
    listingIds: string[];
    userIds: string[];
}

export interface ChatUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    userType: 'sender' | 'traveler';
}




export interface UserProfile {
    uid: string;
    userType: 'sender' | 'traveler' | 'both';
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city?: string;
    photoURL?: string;

    // Verification
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified: boolean;
    verificationStatus: 'pending' | 'verified' | 'rejected';

    // Stats
    rating: number;
    totalReviews: number;
    completedTrips: number;
    completedDeliveries: number;

    // Dates
    createdAt: Date;
    lastActive: Date;

    // Preferences
    preferredLanguages: string[];
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
}

export interface SenderProfile extends UserProfile {
    itemsSent: number;
    preferredRoutes: string[];
    trustedTravelers: string[];
}

export interface TravelerProfile extends UserProfile {
    passportNumber?: string;
    passportPhotoURL?: string;
    passportVerified: boolean;
    frequentFlyerNumber?: string;
    preferredAirlines: string[];
    maxCapacity: number;
    availableSpace: number;
    upcomingFlights: Flight[];
    travelFrequency: 'rarely' | 'occasionally' | 'frequently' | 'very-frequently';
}

// ==================== LISTINGS TYPES ====================
export interface BaseListing {
    id?: string;
    userId: string;
    userType: 'sender' | 'traveler';
    status: 'active' | 'matched' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;

    // Route
    origin: string;
    destination: string;

    // Dates
    departureDate: Date; // For travelers
    neededByDate: Date;  // For senders
    flexibleDates: boolean;

    // Price
    price: number;
    priceCurrency: string;
    negotiable: boolean;

    // Metadata
    views: number;
    matches: number;
}

export interface SenderListing extends BaseListing {
    type: 'sender';

    // Item details
    itemType: 'food' | 'clothing' | 'electronics' | 'documents' | 'other';
    itemDescription: string;
    itemWeight: number; // in kg
    itemValue?: number;
    itemImages?: string[];

    // Restrictions
    fragile: boolean;
    perishable: boolean;
    requiresSpecialHandling: boolean;

    // Sender preferences
    preferredTravelerType: 'any' | 'flight-crew' | 'student' | 'family';
    meetupLocation: string;
    insuranceRequired: boolean;
}

export interface TravelerListing extends BaseListing {
    type: 'traveler';

    // Flight details
    airline: string;
    flightNumber?: string;
    departureAirport: string;
    arrivalAirport: string;

    // Capacity
    availableSpace: number; // in kg
    maxWeightPerItem: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };

    // Traveler preferences
    acceptsFood: boolean;
    acceptsElectronics: boolean;
    acceptsDocuments: boolean;
    acceptsOther: boolean;
    allowsInspection: boolean;

    // Pickup/Dropoff
    pickupLocation: string;
    dropoffLocation: string;
}

export interface Flight {
    id: string;
    origin: string;
    destination: string;
    departureDate: Date;
    arrivalDate?: Date;
    airline: string;
    flightNumber: string;
    availableSpace: number;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface Match {
    id?: string;
    senderListingId: string;
    travelerListingId: string;
    senderUserId: string;
    travelerUserId: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;

    // Communication
    lastMessageAt?: Date;
    unreadCount?: {
        sender: number;
        traveler: number;
    };

    // Meeting details
    meetingLocation?: string;
    meetingDate?: Date;
    meetingConfirmed: boolean;

    // Payment
    agreedPrice?: number;
    paymentStatus: 'pending' | 'partial' | 'completed' | 'refunded';
}

// Popular routes for autocomplete
export const popularRoutes = [
    { from: 'Addis Ababa', to: 'Washington DC', code: 'ADD → IAD' },
    { from: 'Addis Ababa', to: 'London', code: 'ADD → LHR' },
    { from: 'Addis Ababa', to: 'Toronto', code: 'ADD → YYZ' },
    { from: 'Addis Ababa', to: 'Rome', code: 'ADD → FCO' },
    { from: 'Addis Ababa', to: 'Dubai', code: 'ADD → DXB' },
    { from: 'Addis Ababa', to: 'Stockholm', code: 'ADD → ARN' },
    { from: 'Washington DC', to: 'Addis Ababa', code: 'IAD → ADD' },
    { from: 'London', to: 'Addis Ababa', code: 'LHR → ADD' },
    { from: 'Toronto', to: 'Addis Ababa', code: 'YYZ → ADD' },
    { from: 'Rome', to: 'Addis Ababa', code: 'FCO → ADD' },
    { from: 'Dubai', to: 'Addis Ababa', code: 'DXB → ADD' },
    { from: 'Stockholm', to: 'Addis Ababa', code: 'ARN → ADD' },
];

// Common items for senders
export const commonItems = [
    { value: 'berbere', label: 'Berbere (Spice)', category: 'food' },
    { value: 'coffee', label: 'Coffee Beans', category: 'food' },
    { value: 'shiro', label: 'Shiro Powder', category: 'food' },
    { value: 'injera', label: 'Injera', category: 'food' },
    { value: 'clothes', label: 'Clothes', category: 'clothing' },
    { value: 'traditional', label: 'Traditional Clothes', category: 'clothing' },
    { value: 'phone', label: 'Mobile Phone', category: 'electronics' },
    { value: 'laptop', label: 'Laptop', category: 'electronics' },
    { value: 'tablet', label: 'Tablet', category: 'electronics' },
    { value: 'documents', label: 'Documents', category: 'documents' },
    { value: 'passport', label: 'Passport', category: 'documents' },
    { value: 'gifts', label: 'Gifts', category: 'other' },
    { value: 'medicine', label: 'Medicine', category: 'other' },
];