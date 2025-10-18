import { writable, derived } from "svelte/store";

// Store for individual panel comment counts
const panelComments = writable({
    1: 0,
    2: 0,
    3: 0,
});

/**
 * Derived store that automatically calculates total comments across all panels
 */
export const totalCommentsCount = derived(panelComments, ($panelComments) => {
    return Object.values($panelComments).reduce((sum, count) => sum + count, 0);
});

/**
 * Updates the comment count for a specific panel
 * @param {number} panelIndex - Index of the panel (1, 2, or 3)
 * @param {number} count - Comment count for that panel
 * @returns {void}
 */
export function updatePanelComments(panelIndex, count) {
    panelComments.update((counts) => {
        counts[panelIndex] = count;
        return counts;
    });
}

/**
 * Resets comment count for a specific panel to zero
 * @param {number} panelIndex - Index of the panel (1, 2, or 3)
 * @returns {void}
 */
export function resetPanelComments(panelIndex) {
    updatePanelComments(panelIndex, 0);
}

// Store for propagating URL changes between panels
export const urlPropagation = writable({
    url: "",
    sourceIndex: null,
    autoLoad: false,
});
