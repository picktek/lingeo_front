import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { deleteWord, getWord, getWordTypes, saveWord } from '@/features/dictionary/api';
import {
  createEmptyDictionaryItem,
  type DictionaryItem,
  type Translation,
} from '@/features/dictionary/types';
import { Spinner } from '@/shared/components/Spinner';

export function ItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;
  const [item, setItem] = useState<DictionaryItem>(() => createEmptyDictionaryItem());

  const wordQuery = useQuery({
    queryKey: ['word', id],
    queryFn: () => getWord(id!),
    enabled: !isNew,
  });

  const wordTypesQuery = useQuery({
    queryKey: ['word-types'],
    queryFn: getWordTypes,
  });

  const saveMutation = useMutation({
    mutationFn: saveWord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['words'] });
      navigate('/');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['words'] });
      navigate('/');
    },
  });

  useEffect(() => {
    if (wordQuery.data) {
      setItem({
        ...wordQuery.data,
        eng: wordQuery.data.eng ?? '',
        transcription: wordQuery.data.transcription ?? '',
        eng_type: wordQuery.data.eng_type ?? null,
        geos: wordQuery.data.geos ?? [],
      });
    }
  }, [wordQuery.data]);

  const title = isNew ? 'Add word' : `Edit ${item.eng || 'word'}`;
  const wordTypes = wordTypesQuery.data ?? [];
  const isBusy = saveMutation.isPending || deleteMutation.isPending;
  const hasTranslations = item.geos.length > 0;

  const sortedWordTypes = useMemo(
    () => [...wordTypes].sort((a, b) => a.name.localeCompare(b.name)),
    [wordTypes],
  );

  function updateItem<K extends keyof DictionaryItem>(key: K, value: DictionaryItem[K]) {
    setItem((current) => ({ ...current, [key]: value }));
  }

  function updateTranslation(index: number, patch: Partial<Translation>) {
    setItem((current) => ({
      ...current,
      geos: current.geos.map((translation, translationIndex) =>
        translationIndex === index ? { ...translation, ...patch } : translation,
      ),
    }));
  }

  function addTranslation() {
    setItem((current) => {
      const minId = Math.min(-1, ...current.geos.map((translation) => translation.id));

      return {
        ...current,
        geos: [...current.geos, { id: minId - 1, geo: '', type_id: 1 }],
      };
    });
  }

  function removeTranslation(index: number) {
    setItem((current) => ({
      ...current,
      geos: current.geos.filter((_, translationIndex) => translationIndex !== index),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate(item);
  }

  function handleDelete() {
    if (item.id === -1) {
      return;
    }

    const confirmed = window.confirm(`Delete “${item.eng}”?`);

    if (confirmed) {
      deleteMutation.mutate(item.id);
    }
  }

  if (wordQuery.isLoading || wordTypesQuery.isLoading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-8">
        <Spinner label="Loading word…" />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="text-sm font-medium text-slate-500 hover:text-slate-900" to="/">
            ← Back to words
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        </div>

        {!isNew && item.id !== -1 ? (
          <button
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            disabled={isBusy}
            onClick={handleDelete}
            type="button"
          >
            Delete
          </button>
        ) : null}
      </header>

      {wordQuery.isError || wordTypesQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load this word. Please go back and try again.
        </div>
      ) : null}

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              English word
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-slate-900 transition focus:ring-2"
                required
                value={item.eng ?? ''}
                onChange={(event) => updateItem('eng', event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Type
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-slate-900 transition focus:ring-2"
                value={item.eng_type ?? ''}
                onChange={(event) =>
                  updateItem('eng_type', event.target.value ? Number(event.target.value) : null)
                }
              >
                <option value="">Select type</option>
                {sortedWordTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.abbr})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-3">
              Transcription
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-slate-900 transition focus:ring-2"
                value={item.transcription ?? ''}
                onChange={(event) => updateItem('transcription', event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Georgian translations</h2>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
              onClick={addTranslation}
              type="button"
            >
              Add translation
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {hasTranslations ? null : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No Georgian translations added yet.
              </p>
            )}

            {item.geos.map((translation, index) => (
              <div
                className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_220px_auto]"
                key={translation.id}
              >
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Georgian word
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-slate-900 transition focus:ring-2"
                    placeholder="ქართული სიტყვა"
                    value={translation.geo ?? ''}
                    onChange={(event) => updateTranslation(index, { geo: event.target.value })}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Type
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-base outline-none ring-slate-900 transition focus:ring-2"
                    value={translation.type_id ?? ''}
                    onChange={(event) =>
                      updateTranslation(index, {
                        type_id: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">Select type</option>
                    {sortedWordTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.abbr})
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="self-end rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                  onClick={() => removeTranslation(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {saveMutation.isError || deleteMutation.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not save changes. Please check the fields and try again.
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50"
            to="/"
          >
            Cancel
          </Link>
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
            disabled={isBusy}
            type="submit"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  );
}
