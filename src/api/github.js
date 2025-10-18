import { auth } from "../state/auth.svelte.js";

/**
 * Parses a GitHub PR URL to extract owner, repo, and PR number
 * @param {string} url - Full GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)
 * @returns {Object|null} - Object with owner, repo, and number properties, or null if invalid
 */
function parseURL(url) {
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
 * Fetches pull request data from GitHub including comments, review comments, reviews, and files
 * @param {string} url - GitHub PR URL to fetch data from
 * @returns {Promise<Object>} - PR data object containing pr, comments, reviewComments, reviews, and files
 * @throws {Error} - If URL is invalid or API request fails
 */
export async function fetchPR(url) {
    const parsed = parseURL(url);
    if (!parsed) throw new Error("Invalid GitHub PR URL");

    const response = await fetch(
        `/api/pr/${parsed.owner}/${parsed.repo}/${parsed.number}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: auth.token }),
        },
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }

    return response.json();
}

/**
 * Updates a comment on a GitHub pull request
 * @param {string} url - GitHub PR URL where the comment exists
 * @param {number|string} commentId - ID of the comment to update
 * @param {string} type - Comment type: "general" for issue comments or "review" for review comments
 * @param {string} body - New content for the comment
 * @returns {Promise<Object>} - Updated comment data from GitHub API
 * @throws {Error} - If URL is invalid or API request fails
 */
export async function updateComment(url, commentId, type, body) {
    const parsed = parseURL(url);
    if (!parsed) throw new Error("Invalid PR URL");

    const commentType = type === "general" ? "issue" : "review";
    const response = await fetch(
        `/api/comment/${commentType}/${parsed.owner}/${parsed.repo}/${commentId}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: auth.token, body }),
        },
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }

    return response.json();
}
