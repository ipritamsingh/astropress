/**
 * Table Parser Utility for Gutenberg Table Block
 * Supports parsing Markdown tables and HTML tables safely into structured TableBlockData
 */

export interface TableBlockData {
  headers: string[];
  rows: string[][];
  caption?: string;
  alignments?: ('left' | 'center' | 'right')[];
  hasHeader?: boolean;
}

/**
 * Parses markdown table alignment separator
 */
function parseAlignment(cell: string): 'left' | 'center' | 'right' {
  const trimmed = cell.trim();
  const startsWithColon = trimmed.startsWith(':');
  const endsWithColon = trimmed.endsWith(':');

  if (startsWithColon && endsWithColon) return 'center';
  if (endsWithColon) return 'right';
  return 'left';
}

/**
 * Splits a markdown table row by pipes while ignoring escaped pipes
 */
function splitMarkdownRow(row: string): string[] {
  let cleaned = row.trim();
  if (cleaned.startsWith('|')) cleaned = cleaned.substring(1);
  if (cleaned.endsWith('|')) cleaned = cleaned.substring(0, cleaned.length - 1);

  // Split by pipe
  const cells = cleaned.split('|').map((c) => c.trim().replace(/\\\|/g, '|'));
  return cells;
}

/**
 * Parses a Markdown table string
 */
export function parseMarkdownTable(text: string): TableBlockData | null {
  if (!text || typeof text !== 'string') return null;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return null;

  // Find the separator row (e.g., |---|---| or |:---|:---:|---:|)
  let sepIdx = -1;
  const sepRegex = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/;

  for (let i = 0; i < lines.length; i++) {
    if (sepRegex.test(lines[i])) {
      sepIdx = i;
      break;
    }
  }

  // Must have at least one header row above separator
  if (sepIdx < 1) return null;

  const headerLine = lines[sepIdx - 1];
  const sepLine = lines[sepIdx];
  const bodyLines = lines.slice(sepIdx + 1);

  const headers = splitMarkdownRow(headerLine);
  const sepCells = splitMarkdownRow(sepLine);
  const colCount = Math.max(headers.length, sepCells.length);

  const alignments: ('left' | 'center' | 'right')[] = [];
  for (let c = 0; c < colCount; c++) {
    alignments.push(parseAlignment(sepCells[c] || '---'));
  }

  // Normalize header count
  while (headers.length < colCount) {
    headers.push(`Column ${headers.length + 1}`);
  }

  const rows: string[][] = [];
  let caption = '';

  for (const line of bodyLines) {
    // Check if line is a caption like *Caption text* or _Caption text_
    if (line.startsWith('*') && line.endsWith('*') && !line.includes('|')) {
      caption = line.slice(1, -1).trim();
      continue;
    }
    if (line.startsWith('_') && line.endsWith('_') && !line.includes('|')) {
      caption = line.slice(1, -1).trim();
      continue;
    }

    if (!line.includes('|')) continue;

    const rowCells = splitMarkdownRow(line);
    // Pad or truncate to match colCount
    const normalizedRow: string[] = [];
    for (let c = 0; c < colCount; c++) {
      normalizedRow.push(rowCells[c] || '');
    }
    rows.push(normalizedRow);
  }

  return {
    headers,
    rows: rows.length > 0 ? rows : [['', '']],
    alignments,
    caption: caption || undefined,
    hasHeader: true,
  };
}

/**
 * Parses an HTML table string safely
 */
