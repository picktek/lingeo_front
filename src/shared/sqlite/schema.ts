import type { Database } from 'sql.js';

export type TableColumn = {
  name: string;
  type: string;
};

export type SqliteSchema = {
  english: {
    table: string;
    id: string;
    eng: string;
    transcription?: string;
    engType?: string;
  };
  translations: {
    table: string;
    id: string;
    englishId: string;
    geo: string;
    typeId?: string;
  };
  wordTypes: {
    table: string;
    id: string;
    name: string;
    abbr: string;
  };
};

function getTables(db: Database) {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );

  return result[0]?.values.map(([name]) => String(name)) ?? [];
}

function getColumns(db: Database, table: string): TableColumn[] {
  const result = db.exec(`PRAGMA table_info(${quoteIdentifier(table)})`);

  return (
    result[0]?.values.map((row) => ({
      name: String(row[1]),
      type: String(row[2] ?? ''),
    })) ?? []
  );
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function hasColumn(columns: TableColumn[], name: string) {
  return columns.some((column) => column.name === name);
}

function findFirstColumn(columns: TableColumn[], names: string[]) {
  return names.find((name) => hasColumn(columns, name));
}

function describeColumns(columns: TableColumn[]) {
  return columns.map((column) => column.name).join(', ');
}

export function detectSqliteSchema(db: Database): SqliteSchema {
  const tableNames = getTables(db);
  const tables = tableNames.map((table) => ({ table, columns: getColumns(db, table) }));

  const englishTable = tables.find(({ columns }) => hasColumn(columns, 'id') && hasColumn(columns, 'eng'));

  if (!englishTable) {
    throw new Error(
      `Could not find English word table. Expected a table with columns: id, eng. Found tables: ${tables
        .map(({ table, columns }) => `${table}(${describeColumns(columns)})`)
        .join('; ')}`,
    );
  }

  const wordTypesTable = tables.find(
    ({ columns }) =>
      hasColumn(columns, 'id') &&
      hasColumn(columns, 'abbr') &&
      Boolean(findFirstColumn(columns, ['name', 'type'])),
  );

  if (!wordTypesTable) {
    throw new Error('Could not find word type table. Expected columns: id, name/type, abbr.');
  }

  const translationsTable = tables.find(({ table, columns }) => {
    if (table === englishTable.table || table === wordTypesTable.table) {
      return false;
    }

    return (
      hasColumn(columns, 'id') &&
      hasColumn(columns, 'geo') &&
      Boolean(findFirstColumn(columns, ['eng_id', 'english_id', 'word_id', 'item_id']))
    );
  });

  if (!translationsTable) {
    throw new Error(
      'Could not find Georgian translation table. Expected columns: id, geo, and one of eng_id/english_id/word_id/item_id.',
    );
  }

  const englishId = findFirstColumn(translationsTable.columns, [
    'eng_id',
    'english_id',
    'word_id',
    'item_id',
  ]);
  const typeName = findFirstColumn(wordTypesTable.columns, ['name', 'type']);
  const translationTypeId = findFirstColumn(translationsTable.columns, ['type_id', 'word_type_id']);

  if (!englishId || !typeName) {
    throw new Error('Could not detect required schema fields.');
  }

  return {
    english: {
      table: englishTable.table,
      id: 'id',
      eng: 'eng',
      transcription: findFirstColumn(englishTable.columns, ['transcription', 'transcript']),
      engType: findFirstColumn(englishTable.columns, ['eng_type', 'type_id', 'word_type_id']),
    },
    translations: {
      table: translationsTable.table,
      id: 'id',
      englishId,
      geo: 'geo',
      typeId: translationTypeId,
    },
    wordTypes: {
      table: wordTypesTable.table,
      id: 'id',
      name: typeName,
      abbr: 'abbr',
    },
  };
}

export { quoteIdentifier };
