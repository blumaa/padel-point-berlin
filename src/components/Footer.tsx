import Link from "next/link";

export default function Footer() {
  return (
    <footer className="klimt-footer">
      <div className="klimt-footer-row">
        <span>© {new Date().getFullYear()} PadelPoint Berlin</span>
        <Link href="/privacy" className="klimt-footer-link">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
