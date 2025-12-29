

/**
 * Formats a large number into a more readable string (e.g., 1.2M, 3.4K).
 * @param num The number to format (can be a string or number).
 * @returns A formatted string.
 */
export const formatNumber = (num: number | string): string => {
  const number = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(number)) return '0';

  if (number >= 1000000) {
    return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return number.toString();
};

/**
 * Formats an ISO 8601 date string into a relative time string (e.g., "2 days ago").
 * @param dateString The ISO date string.
 * @returns A formatted relative time string.
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
};

/**
 * Extracts a YouTube Channel ID from various URL formats.
 * @param input The URL or ID string.
 * @returns The extracted channel ID or null if not found.
 */
export const extractChannelId = (input: string): string | null => {
    if (!input) return null;
    const trimmedInput = input.trim();
  
    // Regex patterns for different YouTube channel URL formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, // /channel/UC... (relaxed length)
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)/,          // /c/custom_name 
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)/,      // /user/username 
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_.-]+)/,           // @handle 
      /^UC([a-zA-Z0-9_-]+)$/,                                                 // Direct UC ID (relaxed length)
      /^([a-zA-Z0-9_-]{24})$/,                                                // Strict 24-char fallback for non-UC IDs (rare)
      /^@([a-zA-Z0-9_.-]+)$/                                                  // Direct @handle
    ];
  
    for (const pattern of patterns) {
      const match = trimmedInput.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  
    // If no pattern matches, assume it might be a custom name or handle without the prefix
    if (!trimmedInput.includes('/') && !trimmedInput.startsWith('UC')) {
        return trimmedInput;
    }

    return null;
};


/**
 * Masks an API key for display, showing only the first and last few characters.
 * @param key The API key string.
 * @returns A masked string.
 */
export const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

/**
 * Gets today's date in YYYY-MM-DD format.
 * @returns A string representing today's date.
 */
export const getTodaysDateString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Converts an array of objects to a CSV string and triggers a download.
 * @param filename The desired filename for the downloaded file.
 * @param rows An array of objects to convert to CSV.
 */
export const exportToCsv = (filename: string, rows: object[]) => {
    if (!rows || !rows.length) {
        return;
    }
    const separator = ',';
    // Sanitize keys for CSV header
    const keys = Object.keys(rows[0]).map(key => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
    const csvContent =
        keys.join(separator) +
        '\n' +
        rows.map(row => {
            return Object.values(row).map(cellValue => {
                let cell = cellValue === null || cellValue === undefined ? '' : cellValue;
                cell = cell instanceof Date
                    ? cell.toLocaleString()
                    : cell.toString().replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
