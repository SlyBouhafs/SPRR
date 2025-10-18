<script>
    import {
        fetchPR,
        extractPRNumber,
        incrementPRNumber,
    } from "../api/github.js";
    import PRInfo from "./PRInfo.svelte";
    import Comments from "./Comments.svelte";
    import { fade } from "svelte/transition";
    import { totalCommentsCount, urlPropagation } from "./store";

    let { index, showToast, totalComments } = $props();

    let url = $state("");
    let data = $state(null);
    let loading = $state(false);
    let error = $state("");
    let refreshing = $state(false);
    let intervalId = null;

    /**
     * Loads PR data from the GitHub API
     * @param {boolean} silent - If true, performs a silent refresh without showing loading state or toast
     * @param {boolean} isAutoLoad - If true, indicates this load was triggered by another panel to prevent propagation loops
     * @returns {Promise<void>}
     */
    async function load(silent = false, isAutoLoad = false) {
        if (!url.trim()) return;

        error = "";

        if (silent) {
            refreshing = true;
        } else {
            loading = true;
        }

        try {
            data = await fetchPR(url);
            if (data)
                totalComments[index - 1] =
                    data.comments.length + data.reviewComments.length;
            $totalCommentsCount = totalComments.reduce((a, b) => a + b, 0);
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
            stopRefresh();
        } finally {
            loading = false;
            if (silent) setTimeout(() => (refreshing = false), 2500);
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
     * @param {ClipboardEvent} e - The paste event
     * @returns {void}
     */
    function handlePaste(e) {
        setTimeout(() => {
            const pastedUrl = url.trim();
            if (pastedUrl && extractPRNumber(pastedUrl)) {
                urlPropagation.set({
                    url: pastedUrl,
                    sourceIndex: index,
                    autoLoad: false,
                });
            }
        }, 200);
    }

    // Listen for URL propagation
    $effect(() => {
        const unsubscribe = urlPropagation.subscribe((data) => {
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

        return unsubscribe;
    });

    $effect(() => {
        return () => stopRefresh();
    });
</script>

<article class="pr-pane">
    <label for="Load" class="pr-pane-label">Pull Request #{index}</label>

    <div class="input-group">
        <input
            type="url"
            bind:value={url}
            onkeydown={(e) => e.key === "Enter" && load()}
            onpaste={handlePaste}
            placeholder="https://github.com/owner/repo/pull/123"
        />
        <button
            title="Load"
            class="load-btn"
            onclick={() => load()}
            disabled={loading || !url.trim()}
        >
            <i
                class={[
                    !loading && "bx bxs-arrow-big-down-line",
                    loading && "bx bxs-loader-dots bx-spin",
                ]}
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
        <PRInfo pr={data.pr} {refreshing} />

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
