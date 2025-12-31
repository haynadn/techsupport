/**
 * Date and Time Formatting Utilities
 * Standard formats: dd-mm-yyyy for dates, HH:mm for 24-hour time
 */

/**
 * Format date for display: dd-mm-yyyy
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

/**
 * Format datetime for display: dd-mm-yyyy HH:mm
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted datetime string
 */
export const formatDateTimeDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Format date for HTML input (type="date"): yyyy-mm-dd
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted date string for input
 */
export const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Format datetime for HTML input (type="datetime-local"): yyyy-mm-ddTHH:mm
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted datetime string for input
 */
export const formatDateTimeForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parse dd-mm-yyyy format to ISO date string
 * @param {string} ddmmyyyy - Date in dd-mm-yyyy format
 * @returns {string} ISO date string (yyyy-mm-dd)
 */
export const parseDateInput = (ddmmyyyy) => {
    if (!ddmmyyyy) return '';
    const parts = ddmmyyyy.split('-');
    if (parts.length !== 3) return '';

    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
};
