import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="glass-dark backdrop-blur-xl bg-black/30 max-w-3xl w-full p-6 rounded-2xl mb-12 border border-white/20"> {/* Changed to bg-white */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Privacy Policy</h1> {/* Changed text color for better contrast */}
          <Link href="/">
            <Button variant="outline" className="glass-button rounded-full">
              <i className="ri-home-line mr-2 text-gray-800"></i> <span className="text-gray-800">Home</span>
            </Button>
          </Link>
        </div>

        <div className="space-y-6 text-gray-800"> {/* Changed text color for better contrast */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Introduction</h2>
            <p className="mb-4">
              This Privacy Policy describes how we collect, use, and share information when you use our chat service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Information We Collect</h2>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>Messages sent through the chat service</li>
              <li>IP addresses (partially anonymized)</li>
              <li>Files uploaded through the service</li>
              <li>Device information and browser type</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">How We Use Information</h2>
            <p className="mb-2">We use the collected information to:</p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>Provide and maintain the chat service</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Prevent abuse and unauthorized access</li>
              <li>Improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Data Retention</h2>
            <p>
              Messages and uploaded files are stored in our system for a limited period. Messages older 
              than 30 days may be automatically deleted. Users have no expectation of permanent storage 
              or backup of chat content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Information Sharing</h2>
            <p>
              We do not sell or share your personal information with third parties except as necessary 
              to provide the service or comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Security</h2>
            <p>
              We take reasonable measures to protect the information we collect. However, no method of 
              transmission over the Internet is completely secure. Therefore, while we strive to protect 
              your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify users of any changes 
              by posting the new privacy policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}