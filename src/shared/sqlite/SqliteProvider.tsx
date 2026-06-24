import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { detectSqliteSchema, type SqliteSchema } from './schema';

type SqliteContextValue = {
  db: Database | null;
  schema: SqliteSchema | null;
  fileName: string | null;
  isReady: boolean;
  error: string | null;
  openFile: (file: File) => Promise<void>;
  downloadFile: () => void;
  closeDatabase: () => void;
};

const SqliteContext = createContext<SqliteContextValue | null>(null);

let sqlPromise: Promise<SqlJsStatic> | null = null;

function loadSqlJs() {
  sqlPromise ??= initSqlJs({
    locateFile: () => wasmUrl,
  });

  return sqlPromise;
}

export function SqliteProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<Database | null>(null);
  const [schema, setSchema] = useState<SqliteSchema | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = useMemo<SqliteContextValue>(
    () => ({
      db,
      schema,
      fileName,
      isReady: Boolean(db && schema),
      error,
      async openFile(file: File) {
        setError(null);

        try {
          const SQL = await loadSqlJs();
          const buffer = await file.arrayBuffer();
          const nextDb = new SQL.Database(new Uint8Array(buffer));
          const nextSchema = detectSqliteSchema(nextDb);

          db?.close();
          setDb(nextDb);
          setSchema(nextSchema);
          setFileName(file.name);
        } catch (openError) {
          setDb(null);
          setSchema(null);
          setFileName(null);
          setError(openError instanceof Error ? openError.message : 'Could not open SQLite file.');
        }
      },
      downloadFile() {
        if (!db) {
          return;
        }

        const bytes = db.export();
        const blob = new Blob([bytes], { type: 'application/vnd.sqlite3' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName
          ? fileName.replace(/(\.sqlite|\.sqlite3|\.db)?$/i, '.updated.sqlite')
          : 'lingeo.updated.sqlite';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      closeDatabase() {
        db?.close();
        setDb(null);
        setSchema(null);
        setFileName(null);
        setError(null);
      },
    }),
    [db, error, fileName, schema],
  );

  return <SqliteContext.Provider value={value}>{children}</SqliteContext.Provider>;
}

export function useSqlite() {
  const context = useContext(SqliteContext);

  if (!context) {
    throw new Error('useSqlite must be used inside SqliteProvider.');
  }

  return context;
}
