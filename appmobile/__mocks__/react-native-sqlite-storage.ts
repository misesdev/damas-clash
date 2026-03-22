/**
 * In-memory SQLite mock for Jest.
 *
 * Each call to openDatabase() returns a fresh, isolated in-memory database
 * instance. This gives every test a clean slate — just call
 * `chatDatabase.close()` in beforeEach to force a new empty db on the next
 * operation.
 *
 * Supported SQL:
 *   CREATE TABLE IF NOT EXISTS <name> (...)
 *   DELETE FROM <name>
 *   INSERT OR REPLACE INTO <name> (cols) VALUES (?)
 *   SELECT ... FROM <name> [WHERE col = ?] [ORDER BY col ASC|DESC] [LIMIT n]
 */

type Row = Record<string, any>;
type TableStore = Map<string, Row>; // primary-key value → full row

// ─── SQL mini-interpreter ─────────────────────────────────────────────────────

function parseTableName(sql: string): string | null {
  const m = sql.match(
    /(?:FROM|INTO|TABLE(?:\s+IF\s+NOT\s+EXISTS)?)\s+(\w+)/i,
  );
  return m ? m[1].toLowerCase() : null;
}

function createInMemoryDb() {
  const store = new Map<string, TableStore>();

  function getTable(name: string): TableStore {
    const key = name.toLowerCase();
    if (!store.has(key)) {store.set(key, new Map());}
    return store.get(key)!;
  }

  type ExecResult = [{rows: {length: number; item: (i: number) => Row | null}}];

  function exec(sql: string, params: any[] = []): ExecResult {
    const upper = sql.trim().toUpperCase();

    // ── CREATE TABLE ──────────────────────────────────────────────────────────
    if (upper.startsWith('CREATE TABLE')) {
      const name = parseTableName(sql);
      if (name) {getTable(name);}
      return [{rows: {length: 0, item: () => null}}];
    }

    // ── DELETE FROM ───────────────────────────────────────────────────────────
    if (upper.startsWith('DELETE FROM')) {
      const name = parseTableName(sql);
      if (name) {getTable(name).clear();}
      return [{rows: {length: 0, item: () => null}}];
    }

    // ── INSERT OR REPLACE INTO ────────────────────────────────────────────────
    if (upper.startsWith('INSERT OR REPLACE INTO') || upper.startsWith('INSERT INTO')) {
      const name = parseTableName(sql);
      if (!name) {return [{rows: {length: 0, item: () => null}}];}

      const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      if (!colMatch) {return [{rows: {length: 0, item: () => null}}];}

      const cols = colMatch[1].split(',').map(c => c.trim());
      const row: Row = {};
      cols.forEach((col, i) => {row[col] = params[i] !== undefined ? params[i] : null;});

      // Use the first column as primary key
      const pk = String(row[cols[0]]);
      getTable(name).set(pk, row);
      return [{rows: {length: 0, item: () => null}}];
    }

    // ── SELECT ────────────────────────────────────────────────────────────────
    if (upper.startsWith('SELECT')) {
      const name = parseTableName(sql);
      if (!name) {return [{rows: {length: 0, item: () => null}}];}

      let rows = Array.from(getTable(name).values());

      // WHERE col = ?
      const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (whereMatch) {
        const col = whereMatch[1];
        rows = rows.filter(r => r[col] === params[0]);
      }

      // ORDER BY col ASC|DESC
      const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
      if (orderMatch) {
        const col = orderMatch[1];
        const dir = (orderMatch[2] ?? 'ASC').toUpperCase();
        rows = [...rows].sort((a, b) => {
          if (a[col] < b[col]) {return dir === 'ASC' ? -1 : 1;}
          if (a[col] > b[col]) {return dir === 'ASC' ? 1 : -1;}
          return 0;
        });
      }

      // LIMIT n
      const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {rows = rows.slice(0, parseInt(limitMatch[1], 10));}

      return [{rows: {length: rows.length, item: (i: number) => rows[i] ?? null}}];
    }

    return [{rows: {length: 0, item: () => null}}];
  }

  return {
    executeSql: jest.fn((sql: string, params: any[] = []) =>
      Promise.resolve(exec(sql, params)),
    ),
    transaction: jest.fn((fn: (tx: any) => void) => {
      const tx = {
        executeSql: jest.fn((sql: string, params: any[] = []) => {
          exec(sql, params);
        }),
      };
      fn(tx);
      return Promise.resolve();
    }),
    close: jest.fn(() => Promise.resolve()),
  };
}

// ─── Module export ────────────────────────────────────────────────────────────

const SQLiteMock = {
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve(createInMemoryDb())),
};

export default SQLiteMock;
