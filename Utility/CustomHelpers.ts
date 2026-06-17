import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export type RowData = Record<string, string>;

export class CustomHelpers {
  /**
   * Reads an Excel file and returns cleaned rows.
   * @param fileName - file name relative to the test-data folder
   * @param headerRow - 0-indexed row number where headers live (default 4 = row 5)
   */
  readExcelData(fileName: string, headerRow: number = 4): RowData[] {
    const filePath = path.join(__dirname, '..', 'test-data', fileName);

    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const raw = XLSX.utils.sheet_to_json<RowData>(sheet, {
      range: headerRow,
      defval: '',
      raw: false,
    });

    return raw.map(row => {
      const clean: RowData = {};
      for (const k of Object.keys(row)) {
        if (k.startsWith('__EMPTY')) continue;
        clean[k.trim()] = String(row[k] ?? '');
      }
      return clean;
    });
  }

  /**
   * Filter rows by a column value — handy for picking test cases by Rule ID etc.
   */
  filterRows(rows: RowData[], column: string, value: string): RowData[] {
    return rows.filter(r => r[column] === value);
  }
}