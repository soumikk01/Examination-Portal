import pdf from 'pdf-parse';

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toIsoDate(dateRaw) {
  // Accept: dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy
  const m = String(dateRaw || '').trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const dd = String(m[1]).padStart(2, '0');
  const mm = String(m[2]).padStart(2, '0');
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function detectScheduleType(line) {
  const s = normalizeWhitespace(line).toUpperCase();
  // Check TEST-II first so "TEST - II" doesn't match the shorter "TEST - I" prefix.
  if (s.includes('TEST - II')) return 'TEST_II';
  if (s.includes('TEST - I')) return 'TEST_I';
  if (s.includes('SEMESTER END EXAMINATION') && s.includes('THEORY')) return 'END_SEM_THEORY';
  return null;
}

function detectScheduleTitle(line) {
  const s = normalizeWhitespace(line).toUpperCase();
  // Example: "TEST - II Schedule, EVEN Semester (AY 2024-25)"
  if (/(TEST\s*-\s*I|TEST\s*-\s*II|SEMESTER END EXAMINATION)/i.test(s) && /(ODD|EVEN)\s+SEMESTER/i.test(s)) {
    return normalizeWhitespace(line);
  }
  return null;
}

function parseSemesterHeader(line) {
  const cleaned = normalizeWhitespace(line);
  // Examples:
  // "UG - 2nd Semester (Batch 2024 - 2028)"
  // "PG - 2nd Semester (Batch 2024 - 2026)"
  // tolerate different dashes and spacing
  const m = cleaned.match(
    /\b(UG|PG)\b\s*[-–—]?\s*(\d{1,2})(?:st|nd|rd|th)?\s*Semester\b(?:\s*\(|\s+)?\s*Batch\s*(\d{4})\s*-\s*(\d{4})/i,
  );
  if (!m) return null;
  return {
    level: m[1].toUpperCase(),
    semester: String(Number(m[2])),
    batch: `${m[3]}-${m[4]}`,
    headerText: cleaned,
  };
}

function parseLevelSemesterOnly(line) {
  const cleaned = normalizeWhitespace(line);
  const m = cleaned.match(/\b(UG|PG)\b\s*[-–—]?\s*(\d{1,2})(?:st|nd|rd|th)?\s*Semester\b/i);
  if (!m) return null;
  return { level: m[1].toUpperCase(), semester: String(Number(m[2])) };
}

function parseBatchOnly(line) {
  const cleaned = normalizeWhitespace(line);
  const m = cleaned.match(/\bBatch\s*(\d{4})\s*-\s*(\d{4})\b/i);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

export async function parseExamSchedulePdf(buffer) {
  const data = await pdf(buffer);
  const text = normalizeWhitespace(data?.text || '');
  const lines = text.split('\n').map((l) => normalizeWhitespace(l)).filter(Boolean);

  const meta = {
    scheduleType: 'UNKNOWN',
    title: null, // e.g. "TEST - II Schedule, EVEN Semester (AY 2024-25)"
    academicYear: null,
    regulation: null,
    departments: [],
  };

  // Meta scan (whole document)
  for (const line of lines) {
    const t = detectScheduleType(line);
    if (t) meta.scheduleType = t;

    const title = detectScheduleTitle(line);
    if (title) meta.title = title;

    const ay = line.match(/\bAY\s+(\d{4}-\d{2})\b/i);
    if (ay) meta.academicYear = `AY ${ay[1]}`;

    const reg = line.match(/\b(R\d{2})\b/i);
    if (reg) meta.regulation = reg[1].toUpperCase();
  }

  // Department list scan: take all lines that look like program names.
  const dept = [];
  for (const line of lines) {
    if (/^(Bachelor|Master)\b/i.test(line) && line.length <= 120) {
      dept.push(line);
    }
  }
  meta.departments = [...new Set(dept)];

  const normalizeDeptCode = (codeRaw) => {
    const c = String(codeRaw || '').toUpperCase().trim();
    if (!c) return null;
    if (c === 'CS') return 'CSE';
    if (c === 'CT') return 'CST';
    if (c === 'EC') return 'ECE';
    return c;
  };

  const deptCodeByName = (name) => {
    const n = String(name || '').toUpperCase();
    // Prefer explicit code in parentheses, e.g. "M.Tech ... (EDPS)"
    const paren = n.match(/\(([A-Z0-9/-]{2,12})\)\s*$/);
    if (paren) return normalizeDeptCode(paren[1]);

    if (n.includes('COMPUTER SCIENCE') && n.includes('AI/ML')) return 'CSE-AIML';
    if (n.includes('AGRICULTURAL')) return 'AGE';
    if (n.includes('BIOMEDICAL')) return 'BME';
    if (n.includes('CIVIL')) return 'CE';
    if (n.includes('COMPUTER SCIENCE') && n.includes('TECHNOLOGY')) return 'CST';
    if (n.includes('COMPUTER SCIENCE') && n.includes('ENGINEERING')) return 'CSE';
    if (n.includes('ELECTRICAL')) return 'EE';
    if (n.includes('ELECTRONICS')) return 'ECE';
    if (n.includes('INFORMATION TECHNOLOGY')) return 'IT';
    if (n.includes('MECHANICAL')) return 'ME';
    if (n.includes('BACHELOR OF BUSINESS ADMINISTRATION') && n.includes('(DM)')) return 'BBA-DM';
    if (n.includes('BACHELOR OF BUSINESS ADMINISTRATION') && n.includes('(HM)')) return 'BBA-HM';
    if (n.includes('BACHELOR OF BUSINESS ADMINISTRATION')) return 'BBA';
    if (n.includes('BACHELOR OF COMPUTER') && n.includes('APPLICATION')) return 'BCA';
    if (n.includes('BUSINESS ADMINISTRATION')) return 'MBA';
    if (n.includes('COMPUTER APPLICATION')) return 'MCA';
    return null;
  };

  const deptNameByCode = new Map();
  for (const name of meta.departments) {
    const code = normalizeDeptCode(deptCodeByName(name));
    if (code && !deptNameByCode.has(code)) deptNameByCode.set(code, name);
  }

  const deptCodeByExactName = new Map();
  for (const name of meta.departments) {
    const code = normalizeDeptCode(deptCodeByName(name));
    if (!code) continue;
    deptCodeByExactName.set(normalizeWhitespace(name).toUpperCase(), code);
  }

  const extractDepartmentCode = (paperCode, subject) => {
    const s = `${paperCode || ''} ${subject || ''}`.toUpperCase();
    const paren = s.match(/\(([A-Z]{2,5})\)/);
    if (paren) return normalizeDeptCode(paren[1]);
    const prefix = s.match(/^([A-Z]{2,5})[-]?\d/);
    if (prefix) return normalizeDeptCode(prefix[1]);
    return null;
  };

  const parseTime = (str) => {
    const m = String(str || '').match(
      /(\d{1,2}:\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i,
    );
    if (!m) return null;
    const from = `${m[1]}${m[2] ? ` ${m[2].toUpperCase()}` : ''}`.trim();
    const to = `${m[3]}${m[4] ? ` ${m[4].toUpperCase()}` : ''}`.trim();
    return `${from} - ${to}`;
  };

  const parseLineToRow = (line, carry, ctx) => {
    const cleaned = normalizeWhitespace(line);
    if (!cleaned) return null;

    // PDFs frequently produce "10-03-2025MONDAY" (no spaces) so avoid word-boundaries.
    const dateMatch = cleaned.match(/(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/);
    const dayMatch = cleaned.match(/(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/i);
    const time = parseTime(cleaned);

    const hasDate = !!dateMatch;
    const examDateIso = hasDate ? toIsoDate(dateMatch[1]) : carry?.examDateIso || null;
    const examDay = dayMatch ? dayMatch[1].toUpperCase() : carry?.examDay || null;
    const examTime = time || (cleaned.match(/\b\d{1,2}:\d{2}\b/) ? null : carry?.examTime || null);

    // Remove date/day/time tokens to isolate paper code + paper name.
    let left = cleaned;
    if (dateMatch) left = left.replace(dateMatch[1], ' ');
    if (dayMatch) left = left.replace(dayMatch[1], ' ');
    if (time) left = left.replace(time.replace(/\s+/g, ''), ' '); // sometimes no spaces in source
    left = left.replace(
      /(\d{1,2}:\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i,
      ' ',
    );
    left = normalizeWhitespace(left);

    // If it looks like a header/footer, skip
    if (/^(JIS COLLEGE OF ENGINEERING|BLOCK\s+-|DATE\s+DAY\s+TIME|SD\/-|CONTROLLER|ASSISTANT CONTROLLER|PUBLISHED ON:|REVISED ON:|REF NO:|PAGE\s+\d+)/i.test(left)) {
      return null;
    }
    // Skip semester header lines (we parse them separately)
    if (parseSemesterHeader(cleaned)) return null;
    // Skip explicit department heading lines (handled separately)
    if (deptCodeByExactName.has(cleaned.toUpperCase())) return null;

    // Need at least date+time context and some paper info
    if (!examDateIso || !examTime) return null;

    // Extract paperCode + subject
    const tokens = left.split(' ');
    let paperCode = null;
    let subject = left;
    if (tokens[0] && /^[A-Z0-9()/-]{2,}$/i.test(tokens[0]) && tokens.length >= 2) {
      const firstRaw = tokens[0].toUpperCase();
      subject = normalizeWhitespace(tokens.slice(1).join(' '));

      // pdf-parse often produces glued tokens like "HU201PROFESSIONAL" or "M(AGE)201ENGINEERING"
      // Try to split "CODE + SUBJECT_PREFIX" when there is no space.
      const digitsThenWord = firstRaw.match(/^[A-Z()/-]*\d{2,4}[A-Z]{3,}/);
      if (digitsThenWord) {
        const lastDigitIdx = firstRaw.search(/\d(?!.*\d)/); // last digit position
        if (lastDigitIdx >= 0 && lastDigitIdx < firstRaw.length - 1) {
          paperCode = firstRaw.slice(0, lastDigitIdx + 1);
          const subjectPrefix = firstRaw.slice(lastDigitIdx + 1);
          subject = normalizeWhitespace(`${subjectPrefix} ${subject}`);
        } else {
          paperCode = firstRaw;
        }
      } else {
        paperCode = firstRaw;
      }
    }
    if (!subject || subject.length < 2) return null;

    // Skip rows where code/name are clearly missing (many PDFs have empty code/name columns)
    if (!paperCode && /^[0-9:-\s]+$/.test(subject)) return null;

    const departmentCode = extractDepartmentCode(paperCode, subject);
    const department = departmentCode ? deptNameByCode.get(departmentCode) || null : null;

    return {
      examDateIso,
      examDay,
      examTime,
      paperCode,
      subject,
      departmentCode,
      department,
      // semester context (multi-semester PDFs)
      level: ctx?.level || null,
      semester: ctx?.semester || null,
      batch: ctx?.batch || null,
      academicYear: meta.academicYear || null,
      regulation: meta.regulation || null,
    };
  };

  const rows = [];
  const MAJOR_DEPT_CODES = new Set([
    'AGE',
    'BME',
    'CE',
    'CSE',
    'CSE-AIML',
    'CST',
    'EE',
    'ECE',
    'IT',
    'ME',
    'BBA',
    'BBA-DM',
    'BBA-HM',
    'BCA',
    'MBA',
    'MCA',
    'MCSE',
    'EDPS',
    'MME',
    'MCNT',
  ]);
  const COMMON_SUBJECT_CODES = new Set(['HU', 'M', 'PH', 'CH', 'AEC', 'GE', 'ESC', 'HSMC']);

  let carry = { examDateIso: null, examDay: null, examTime: null, currentDeptCode: null };
  let ctx = { level: null, semester: null, batch: null };
  let pending = { level: null, semester: null };
  let bufferedRows = []; // rows parsed before we detect the semester header in text order
  for (const line of lines) {
    // Detect new semester block
    const sem = parseSemesterHeader(line);
    if (sem) {
      ctx = { level: sem.level, semester: sem.semester, batch: sem.batch };
      // Reset date/time carry for the new block (PDFs usually start fresh tables per semester)
      carry.examDateIso = null;
      carry.examDay = null;
      carry.examTime = null;
      carry.currentDeptCode = null;
      pending = { level: null, semester: null };
      if (bufferedRows.length) {
        for (const r of bufferedRows) {
          r.level = ctx.level;
          r.semester = ctx.semester;
          r.batch = ctx.batch;
          if (!r.academicYear) r.academicYear = meta.academicYear || null;
          if (!r.regulation) r.regulation = meta.regulation || null;
          rows.push(r);
        }
        bufferedRows = [];
      }
      continue;
    }

    // Some PDFs split the semester header across lines:
    // "UG - 2nd Semester" then later "(Batch 2024 - 2028)"
    const ls = parseLevelSemesterOnly(line);
    if (ls) {
      pending = { level: ls.level, semester: ls.semester };
      continue;
    }
    const batchOnly = parseBatchOnly(line);
    if (batchOnly && pending.level && pending.semester) {
      ctx = { level: pending.level, semester: pending.semester, batch: batchOnly };
      carry.examDateIso = null;
      carry.examDay = null;
      carry.examTime = null;
      carry.currentDeptCode = null;
      pending = { level: null, semester: null };
      if (bufferedRows.length) {
        for (const r of bufferedRows) {
          r.level = ctx.level;
          r.semester = ctx.semester;
          r.batch = ctx.batch;
          if (!r.academicYear) r.academicYear = meta.academicYear || null;
          if (!r.regulation) r.regulation = meta.regulation || null;
          rows.push(r);
        }
        bufferedRows = [];
      }
      continue;
    }

    // Detect department headings inside the current semester block
    const deptKey = normalizeWhitespace(line).toUpperCase();
    const deptFromHeading = deptCodeByExactName.get(deptKey) || null;
    if (deptFromHeading) {
      carry.currentDeptCode = deptFromHeading;
      continue;
    }

    const r0 = parseLineToRow(line, carry, ctx);

    let r = r0;
    if (r) {
      const code = r.departmentCode || null;

      if (code && MAJOR_DEPT_CODES.has(code)) {
        carry.currentDeptCode = code;
      } else if ((!code || COMMON_SUBJECT_CODES.has(code)) && carry.currentDeptCode) {
        r = {
          ...r,
          departmentCode: carry.currentDeptCode,
          department: deptNameByCode.get(carry.currentDeptCode) || r.department || null,
        };
      }
    }
    // Update carry on any line that sets date/day/time even if no row
    const dateMatch = line.match(/(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/);
    if (dateMatch) carry.examDateIso = toIsoDate(dateMatch[1]) || carry.examDateIso;
    const dayMatch = line.match(/(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/i);
    if (dayMatch) carry.examDay = dayMatch[1].toUpperCase();
    const time = parseTime(line);
    if (time) carry.examTime = time;

    if (r) {
      const hasCtx = !!(ctx.level && ctx.semester && ctx.batch);
      if (hasCtx) rows.push(r);
      else bufferedRows.push(r);
    }
  }

  // Filter out rows without paper info (some PDFs have empty code/name columns)
  const cleanedRows = rows.filter((r) => (r.paperCode && r.subject) || (r.subject && /[A-Z]/i.test(r.subject)));

  return {
    rawText: text,
    meta,
    rows: cleanedRows,
  };
}
