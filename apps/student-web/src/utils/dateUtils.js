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
    if (!dateStr || !timeStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
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
    const [year, month, day] = dateStr.split('-');
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
