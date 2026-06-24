# lingeo_front

Frontend admin UI for the Lingeo English-Georgian dictionary.

## Migration branch

This branch migrates the app from Create React App / React 16 to a modern frontend stack:

- React 19
- Vite
- TypeScript
- React Router v7
- TanStack Query
- native `fetch`
- Tailwind CSS v4
- React Testing Library
- Vitest
- Prettier

## Development

```bash
npm install
npm run dev
```

The dev server runs on port `3001`.

## Environment

By default the frontend calls the backend at `/api` on the same host.

For local backend development, create `.env.local`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

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

- `/` - word list and search
- `/item/:id` - edit existing word
- `/item` - new word fallback route
- `/new` - create new word
- `/login` - login page
