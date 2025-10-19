import { panelComments } from "../state/state.svelte.js";

/**
 * Updates the comment count for a specific panel
 * @param {number} panelIndex - Index of the panel (1, 2, or 3)
 * @param {number} count - Comment count for that panel
 * @returns {void}
 */
export function updatePanelComments(panelIndex, count) {
    panelComments.updatePanel(panelIndex, count);
}

/**
 * Resets comment count for a specific panel to zero
 * @param {number} panelIndex - Index of the panel (1, 2, or 3)
 * @returns {void}
 */
export function resetPanelComments(panelIndex) {
    panelComments.resetPanel(panelIndex);
}

/**
 * Parses a GitHub PR URL to extract owner, repo, and PR number
 * @param {string} url - Full GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)
 * @returns {Object|null} - Object with owner, repo, and number properties, or null if invalid
 */
export function parseURL(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    return match ? { owner: match[1], repo: match[2], number: match[3] } : null;
}

/**
 * Extracts PR number from GitHub PR URL
 * @param {string} url - GitHub PR URL
 * @returns {number|null} - PR number or null if not found
 */
export function extractPRNumber(url) {
    const parsed = parseURL(url);
    return parsed ? parseInt(parsed.number, 10) : null;
}

/**
 * Increments PR number in a GitHub PR URL
 * @param {string} url - GitHub PR URL
 * @param {number} increment - Amount to increment (can be negative)
 * @returns {string} - URL with incremented PR number
 */
export function incrementPRNumber(url, increment) {
    const parsed = parseURL(url);
    if (!parsed) return url;

    const newPRNumber = parseInt(parsed.number, 10) + increment;
    return url.replace(/\/pull\/\d+/, `/pull/${newPRNumber}`);
}

/**
 * Validates if a URL is a valid GitHub PR URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid GitHub PR URL, false otherwise
 */
export function isValidGitHubPRUrl(url) {
    if (!url || typeof url !== "string") {
        return false;
    }

    const parsed = parseURL(url);
    return parsed !== null;
}

// ============================================================================
// Clipboard Utilities
// ============================================================================

/**
 * Copies text to clipboard using the Clipboard API
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function copyToClipboard(text) {
    if (!text || typeof text !== "string") {
        console.error("copyToClipboard expects a non-empty string");
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        return false;
    }
}

// ============================================================================
// UI Icon Utilities
// ============================================================================

/**
 * Gets the appropriate icon class for a toast notification type
 * @param {"success" | "error" | "info" | "warning"} type - Toast notification type
 * @returns {string} - Icon class name
 */
export function getToastIconClass(type) {
    switch (type) {
        case "success":
            return "bx bxs-check-square";
        case "error":
            return "bx bxs-x-square";
        case "info":
            return "bx bxs-info-square";
        case "warning":
            return "bx bxs-alert-square";
        default:
            return "bx bxs-sparkle-square";
    }
}

// ============================================================================
// Text Formatting Utilities
// ============================================================================

/**
 * Pluralizes a word based on count
 * @param {number} count - The count to check
 * @param {string} singular - Singular form of the word
 * @param {string} plural - Plural form of the word (optional, defaults to singular + 's')
 * @returns {string} - Formatted string with count and pluralized word
 */
export function pluralize(count, singular, plural = null) {
    if (typeof count !== "number") {
        console.warn("pluralize expects a number as first argument");
        return `${count} ${singular}`;
    }

    const pluralForm = plural || `${singular}s`;
    return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm}`;
}

// ============================================================================
// Timing Utilities
// ============================================================================

/**
 * Creates a debounced version of a function that delays execution until after
 * a specified wait time has elapsed since the last invocation
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait = 300) {
    if (typeof func !== "function") {
        throw new Error("debounce expects a function as first argument");
    }

    let timeoutId = null;

    return function debounced(...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func.apply(this, args);
            timeoutId = null;
        }, wait);
    };
}

/**
 * Creates a throttled version of a function that only executes at most once
 * per specified time period
 * @param {Function} func - The function to throttle
 * @param {number} limit - The minimum time between executions in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit = 300) {
    if (typeof func !== "function") {
        throw new Error("throttle expects a function as first argument");
    }

    let inThrottle = false;

    return function throttled(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
