import Link from "next/link";

export default function NotFound() {
  return (
    <div className="klimt-error-page">
      <h2>Page not found</h2>
      <Link href="/">Back to matches</Link>
    </div>
  );
}