export function parseHtmlTable(html: string): TableBlockData | null {
  if (!html || typeof html !== 'string' || !/<table[\s>]/i.test(html)) {
    return null;
  }

  if (typeof DOMParser === 'undefined') {
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return null;

    // Optional caption
    const captionEl = table.querySelector('caption');
    const caption = captionEl ? captionEl.textContent?.trim() : undefined;

    // Extract headers
    let headers: string[] = [];
    const alignments: ('left' | 'center' | 'right')[] = [];
    const theadThs = table.querySelectorAll('thead tr th, thead tr td');

    if (theadThs.length > 0) {
      theadThs.forEach((th) => {
        headers.push(th.textContent?.trim() || '');
        const alignAttr = th.getAttribute('align')?.toLowerCase();
        const style = th.getAttribute('style')?.toLowerCase() || '';
        if (alignAttr === 'center' || style.includes('text-align: center') || style.includes('text-align:center')) {
          alignments.push('center');
        } else if (alignAttr === 'right' || style.includes('text-align: right') || style.includes('text-align:right')) {
          alignments.push('right');
        } else {
          alignments.push('left');
        }
      });
    }

    // Extract rows
    const rows: string[][] = [];
    const allTrs = Array.from(table.querySelectorAll('tr'));

    // If no thead, check if first row contains th
    let startIndex = 0;
    if (headers.length === 0 && allTrs.length > 0) {
      const firstRowThs = allTrs[0].querySelectorAll('th');
      if (firstRowThs.length > 0) {
        firstRowThs.forEach((th) => {
          headers.push(th.textContent?.trim() || '');
          alignments.push('left');
        });
        startIndex = 1;
      }
    }

    for (let r = startIndex; r < allTrs.length; r++) {
      const tr = allTrs[r];
      // Skip if this tr is inside thead and we already processed thead
      if (tr.parentElement?.tagName.toLowerCase() === 'thead' && theadThs.length > 0) {
        continue;
      }

      const cells = Array.from(tr.querySelectorAll('td, th'));
      if (cells.length === 0) continue;

      // If headers was still empty, use first row as headers
      if (headers.length === 0) {
        cells.forEach((c) => {
          headers.push(c.textContent?.trim() || '');
          alignments.push('left');
        });
        continue;
      }

      const rowData = cells.map((c) => c.textContent?.trim() || '');
      rows.push(rowData);
    }

    // Determine max column count
    const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 1);
    while (headers.length < colCount) {
      headers.push(`Column ${headers.length + 1}`);
      alignments.push('left');
    }

    // Normalize row lengths
    const normalizedRows = rows.map((r) => {
      const row = [...r];
      while (row.length < colCount) row.push('');
      return row.slice(0, colCount);
    });

    return {
      headers: headers.slice(0, colCount),
      rows: normalizedRows.length > 0 ? normalizedRows : [new Array(colCount).fill('')],
      alignments: alignments.slice(0, colCount),
      caption,
      hasHeader: headers.length > 0,
    };
  } catch (err) {
    console.error('Failed to parse HTML table:', err);
    return null;
  }
}

/**
 * Detects whether the input string is an HTML or Markdown table and parses it.
 */
export function detectAndParseTable(input: string): TableBlockData | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Try HTML table first if <table> tag is detected
  if (/<table[\s>]/i.test(trimmed)) {
    const htmlResult = parseHtmlTable(trimmed);
    if (htmlResult && htmlResult.headers.length > 0) {
      return htmlResult;
    }
  }

  // Try Markdown table
  if (trimmed.includes('|') && trimmed.includes('-')) {
    const mdResult = parseMarkdownTable(trimmed);
    if (mdResult && mdResult.headers.length > 0) {
      return mdResult;
    }
  }

  return null;
}

/**
 * Converts TableBlockData into standard Markdown table syntax
 */
export function tableDataToMarkdown(data: TableBlockData): string {
  if (!data) return '';

  const headers = data.headers && data.headers.length > 0 ? data.headers : ['Col 1', 'Col 2'];
  const alignments = data.alignments || [];
  const rows = data.rows || [];

  const sepRow = headers.map((_, i) => {
    const align = alignments[i] || 'left';
    if (align === 'center') return ':---:';
    if (align === 'right') return '---:';
    return ':---';
  });

  const lines: string[] = [];

  if (data.hasHeader !== false) {
    lines.push(`| ${headers.map((h) => h.replace(/\|/g, '\\|')).join(' | ')} |`);
    lines.push(`| ${sepRow.join(' | ')} |`);
  } else {
    // Markdown requires a header row for standard tables, output dummy or separator
    lines.push(`| ${headers.map((_, i) => `Col ${i + 1}`).join(' | ')} |`);
    lines.push(`| ${sepRow.join(' | ')} |`);
  }

  for (const row of rows) {
    const paddedRow = headers.map((_, i) => (row[i] || '').replace(/\|/g, '\\|'));
    lines.push(`| ${paddedRow.join(' | ')} |`);
  }

  if (data.caption) {
    lines.push(`\n*${data.caption}*`);
  }

  return lines.join('\n');
}
