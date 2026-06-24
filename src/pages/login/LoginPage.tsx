import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { checkLogin, login } from '@/features/auth/api';
import { Spinner } from '@/shared/components/Spinner';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const statusQuery = useQuery({
    queryKey: ['login-status'],
    queryFn: checkLogin,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate('/'),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Lingeo Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Sign in</h1>
        </div>

        {statusQuery.isLoading ? <Spinner label="Checking session…" /> : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Username
          <input
            autoComplete="username"
            className="rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-slate-900 transition focus:ring-2"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            autoComplete="current-password"
            className="rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-slate-900 transition focus:ring-2"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {loginMutation.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Login failed. Please check your credentials and try again.
          </div>
        ) : null}

        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
          disabled={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
