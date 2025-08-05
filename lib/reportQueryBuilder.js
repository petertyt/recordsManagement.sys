const sql = require('sql-bricks');

function buildReportQuery(filters = {}) {
  let query = sql
    .select(
      'entry_id',
      'entry_date',
      'entry_category',
      'file_number',
      'subject',
      'officer_assigned',
      'status'
    )
    .from('entries_tbl');

  if (filters.start_date) {
    query = query.where(sql.gte('entry_date', filters.start_date));
  }
  if (filters.end_date) {
    query = query.where(sql.lte('entry_date', filters.end_date));
  }
  if (filters.officer_assigned) {
    query = query.where(sql.like('officer_assigned', `%${filters.officer_assigned}%`));
  }
  if (filters.status) {
    query = query.where(sql.eq('status', filters.status));
  }
  if (filters.file_number) {
    query = query.where(sql.eq('file_number', filters.file_number));
  }
  if (filters.category) {
    query = query.where(sql.eq('entry_category', filters.category));
  }

  query = query.orderBy('entry_date DESC');

  const { text, values } = query.toParams({ placeholder: '?' });
  return { sql: text, params: values };
}

module.exports = { buildReportQuery };
