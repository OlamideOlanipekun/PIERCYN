/**
 * RFC 4180 compliant CSV Parser and Serializer with Formula Injection Protection.
 * Safe for UTF-8, commas, newlines, escaped quotes, and spreadsheet applications.
 */

/**
 * Escapes a single CSV value.
 * - Handles quotes, commas, newlines.
 * - Prevents CSV Formula Injection: values starting with '=', '+', '-', '@', '\t', '\r'
 *   are prefixed with a single quote (') unless they are safely purely numeric.
 */
export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  let str = String(val);

  // Formula injection prevention (CSV Injection / DDE)
  // If the cell starts with formula characters and is NOT a standard number (like -15 or +3)
  const isNumeric = /^-?\d+(\.\d+)?$/.test(str.trim());
  if (!isNumeric && /^[\s]*[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote if it contains comma, newline, carriage return, or double quote
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serializes a 2D array of values into an RFC 4180 CSV string with CRLF line endings.
 */
export function serializeCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
}

/**
 * Parses an RFC 4180 CSV string into a 2D array of string values.
 * Correctly handles multiline cells, escaped double quotes (""), and varied line breaks.
 */
export function parseCsv(csvText: string): string[][] {
  if (!csvText) return [];

  // Strip UTF-8 Byte Order Mark (BOM) if present
  let text = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \r in \r\n
        }
        currentRow.push(currentField);
        currentField = '';
        // Only push non-empty rows or rows with fields
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push remainder
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}
