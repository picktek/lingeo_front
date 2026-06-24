export type WordType = {
  id: number;
  name: string;
  abbr: string;
};

export type Translation = {
  id: number;
  geo?: string;
  type_id: number | null;
  type?: string;
  abbr?: string;
};

export type DictionaryItem = {
  id: number;
  eng?: string;
  transcription?: string;
  eng_type?: number | null;
  geos: Translation[];
};

export type WordListItem = {
  id: number;
  eng: string;
};

export type WordListResponse = {
  items: WordListItem[];
  count: number;
};

export const createEmptyDictionaryItem = (): DictionaryItem => ({
  id: -1,
  eng: '',
  transcription: '',
  eng_type: null,
  geos: [],
});
