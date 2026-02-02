// app/chat/[id]/page.tsx - SIMPLE WORKING VERSION
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChatPage() {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      alert('Chat feature coming soon! This would send: ' + message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center mb-4"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  U
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Chat with User</h1>
                <p className="text-gray-600">
                  Discuss package details and arrange meetup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Messages Area */}
          <div className="h-[60vh] overflow-y-auto p-6 bg-gradient-to-b from-gray-50/50 to-white">
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat Feature Coming Soon! 🚀</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                The real-time chat system is under development. Soon you'll be able to:
              </p>
              <ul className="text-gray-600 max-w-md mx-auto mt-4 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Message other users instantly
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Share photos and documents
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Arrange meetups securely
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Negotiate prices in-app
                </li>
              </ul>
            </div>
          </div>

          {/* Message Input - Disabled for now */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="mb-2">Chat will be enabled when both users are matched</p>
              <p className="text-sm">For now, use the contact feature on listing pages</p>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h4 className="font-bold mb-3 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                💬
              </span>
              How Chat Will Work
            </h4>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• Real-time messaging</li>
              <li>• Read receipts</li>
              <li>• Image sharing</li>
              <li>• Secure communication</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
            <h4 className="font-bold mb-3 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                🤝
              </span>
              Current Contact Method
            </h4>
            <p className="text-green-800 text-sm">
              Use the "Contact" button on listing pages to connect with other users. You'll receive email notifications.
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <h4 className="font-bold mb-3 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                🚀
              </span>
              Coming Next Update
            </h4>
            <p className="text-purple-800 text-sm">
              Full chat system with notifications, file sharing, and voice messages is scheduled for release soon.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Link
            href="/listings"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg"
          >
            Browse Listings to Connect
          </Link>
        </div>
      </div>
    </div>
  );
}
