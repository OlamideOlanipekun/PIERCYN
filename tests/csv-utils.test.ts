import { describe, expect, it } from 'vitest';
import { parseCsv, serializeCsv } from '../packages/utils/src/csv';

describe('catalogue CSV utilities', () => {
  it('round-trips quoted commas, quotes, and multiline values', () => {
    const rows = [
      ['name', 'description'],
      ['Essential Tee', 'Heavyweight cotton, "relaxed" fit\nMade in Lagos'],
    ];

    expect(parseCsv(serializeCsv(rows))).toEqual(rows);
  });

  it('neutralizes spreadsheet formulas while preserving numeric values', () => {
    const csv = serializeCsv([['name', 'value'], ['=HYPERLINK("bad")', -15]]);

    expect(csv).toContain(`'=HYPERLINK`);
    expect(csv).toContain(',-15');
  });
});
