const test = require('node:test');
const assert = require('node:assert');
const { buildReportQuery } = require('../lib/reportQueryBuilder');

test('builds query with no filters', () => {
  const { sql, params } = buildReportQuery({});
  assert.strictEqual(
    sql,
    'SELECT entry_id, entry_date, entry_category, file_number, subject, officer_assigned, status FROM entries_tbl ORDER BY entry_date DESC'
  );
  assert.deepStrictEqual(params, []);
});

test('builds query with date range', () => {
  const { sql, params } = buildReportQuery({ start_date: '2024-01-01', end_date: '2024-01-31' });
  assert.strictEqual(
    sql,
    'SELECT entry_id, entry_date, entry_category, file_number, subject, officer_assigned, status FROM entries_tbl WHERE entry_date >= ? AND entry_date <= ? ORDER BY entry_date DESC'
  );
  assert.deepStrictEqual(params, ['2024-01-01', '2024-01-31']);
});

test('builds query with multiple filters', () => {
  const filters = {
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    officer_assigned: 'John',
    status: 'Open',
    file_number: 'FN123',
    category: 'File'
  };
  const { sql, params } = buildReportQuery(filters);
  assert.strictEqual(
    sql,
    'SELECT entry_id, entry_date, entry_category, file_number, subject, officer_assigned, status FROM entries_tbl WHERE entry_date >= ? AND entry_date <= ? AND officer_assigned LIKE ? AND status = ? AND file_number = ? AND entry_category = ? ORDER BY entry_date DESC'
  );
  assert.deepStrictEqual(
    params,
    ['2024-01-01', '2024-01-31', '%John%', 'Open', 'FN123', 'File']
  );
});
