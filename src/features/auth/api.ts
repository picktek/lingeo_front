import { apiGet, apiPost } from '@/shared/api/client';

export type LoginPayload = {
  username: string;
  password: string;
};

export function checkLogin() {
  return apiGet<{ authenticated?: boolean } | undefined>('/login');
}

export function login(payload: LoginPayload) {
  return apiPost<{ authenticated?: boolean } | undefined>('/login', payload);
}
