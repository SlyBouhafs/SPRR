<script>
    import { fetchPR } from "../api/github.js";
    import PRInfo from "./PRInfo.svelte";
    import Comments from "./Comments.svelte";
    import { fade } from "svelte/transition";
    import { totalCount } from "./store";

    let { index, showToast, totalComments } = $props();

    let url = $state("");
    let data = $state(null);
    let loading = $state(false);
    let error = $state("");
    let refreshing = $state(false);
    let intervalId = null;

    async function load(silent = false) {
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

            $totalCount = totalComments.reduce((a, b) => a + b, 0);
            if (!silent) showToast("Comments Retrieved!", "info");

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

    function startRefresh() {
        if (intervalId) return;
        intervalId = setInterval(() => load(true), 60000);
    }

    function stopRefresh() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

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
