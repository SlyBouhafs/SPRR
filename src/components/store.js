import { writable } from "svelte/store";

// Store for total comments in all PRs
export const totalCommentsCount = writable(0);

// Store for propagating URL changes between panels
export const urlPropagation = writable({
    url: "",
    sourceIndex: null,
    autoLoad: false,
});
