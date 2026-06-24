import { createBrowserRouter, Navigate, Outlet } from 'react-router';

import { ItemPage } from '@/pages/item/ItemPage';
import { ListPage } from '@/pages/list/ListPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { DatabaseToolbar } from '@/shared/sqlite/DatabaseToolbar';

function RootLayout() {
  return (
    <main className="min-h-screen">
      <DatabaseToolbar />
      <Outlet />
    </main>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <ListPage /> },
      { path: '/item/:id', element: <ItemPage /> },
      { path: '/item', element: <ItemPage /> },
      { path: '/new', element: <ItemPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
