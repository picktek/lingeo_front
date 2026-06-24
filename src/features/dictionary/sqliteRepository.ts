import type { Database } from 'sql.js';

import type { DictionaryItem, Translation, WordListResponse, WordType } from './types';
import { quoteIdentifier, type SqliteSchema } from '@/shared/sqlite/schema';

type SqlValue = string | number | null;

type RepositoryContext = {
  db: Database;
  schema: SqliteSchema;
};

const ENG_KEYBOARD_CODES = [
  96, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, 92, 113, 119, 101, 114, 116, 121,
  117, 105, 111, 112, 91, 93, 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, 39, 122,
  120, 99, 118, 98, 110, 109, 44, 46, 47, 126, 33, 64, 35, 36, 37, 94, 38, 42, 40, 41,
  95, 43, 124, 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, 65, 83, 68, 70, 71,
  72, 74, 75, 76, 58, 34, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63,
];

const GEO_KEYBOARD_CODES = [
  96, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, 92, 4325, 4332, 4308, 4320, 4322,
  4327, 4323, 4312, 4317, 4318, 91, 93, 4304, 4321, 4307, 4324, 4306, 4336, 4335, 4313,
  4314, 59, 39, 4310, 4334, 4330, 4309, 4305, 4316, 4315, 44, 46, 47, 126, 33, 64, 35,
  36, 37, 94, 38, 42, 40, 41, 95, 43, 124, 81, 4333, 69, 4326, 4311, 89, 85, 73, 79,
  80, 123, 125, 65, 4328, 68, 70, 71, 72, 4319, 75, 76, 58, 34, 4331, 88, 4329, 86,
  66, 78, 77, 60, 62, 63,
];

function q(identifier: string) {
  return quoteIdentifier(identifier);
}

function convertByKeyboardMap(value: string, from: number[], to: number[]) {
  const cache = new Map<string, string>();
  let converted = '';

  for (const char of value) {
    const cached = cache.get(char);

    if (cached) {
      converted += cached;
      continue;
    }

    const index = from.indexOf(char.charCodeAt(0));
    const nextChar = index === -1 ? char : String.fromCharCode(to[index]);
    cache.set(char, nextChar);
    converted += nextChar;
  }

  return converted;
}

function decodeGeo(value: string) {
  return convertByKeyboardMap(value, ENG_KEYBOARD_CODES, GEO_KEYBOARD_CODES);
}

