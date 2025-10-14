<script>
    import { auth } from "../state/auth.svelte.js";
</script>

<header class="header">
    <div class="header-content">
        <i class="bx bxs-git-compare header-icon"></i>
        <h1>PR REVIEW</h1>
        {#if auth.isAuthenticated}
            <button class="disconnect-btn" onclick={() => auth.logout()}>
                <i class="bx bxs-link-break"></i>
                Disconnect
            </button>
        {/if}
    </div>
</header>
