import { apiGet, apiPost } from '@/shared/api/client';
import type { DictionaryItem, WordListResponse, WordType } from './types';

const PAGE_SIZE = 50;

export function searchWords({
  search,
  offset,
  limit = PAGE_SIZE,
}: {
  search: string;
  offset: number;
  limit?: number;
}) {
  const params = new URLSearchParams({
    search,
    offset: String(offset),
    limit: String(limit),
  });

  return apiGet<WordListResponse>('/lingeo', params);
}

export function getWord(id: string) {
  return apiGet<DictionaryItem>(`/lingeo/${id}`);
}

export function getWordTypes() {
  return apiGet<WordType[]>('/lingeo/word_types');
}

export function saveWord(item: DictionaryItem) {
  const id = item.id ?? 0;
  return apiPost<DictionaryItem>(`/lingeo/${id}`, item);
}

export function deleteWord(id: number) {
  return apiPost<{ success: boolean }>(`/lingeo/delete/${id}`);
}

export { PAGE_SIZE };
