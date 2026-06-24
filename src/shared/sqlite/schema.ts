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
  geo: {
    table: string;
    id: string;
    geo: string;
    typeId: string;
  };
  geoEnglish: {
    table: string;
    englishId: string;
    geoId: string;
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

  const englishTable = tables.find(({ table, columns }) =>
    table === 'eng' || (hasColumn(columns, 'id') && hasColumn(columns, 'eng')),
  );

  if (!englishTable) {
    throw new Error(
      `Could not find English word table. Expected a table with columns: id, eng. Found tables: ${tables
        .map(({ table, columns }) => `${table}(${describeColumns(columns)})`)
        .join('; ')}`,
    );
  }

  const geoTable = tables.find(({ table, columns }) =>
    table === 'geo' || (hasColumn(columns, 'id') && hasColumn(columns, 'geo') && hasColumn(columns, 'type')),
  );

  if (!geoTable) {
    throw new Error('Could not find Georgian word table. Expected columns: id, geo, type.');
  }

  const geoEnglishTable = tables.find(({ table, columns }) =>
    table === 'geo_eng' ||
    (hasColumn(columns, 'eng_id') && hasColumn(columns, 'geo_id')) ||
    (hasColumn(columns, 'english_id') && hasColumn(columns, 'geo_id')),
  );

  if (!geoEnglishTable) {
    throw new Error('Could not find English/Georgian join table. Expected geo_eng with eng_id and geo_id.');
  }

  const wordTypesTable = tables.find(({ table, columns }) =>
    table === 'types' ||
    (hasColumn(columns, 'id') && hasColumn(columns, 'abbr') && Boolean(findFirstColumn(columns, ['name', 'type']))),
  );

  if (!wordTypesTable) {
    throw new Error('Could not find word type table. Expected columns: id, name/type, abbr.');
  }

  const typeName = findFirstColumn(wordTypesTable.columns, ['name', 'type']);
  const englishId = findFirstColumn(geoEnglishTable.columns, ['eng_id', 'english_id', 'word_id', 'item_id']);
  const geoId = findFirstColumn(geoEnglishTable.columns, ['geo_id', 'translation_id']);

  if (!typeName || !englishId || !geoId) {
    throw new Error('Could not detect required schema fields.');
  }

  return {
    english: {
      table: englishTable.table,
      id: 'id',
      eng: 'eng',
      transcription: findFirstColumn(englishTable.columns, ['transcription', 'transcript']),
      engType: findFirstColumn(englishTable.columns, ['type', 'eng_type', 'type_id', 'word_type_id']),
    },
    geo: {
      table: geoTable.table,
      id: 'id',
      geo: 'geo',
      typeId: findFirstColumn(geoTable.columns, ['type', 'type_id', 'word_type_id']) ?? 'type',
    },
    geoEnglish: {
      table: geoEnglishTable.table,
      englishId,
      geoId,
      typeId: findFirstColumn(geoEnglishTable.columns, ['type', 'type_id', 'word_type_id']),
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
