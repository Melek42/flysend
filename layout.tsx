// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlySend - Send Packages via Travelers',
  description: 'Peer-to-peer package delivery to Ethiopia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {/* Simple Header */}
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
                <h1 className="text-xl font-bold text-blue-700">FlySend</h1>
              </div>
              <nav className="space-x-4">
                <a href="/" className="text-gray-600 hover:text-blue-600">Home</a>
                <a href="/login" className="text-gray-600 hover:text-blue-600">Login</a>
                <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Sign Up</a>
              </nav>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        
        {/* Simple Footer */}
        <footer className="bg-gray-800 text-white py-6 mt-8">
          <div className="container mx-auto px-4 text-center">
            <p>© 2024 FlySend. Connecting senders with travelers.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}