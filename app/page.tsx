// app/page.tsx - UPDATE THIS
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Send Packages to Ethiopia
          <span className="block text-blue-600 mt-2">With Travelers Going That Way</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with travelers who have spare luggage space. Send food, clothes, electronics, and gifts to Ethiopia at a fraction of traditional shipping costs.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/register?type=sender" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Send a Package
          </Link>
          <Link 
            href="/register?type=traveler" 
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"
          >
            Become a Traveler
          </Link>
        </div>
        
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Send Anything</h3>
            <p className="text-gray-600">Food, clothes, electronics, documents - send what matters most.</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">✈️</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Earn Extra</h3>
            <p className="text-gray-600">Travelers earn money for carrying packages in spare luggage space.</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Safe & Secure</h3>
            <p className="text-gray-600">Verified users, secure payments, and in-app communication.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
