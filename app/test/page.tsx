// app/test/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [status, setStatus] = useState('Checking environment...');

  useEffect(() => {
    // Check environment variables
    const hasFirebaseConfig = 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (hasFirebaseConfig) {
      setStatus('✅ Firebase environment variables found!');
    } else {
      setStatus('❌ Firebase environment variables missing. Check .env.local');
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Project Setup Test</h1>
      
      <div className="p-4 bg-gray-100 rounded-lg mb-4">
        <p className="font-mono">{status}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="font-bold mb-2">Environment Check:</h2>
          <ul className="list-disc pl-5">
            <li>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Found' : '❌ Missing'}</li>
            <li>Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Found' : '❌ Missing'}</li>
            <li>Node Environment: {process.env.NODE_ENV || 'development'}</li>
          </ul>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h2 className="font-bold mb-2">Next Steps:</h2>
          <ol className="list-decimal pl-5">
            <li>Create .env.local file</li>
            <li>Add Firebase config values</li>
            <li>Restart server: Ctrl+C then npm run dev</li>
          </ol>
        </div>
      </div>
    </div>
  );
}