<script>
    import { auth } from "../state/auth.svelte.js";
    import { totalCommentsCount } from "./store";
</script>

<header class="header">
    <div class="header-content">
        <i class="bx bxs-git-compare header-icon"></i>
        <h1>
            Total Comments: <span class="count">{$totalCommentsCount}</span>
        </h1>
        {#if auth.isAuthenticated}
            <button class="disconnect-btn" onclick={() => auth.logout()}>
                <i class="bx bxs-link-break"></i>
                Disconnect
            </button>
        {/if}
    </div>
</header>
