<script>
    import { auth, totalCommentsCount } from "../state/state.svelte.js";
</script>

<header class="header">
    <div class="header-content">
        <i class="bx bxs-git-compare header-icon"></i>
        <h1>
            Total Comments: <span class="count">{totalCommentsCount.value}</span
            >
        </h1>
        {#if auth.isAuthenticated}
            <button
                class="disconnect-btn"
                onclick={() => auth.logout()}
                aria-label="Disconnect from GitHub"
            >
                <i class="bx bxs-link-break"></i>
                Disconnect
            </button>
        {/if}
    </div>
</header>
