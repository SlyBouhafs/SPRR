<script>
    import { fetchPR } from "../api/github.js";
    import PRInfo from "./PRInfo.svelte";
    import Comments from "./Comments.svelte";
    import { fade } from "svelte/transition";
    import { urlPropagation } from "../state/state.svelte.js";
    import {
        extractPRNumber,
        incrementPRNumber,
        updatePanelComments,
        resetPanelComments,
        isValidGitHubPRUrl,
        debounce,
        throttle,
    } from "../utils/helpers.js";

    let { index, showToast } = $props();

    let url = $state("");
    let data = $state(null);
    let loading = $state(false);
    let error = $state("");
    let refreshing = $state(false);
    let intervalId = null;
    let urlValidationMessage = $state("");
    let isUrlValid = $state(true);

    /**
     * Loads PR data from the GitHub API
     * @param {boolean} silent - If true, performs a silent refresh without showing loading state or toast
     * @param {boolean} isAutoLoad - If true, indicates this load was triggered by another panel to prevent propagation loops
     * @returns {Promise<void>}
     */
    async function load(silent = false, isAutoLoad = false) {
        if (!url.trim()) return;

        // Validate GitHub PR URL before attempting to load
        if (!isValidGitHubPRUrl(url)) {
            error = "Invalid GitHub PR URL";
            showToast("Please enter a valid GitHub PR URL", "error");
            return;
        }

        error = "";

        if (silent) {
            refreshing = true;
        } else {
            loading = true;
        }

        try {
            data = await fetchPR(url);
            if (data) {
                // Update this panel's comment count in the store
                const commentCount =
                    data.comments.length + data.reviewComments.length;
                updatePanelComments(index, commentCount);
            }
            if (!silent) {
                showToast("Comments Retrieved!", "info");
                // Only propagate if this is a user-initiated load, not an auto-load
                if (!isAutoLoad) {
                    urlPropagation.set({
                        url,
                        sourceIndex: index,
                        autoLoad: true,
                    });
                }
            }
            startRefresh();
        } catch (err) {
            error = err.message;
            if (!silent) showToast(error, "error");
            // Reset comment count for this panel when error occurs
            resetPanelComments(index);
            stopRefresh();
        } finally {
            loading = false;
            if (silent) setTimeout(() => (refreshing = false), 2000);
        }
    }

    /**
     * Starts an automatic refresh interval that silently reloads PR data every 60 seconds
     * @returns {void}
     */
    function startRefresh() {
        if (intervalId) return;
        intervalId = setInterval(() => load(true), 60000);
    }

    /**
     * Stops the automatic refresh interval
     * @returns {void}
     */
    function stopRefresh() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    /**
     * Handles paste events in the URL input field
     * Propagates the pasted URL to other panels with incremented PR numbers
     * Debounced to prevent rapid-fire paste events
     * @param {ClipboardEvent} e - The paste event
     * @returns {void}
     */
    const handlePaste = debounce(() => {
        const pastedUrl = url.trim();
        if (pastedUrl && extractPRNumber(pastedUrl)) {
            urlPropagation.set({
                url: pastedUrl,
                sourceIndex: index,
                autoLoad: false,
            });
        }
    }, 150);

    /**
     * Validates URL input in real-time with debouncing
     * Provides user feedback on URL validity as they type
     */
    const validateUrlInput = debounce(() => {
        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            isUrlValid = true;
            return;
        }

        isUrlValid = isValidGitHubPRUrl(trimmedUrl);
    }, 300);

    /**
     * Listen for URL propagation from other panels
     * Uses $effect.pre to ensure state updates happen before DOM updates
     * This prevents potential race conditions when multiple panels update simultaneously
     */
    $effect.pre(() => {
        const data = urlPropagation.value;

        // Only process if the propagation is from a different panel
        if (
            data.url &&
            data.sourceIndex !== null &&
            data.sourceIndex !== index
        ) {
            const increment = index - data.sourceIndex;
            url = incrementPRNumber(data.url, increment);

            // Auto-fetch if autoLoad flag is set
            if (data.autoLoad) {
                load(false, true);
            }
        }
    });

    /**
     * Cleanup effect to stop auto-refresh when component is destroyed
     * This prevents memory leaks from dangling intervals
     */
    $effect(() => {
        return () => {
            stopRefresh();
        };
    });
</script>

<article class="pr-pane">
    <label for="Load" class="pr-pane-label">Pull Request #{index}</label>

    <div class="input-group">
        {#if url.trim() && !refreshing}
            <i
                class="validation-icon bx {isUrlValid
                    ? 'bx-check valid'
                    : 'bx-x invalid'}"
            ></i>
        {:else if url.trim()}
            <i class="validation-icon bx bx-loader-dots bx-spin active"></i>
        {/if}
        <input
            type="url"
            bind:value={url}
            oninput={validateUrlInput}
            onkeydown={(e) => e.key === "Enter" && load()}
            onpaste={handlePaste}
            placeholder="https://github.com/owner/repo/pull/123"
            aria-label="GitHub Pull Request URL for panel {index}"
            class:has-icon={url.trim()}
        />
        <button
            title="Load"
            class="load-btn"
            onclick={throttle(() => load(), 1000)}
            disabled={loading || !url.trim()}
            aria-label="Load pull request {index}"
        >
            <i
                class="bx {loading
                    ? 'bxs-loader-dots bx-spin'
                    : 'bxs-arrow-big-down-line'}"
            ></i>
        </button>
    </div>

    {#if error}
        <div class="error">
            <span><i class="bx bxs-x-circle"></i> </span>
            <span>{error}</span>
        </div>
    {/if}

    {#if loading}
        <div class="loading">
            <i class="bx bx-loader-dots bx-spin loading-icon"></i>
        </div>
    {:else if data}
        <PRInfo pr={data.pr} />

        <div transition:fade class="pr-content">
            <Comments
                title="General Comments"
                comments={data.comments.filter((c) => c.body)}
                type="general"
                {url}
                files={data.files}
                {showToast}
            />

            <Comments
                title="Review Comments"
                comments={data.reviewComments.filter((c) => c.body)}
                type="review"
                {url}
                files={data.files}
                {showToast}
                groupByFile
            />

            <Comments
                title="Reviews"
                comments={data.reviews.filter((r) => r.body)}
                type="summary"
                {url}
                files={data.files}
                {showToast}
            />
        </div>
    {:else}
        <div class="pr-content">
            <div class="placeholder">
                Enter the PR URL in the field above and click
                <i class="bx bxs-arrow-big-down-line bx-xs"></i>
                to retrieve the comments.
            </div>
        </div>
    {/if}
</article>
