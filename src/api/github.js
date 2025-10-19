import { auth } from "../state/state.svelte.js";
import { parseURL } from "../utils/helpers.js";

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
        // Handle authentication errors by clearing invalid token
        if (response.status === 401) {
            auth.clearInvalidToken();
            throw new Error("Authentication failed. Please login again.");
        }

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
        // Handle authentication errors by clearing invalid token
        if (response.status === 401) {
            auth.clearInvalidToken();
            throw new Error("Authentication failed. Please login again.");
        }

        const error = await response.json();
        throw new Error(error.error);
    }

    return response.json();
}
