// app/help/page.tsx
export default function HelpPage() {
    const faqs = [
        {
            question: "How does FlySend work?",
            answer: "FlySend connects travelers with spare luggage space to people who need to send packages. Travelers earn extra money, senders save on shipping costs."
        },
        {
            question: "Is it safe to use?",
            answer: "Yes! We have ID verification, user reviews, and secure in-app messaging. Always meet in public places and inspect items together."
        },
        {
            question: "What can I send?",
            answer: "You can send food, clothes, electronics, documents, and gifts. No cash, weapons, or illegal substances."
        },
        // Add more FAQs
    ];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Help & FAQ</h1>

            <div className="space-y-6">
                {faqs.map((faq, index) => (
                    <div key={index} className="bg-white rounded-xl shadow p-6">
                        <h3 className="text-xl font-bold mb-3">{faq.question}</h3>
                        <p className="text-gray-600">{faq.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}