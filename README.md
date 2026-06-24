# lingeo_front

Frontend admin UI for the Lingeo English-Georgian dictionary.

## Migration branch

This branch migrates the app from Create React App / React 16 to a modern local-first frontend stack:

- React 19
- Vite
- TypeScript
- React Router v7
- TanStack Query
- browser SQLite via `sql.js`
- Tailwind CSS v4
- React Testing Library
- Vitest
- Prettier

## Local SQLite mode

This branch does not require the old backend API. Open a `.sqlite`, `.sqlite3`, or `.db` file from the toolbar at the top of the app.

The app loads the database in the browser, detects the dictionary tables, and runs SQLite queries directly for:

- word search and pagination
- word type loading
- word create/update
- Georgian translation create/update/delete
- word delete

Browser security prevents a normal web app from silently overwriting an arbitrary file on disk. After editing, click **Download updated DB** to export the modified SQLite file.

## Expected schema

The implementation supports the legacy `lingeo_back` database shape:

- `eng`: English words, with `id`, `eng`, `type`, and `transcription`
- `geo`: Georgian words, with `id`, `geo`, and `type`
- `geo_eng`: join table, with `eng_id`, `geo_id`, and optional `type`
- `types`: word types, with `id`, `name`, and `abbr`

The old backend stores Georgian text in keyboard-encoded Latin characters and converts it in the API. This frontend now performs the same encode/decode step while reading and writing SQLite rows.

If your SQLite schema uses different names, update `src/shared/sqlite/schema.ts`.

## Development

```bash
npm install
npm run dev
```

The dev server runs on port `3001`.

## Scripts

```bash
npm run dev          # start Vite dev server
npm run build        # type-check and build production bundle
npm run test         # run Vitest in watch mode
npm run test:run     # run tests once
npm run format       # format files with Prettier
npm run format:check # check formatting
```

## Routes

- `/` - SQLite database workspace, word list, and search
- `/item/:id` - edit existing word
- `/item` - new word fallback route
- `/new` - create new word
- `/login` - disabled backend-login notice
