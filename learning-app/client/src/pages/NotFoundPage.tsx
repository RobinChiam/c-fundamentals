import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-slate-600">
        The page you requested does not exist in this learning application.
      </p>
      <Link
        to="/"
        className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
      >
        Return to curriculum
      </Link>
    </div>
  );
}
