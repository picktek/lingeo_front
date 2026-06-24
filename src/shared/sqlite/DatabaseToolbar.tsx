import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { useSqlite } from './SqliteProvider';

export function DatabaseToolbar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { closeDatabase, downloadFile, error, fileName, isReady, openFile, schema } = useSqlite();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await openFile(file);
    await queryClient.invalidateQueries();
    event.target.value = '';
  }

  return (
    <div className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SQLite workspace</p>
          <p className="text-sm text-slate-700">
            {isReady && fileName ? `Opened ${fileName}` : 'Open a local SQLite database file to begin.'}
          </p>
          {schema ? (
            <p className="mt-1 text-xs text-slate-500">
              Tables: {schema.english.table}, {schema.geoEnglish.table}, {schema.geo.table}, {schema.wordTypes.table}
            </p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3,application/x-sqlite3"
            className="hidden"
            onChange={handleFileChange}
            ref={inputRef}
            type="file"
          />
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Open database
          </button>
          <button
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
            disabled={!isReady}
            onClick={downloadFile}
            type="button"
          >
            Download updated DB
          </button>
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
            disabled={!isReady}
            onClick={async () => {
              closeDatabase();
              await queryClient.invalidateQueries();
            }}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
