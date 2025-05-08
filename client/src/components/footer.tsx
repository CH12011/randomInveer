import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="fixed bottom-2 left-0 right-0 flex justify-center items-center p-2 z-10 text-xs text-white/70">
      <div className="glass-dark rounded-full px-6 py-2 flex space-x-4">
        <Link href="/docs">
          <a className="hover:text-white transition-colors">Docs</a>
        </Link>
        <span>∙</span>
        <Link href="/privacy">
          <a className="hover:text-white transition-colors">Privacy Policy</a>
        </Link>
      </div>
    </footer>
  );
}