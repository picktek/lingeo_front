import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { PAGE_SIZE, searchWords } from '@/features/dictionary/api';
import { Spinner } from '@/shared/components/Spinner';

export function ListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);

  const query = useQuery({
    queryKey: ['words', search, offset],
    queryFn: () => searchWords({ search, offset }),
  });

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const total = query.data?.count ?? 0;
  const canGoBack = offset > 0;
  const canGoForward = offset + PAGE_SIZE < total;

  const emptyMessage = useMemo(() => {
    if (query.isLoading) {
      return null;
    }

    return search ? 'No matching words found.' : 'No words found.';
  }, [query.isLoading, search]);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Lingeo Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">English words</h1>
        </div>

        <Link
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          to="/new"
        >
          Add word
        </Link>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700" htmlFor="word-search">
          Search
        </label>
        <input
          id="word-search"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-900 transition focus:ring-2"
          placeholder="Type an English word…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOffset(0);
          }}
        />
      </div>

      {query.isLoading ? <Spinner label="Loading words…" /> : null}

      {query.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load words. Please try again.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">English</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {query.data?.items.map((word) => (
              <tr
                className="cursor-pointer transition hover:bg-slate-50"
                key={word.id}
                onClick={() => navigate(`/item/${word.id}`)}
              >
                <td className="w-24 px-4 py-3 font-mono text-slate-500">{word.id}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{word.eng}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!query.data?.items.length && emptyMessage ? (
          <div className="p-6 text-center text-sm text-slate-500">{emptyMessage}</div>
        ) : null}
      </div>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Page {page} · {total} total words
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canGoBack}
            onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
            type="button"
          >
            Previous
          </button>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canGoForward}
            onClick={() => setOffset((current) => current + PAGE_SIZE)}
            type="button"
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}
