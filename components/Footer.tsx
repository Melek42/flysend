// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">FlySend</p>
          <p className="text-gray-400 mb-4">Connecting travelers with package senders</p>
          <div className="flex justify-center space-x-6 mb-4">
            <Link href="/about" className="hover:text-blue-400">About</Link>
            <Link href="/help" className="hover:text-blue-400">Help</Link>
            <Link href="/terms" className="hover:text-blue-400">Terms</Link>
            <Link href="/privacy" className="hover:text-blue-400">Privacy</Link>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} FlySend. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