function encodeGeo(value: string) {
  return convertByKeyboardMap(value, GEO_KEYBOARD_CODES, ENG_KEYBOARD_CODES);
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
  const where = search.trim() ? `WHERE ${q(english.eng)} LIKE ? || '%'` : '';
  const params: SqlValue[] = search.trim() ? [search.trim()] : [];
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
  const geo = schema.geo;
  const geoEnglish = schema.geoEnglish;
  const wordTypes = schema.wordTypes;
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

  const geos = rowsFromQuery<Translation & { encoded_geo: string }>(
    db,
    `SELECT ${q(geo.table)}.${q(geo.id)} AS id,
            ${q(geo.table)}.${q(geo.geo)} AS encoded_geo,
            ${q(wordTypes.table)}.${q(wordTypes.id)} AS type_id,
            ${q(wordTypes.table)}.${q(wordTypes.name)} AS type,
            ${q(wordTypes.table)}.${q(wordTypes.abbr)} AS abbr
       FROM ${q(geo.table)}
       JOIN ${q(geoEnglish.table)} ON ${q(geoEnglish.table)}.${q(geoEnglish.geoId)} = ${q(geo.table)}.${q(geo.id)}
       LEFT JOIN ${q(wordTypes.table)} ON ${q(wordTypes.table)}.${q(wordTypes.id)} = ${q(geo.table)}.${q(geo.typeId)}
      WHERE ${q(geoEnglish.table)}.${q(geoEnglish.englishId)} = ?
      GROUP BY ${q(geo.table)}.${q(geo.id)}
      ORDER BY ${q(geo.table)}.${q(geo.id)}`,
    [Number(id)],
  ).map((translation) => ({
    id: Number(translation.id),
    geo: decodeGeo(String(translation.encoded_geo ?? '')),
    type_id: translation.type_id === null || translation.type_id === undefined ? null : Number(translation.type_id),
    type: translation.type,
    abbr: translation.abbr,
  }));

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
  const geo = schema.geo;
  const geoEnglish = schema.geoEnglish;
  const isNew = item.id === -1;

  db.run('BEGIN TRANSACTION');

  try {
    let wordId = item.id;

    if (isNew) {
      const columns = [english.eng];
      const values: SqlValue[] = [item.eng ?? ''];

      if (english.engType) {
        columns.push(english.engType);
        values.push(item.eng_type ?? 1);
      }

      if (english.transcription) {
        columns.push(english.transcription);
        values.push(item.transcription ?? '');
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

    const currentGeoIds = rowsFromQuery<{ id: number }>(
      db,
      `SELECT ${q(geoEnglish.geoId)} AS id
         FROM ${q(geoEnglish.table)}
        WHERE ${q(geoEnglish.englishId)} = ?`,
      [wordId],
    ).map(({ id: geoId }) => Number(geoId));
    const keptGeoIds = new Set<number>();

    for (const translation of item.geos) {
      if (!translation.geo?.trim()) {
        continue;
      }

      const typeId = translation.type_id ?? 1;

      if (translation.id > 0 && currentGeoIds.includes(translation.id)) {
        run(
          db,
          `UPDATE ${q(geo.table)}
              SET ${q(geo.geo)} = ?, ${q(geo.typeId)} = ?
            WHERE ${q(geo.id)} = ?`,
          [encodeGeo(translation.geo.trim()), typeId, translation.id],
        );
        keptGeoIds.add(translation.id);
      } else {
        run(
          db,
          `INSERT INTO ${q(geo.table)} (${q(geo.geo)}, ${q(geo.typeId)}) VALUES(?, ?)`,
          [encodeGeo(translation.geo.trim()), typeId],
        );
        const geoId = lastInsertId(db);
        const columns = [geoEnglish.englishId, geoEnglish.geoId];
        const values: SqlValue[] = [wordId, geoId];

        if (geoEnglish.typeId) {
          columns.push(geoEnglish.typeId);
          values.push(typeId);
        }

        run(
          db,
          `INSERT INTO ${q(geoEnglish.table)} (${columns.map(q).join(', ')})
           VALUES (${columns.map(() => '?').join(', ')})`,
          values,
        );
        keptGeoIds.add(geoId);
      }
    }

    const removedGeoIds = currentGeoIds.filter((geoId) => !keptGeoIds.has(geoId));

    for (const geoId of removedGeoIds) {
      run(db, `DELETE FROM ${q(geoEnglish.table)} WHERE ${q(geoEnglish.geoId)} = ?`, [geoId]);
      run(db, `DELETE FROM ${q(geo.table)} WHERE ${q(geo.id)} = ?`, [geoId]);
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
  const geo = schema.geo;
  const geoEnglish = schema.geoEnglish;

  db.run('BEGIN TRANSACTION');

  try {
    const geoIds = rowsFromQuery<{ id: number }>(
      db,
      `SELECT ${q(geoEnglish.geoId)} AS id
         FROM ${q(geoEnglish.table)}
        WHERE ${q(geoEnglish.englishId)} = ?`,
      [id],
    ).map(({ id: geoId }) => Number(geoId));

    run(db, `DELETE FROM ${q(geoEnglish.table)} WHERE ${q(geoEnglish.englishId)} = ?`, [id]);

    for (const geoId of geoIds) {
      run(db, `DELETE FROM ${q(geo.table)} WHERE ${q(geo.id)} = ?`, [geoId]);
    }

    run(db, `DELETE FROM ${q(english.table)} WHERE ${q(english.id)} = ?`, [id]);
    db.run('COMMIT');
    return { success: true };
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}
