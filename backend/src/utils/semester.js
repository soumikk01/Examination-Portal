export function computeCurrentSemester({ admissionYear, now = new Date(), maxSemester = 8 } = {}) {
  const year = Number(admissionYear);
  if (!Number.isFinite(year) || year < 1900 || year > 3000) return null;

  const currentYear = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const isJanToJun = month <= 5;

  const yearsElapsed = Math.max(0, currentYear - year);
  const semesterNumber = yearsElapsed * 2 + (isJanToJun ? 1 : 2);

  if (!Number.isFinite(semesterNumber) || semesterNumber <= 0) return null;
  return String(Math.min(maxSemester, semesterNumber));
}

