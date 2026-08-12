import { Link, Outlet } from "react-router";
import { ApiStatus } from "./ApiStatus";
import { SkipLink } from "./SkipLink";

export function AppShell() {
  return (
    <div className="min-h-screen">
      <SkipLink />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <Link
              to="/"
              className="text-lg font-semibold text-slate-900 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              C Fundamentals Learning Lab
            </Link>
            <nav aria-label="Main">
              <Link
                to="/"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Curriculum
              </Link>
            </nav>
          </div>
          <ApiStatus />
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
        <Outlet />
      </main>
    </div>
  );
}
