import { auth } from '../state/auth.svelte.js';

function parseURL(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    return match ? { owner: match[1], repo: match[2], number: match[3] } : null;
}

export async function fetchPR(url) {
    const parsed = parseURL(url);
    if (!parsed) throw new Error('Invalid GitHub PR URL');

    const response = await fetch(`/api/pr/${parsed.owner}/${parsed.repo}/${parsed.number}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.token })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }

    return response.json();
}

export async function updateComment(url, commentId, type, body) {
    const parsed = parseURL(url);
    if (!parsed) throw new Error('Invalid PR URL');

    const commentType = type === 'general' ? 'issue' : 'review';
    const response = await fetch(`/api/comment/${commentType}/${parsed.owner}/${parsed.repo}/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.token, body })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }

    return response.json();
}