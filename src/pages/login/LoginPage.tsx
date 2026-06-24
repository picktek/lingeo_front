import { Link } from 'react-router';

export function LoginPage() {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Lingeo Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Local SQLite mode</h1>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          Backend login is disabled in this branch. Open a local SQLite database file from the toolbar and edit it directly in the browser.
        </p>

        <Link
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          to="/"
        >
          Go to database workspace
        </Link>
      </div>
    </section>
  );
}
