/**
 * Utility functions for date and time handling in the Examination Portal
 */

/**
 * Parses a date and time string into a Date object
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM AM/PM format
 * @returns {Date}
 */
export const parseExamDateTime = (dateStr, timeStr) => {
    if (!dateStr) return new Date();

    // Support both plain dates (YYYY-MM-DD) and ISO strings (YYYY-MM-DDTHH:mm:ss.sssZ)
    // For ISO strings we intentionally ignore the time zone offset and only keep the
    // calendar date portion so that exams do not shift days across time zones.
    const base = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [yearRaw, monthRaw, dayRaw] = base.split('-').map(Number);
    const year = Number.isInteger(yearRaw) ? yearRaw : new Date().getFullYear();
    const month = Number.isInteger(monthRaw) ? monthRaw : 1;
    const day = Number.isInteger(dayRaw) ? dayRaw : 1;

    if (!timeStr || !timeStr.trim()) {
        return new Date(year, month - 1, day, 0, 0);
    }
    const parts = timeStr.trim().split(' ');
    const [time, period] = parts.length >= 2 ? [parts[0], parts[1]] : [parts[0], 'AM'];
    const [h, m] = time.split(':').map(Number);
    let hours = Number.isInteger(h) ? h : 0;
    const minutes = Number.isInteger(m) ? m : 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Formats a date string into components for display
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Object} { day, month, year }
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return { day: '--', month: '---', year: '----' };
    // Accept ISO strings by stripping time part if present
    const base = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = base.split('-');
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    return {
        day: day,
        month: months[parseInt(month) - 1] || '---',
        year: year,
    };
};
