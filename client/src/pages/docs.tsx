import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Docs() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="glass-dark backdrop-blur-xl bg-black/30 max-w-3xl w-full p-6 rounded-2xl mb-12 border border-white/20">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">API Documentation</h1>
          <Link href="/">
            <Button variant="outline" className="glass-button rounded-full">
              <i className="ri-home-line mr-2 text-white"></i> <span className="text-white">Home</span>
            </Button>
          </Link>
        </div>

        <div className="space-y-6 text-white/90">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Introduction</h2>
            <p className="mb-4">
              This is the API documentation for our chat service. You can use these endpoints to interact with the chat programmatically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Send Message</h2>
            <div className="glass-dark bg-black/20 p-4 rounded-xl border border-white/10">
              <div className="flex items-center mb-2">
                <span className="bg-green-600 px-2 py-1 rounded text-xs font-mono mr-2">GET</span>
                <code className="font-mono">/api/say</code>
              </div>
              <p className="mb-2">Send a message to the chat with specified text and username.</p>
              <div className="mb-2">
                <h3 className="text-sm font-semibold mb-1">Parameters:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li><code className="font-mono text-blue-300">text</code> - The message content to send</li>
                  <li><code className="font-mono text-blue-300">name</code> - (Optional) The sender's name</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Example:</h3>
                <code className="font-mono block bg-black/30 p-2 rounded overflow-x-auto">
                  /api/say?text=Hello world&name=username
                </code>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Get Messages</h2>
            <div className="glass-dark bg-black/20 p-4 rounded-xl border border-white/10">
              <div className="flex items-center mb-2">
                <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono mr-2">GET</span>
                <code className="font-mono">/api/messages</code>
              </div>
              <p className="mb-2">Get all messages from the chat.</p>
              <div>
                <h3 className="text-sm font-semibold mb-1">Response Format:</h3>
                <pre className="font-mono bg-black/30 p-2 rounded overflow-x-auto">
{`[
  {
    "id": 1,
    "content": "Hello world",
    "senderName": "username",
    "timestamp": "2025-05-08T08:00:00.000Z",
    ...
  },
  ...
]`}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Message Attributes Filter</h2>
            <p className="mb-2">You can filter message attributes using the following endpoint:</p>
            <div className="glass-dark bg-black/20 p-4 rounded-xl border border-white/10">
              <code className="font-mono block">/api/messages?attribute=text,username,time</code>
            </div>
            <p className="mt-2 mb-2">Available attributes:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li><code className="font-mono text-blue-300">text</code> - Message content</li>
              <li><code className="font-mono text-blue-300">username</code> - Sender name (partially masked)</li>
              <li><code className="font-mono text-blue-300">time</code> - Message timestamp</li>
            </ul>
            <p className="mt-2">You can also limit the number of messages using the amount parameter:</p>
            <div className="glass-dark bg-black/20 p-4 rounded-xl border border-white/10 mt-2">
              <code className="font-mono block">/api/messages?attribute=text&amount=1</code>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Health Check</h2>
            <div className="glass-dark bg-black/20 p-4 rounded-xl border border-white/10">
              <div className="flex items-center mb-2">
                <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono mr-2">GET</span>
                <code className="font-mono">/api/health</code>
              </div>
              <p className="mb-2">Check if the API is running.</p>
              <div>
                <h3 className="text-sm font-semibold mb-1">Response Format:</h3>
                <pre className="font-mono bg-black/30 p-2 rounded overflow-x-auto">
{`{
  "status": "ok",
  "time": "2025-05-08T08:00:00.000Z"
}`}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}