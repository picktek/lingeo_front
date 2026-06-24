import type { Database } from 'sql.js';

import type { DictionaryItem, Translation, WordListResponse, WordType } from './types';
import { quoteIdentifier, type SqliteSchema } from '@/shared/sqlite/schema';

type SqlValue = string | number | null;

type RepositoryContext = {
  db: Database;
  schema: SqliteSchema;
};

function q(identifier: string) {
  return quoteIdentifier(identifier);
}

function singleRow<T extends Record<string, unknown>>(db: Database, sql: string, params: SqlValue[] = []) {
  const rows = rowsFromQuery<T>(db, sql, params);
  return rows[0];
}

function rowsFromQuery<T extends Record<string, unknown>>(db: Database, sql: string, params: SqlValue[] = []) {
  const statement = db.prepare(sql);
  const rows: T[] = [];

  try {
    statement.bind(params);

    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }
  } finally {
    statement.free();
  }

  return rows;
}

function run(db: Database, sql: string, params: SqlValue[] = []) {
  const statement = db.prepare(sql);

  try {
    statement.run(params);
  } finally {
    statement.free();
  }
}

function lastInsertId(db: Database) {
  const row = singleRow<{ id: number }>(db, 'SELECT last_insert_rowid() AS id');
  return Number(row?.id ?? -1);
}

export function searchWordsSqlite(
  { db, schema }: RepositoryContext,
  { search, offset, limit }: { search: string; offset: number; limit: number },
): WordListResponse {
  const english = schema.english;
  const where = search.trim() ? `WHERE ${q(english.eng)} LIKE ?` : '';
  const params: SqlValue[] = search.trim() ? [`%${search.trim()}%`] : [];
  const countRow = singleRow<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count FROM ${q(english.table)} ${where}`,
    params,
  );
  const items = rowsFromQuery<{ id: number; eng: string }>(
    db,
    `SELECT ${q(english.id)} AS id, ${q(english.eng)} AS eng
       FROM ${q(english.table)}
       ${where}
       ORDER BY ${q(english.eng)} COLLATE NOCASE
       LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return {
    items,
    count: Number(countRow?.count ?? 0),
  };
}

export function getWordTypesSqlite({ db, schema }: RepositoryContext): WordType[] {
  const wordTypes = schema.wordTypes;

  return rowsFromQuery<WordType>(
    db,
    `SELECT ${q(wordTypes.id)} AS id,
            ${q(wordTypes.name)} AS name,
            ${q(wordTypes.abbr)} AS abbr
       FROM ${q(wordTypes.table)}
       ORDER BY ${q(wordTypes.name)} COLLATE NOCASE`,
  );
}

export function getWordSqlite({ db, schema }: RepositoryContext, id: string): DictionaryItem {
  const english = schema.english;
  const translations = schema.translations;
  const englishColumns = [
    `${q(english.id)} AS id`,
    `${q(english.eng)} AS eng`,
    english.transcription ? `${q(english.transcription)} AS transcription` : `'' AS transcription`,
    english.engType ? `${q(english.engType)} AS eng_type` : 'NULL AS eng_type',
  ];
  const word = singleRow<Omit<DictionaryItem, 'geos'>>(
    db,
    `SELECT ${englishColumns.join(', ')}
       FROM ${q(english.table)}
      WHERE ${q(english.id)} = ?`,
    [Number(id)],
  );

  if (!word) {
    throw new Error(`Word ${id} was not found.`);
  }

  const translationColumns = [
    `${q(translations.id)} AS id`,
    `${q(translations.geo)} AS geo`,
    translations.typeId ? `${q(translations.typeId)} AS type_id` : 'NULL AS type_id',
  ];
  const geos = rowsFromQuery<Translation>(
    db,
    `SELECT ${translationColumns.join(', ')}
       FROM ${q(translations.table)}
      WHERE ${q(translations.englishId)} = ?
      ORDER BY ${q(translations.id)}`,
    [Number(id)],
  );

  return {
    ...word,
    id: Number(word.id),
    eng: String(word.eng ?? ''),
    transcription: String(word.transcription ?? ''),
    eng_type: word.eng_type === null || word.eng_type === undefined ? null : Number(word.eng_type),
    geos,
  };
}

export function saveWordSqlite({ db, schema }: RepositoryContext, item: DictionaryItem) {
  const english = schema.english;
  const translations = schema.translations;
  const isNew = item.id === -1;

  db.run('BEGIN TRANSACTION');

  try {
    let wordId = item.id;

    if (isNew) {
      const columns = [english.eng];
      const values: SqlValue[] = [item.eng ?? ''];

      if (english.transcription) {
        columns.push(english.transcription);
        values.push(item.transcription ?? '');
      }

      if (english.engType) {
        columns.push(english.engType);
        values.push(item.eng_type ?? null);
      }

      run(
        db,
        `INSERT INTO ${q(english.table)} (${columns.map(q).join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`,
        values,
      );
      wordId = lastInsertId(db);
    } else {
      const assignments = [`${q(english.eng)} = ?`];
      const values: SqlValue[] = [item.eng ?? ''];

      if (english.transcription) {
        assignments.push(`${q(english.transcription)} = ?`);
        values.push(item.transcription ?? '');
      }

      if (english.engType) {
        assignments.push(`${q(english.engType)} = ?`);
        values.push(item.eng_type ?? null);
      }

      run(
        db,
        `UPDATE ${q(english.table)}
            SET ${assignments.join(', ')}
          WHERE ${q(english.id)} = ?`,
        [...values, wordId],
      );
    }

    run(db, `DELETE FROM ${q(translations.table)} WHERE ${q(translations.englishId)} = ?`, [wordId]);

    for (const translation of item.geos) {
      if (!translation.geo?.trim()) {
        continue;
      }

      const columns = [translations.englishId, translations.geo];
      const values: SqlValue[] = [wordId, translation.geo.trim()];

      if (translations.typeId) {
        columns.push(translations.typeId);
        values.push(translation.type_id ?? null);
      }

      run(
        db,
        `INSERT INTO ${q(translations.table)} (${columns.map(q).join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`,
        values,
      );
    }

    db.run('COMMIT');

    return { new_eng_id: isNew ? wordId : undefined };
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}

export function deleteWordSqlite({ db, schema }: RepositoryContext, id: number) {
  const english = schema.english;
  const translations = schema.translations;

  db.run('BEGIN TRANSACTION');

  try {
    run(db, `DELETE FROM ${q(translations.table)} WHERE ${q(translations.englishId)} = ?`, [id]);
    run(db, `DELETE FROM ${q(english.table)} WHERE ${q(english.id)} = ?`, [id]);
    db.run('COMMIT');
    return { success: true };
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}
