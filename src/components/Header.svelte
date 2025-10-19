<script>
    import { auth, totalCommentsCount } from "../state/state.svelte.js";

    /**
     * API health status
     * @type {"healthy" | "unhealthy" | "checking"}
     */
    let healthStatus = $state("checking");

    /**
     * Checks the API health endpoint
     * @returns {Promise<void>}
     */
    async function checkHealth() {
        try {
            const response = await fetch("/api/health");
            if (response.ok) {
                healthStatus = "healthy";
            } else {
                healthStatus = "unhealthy";
            }
        } catch (error) {
            healthStatus = "unhealthy";
        }
    }

    /**
     * Set up periodic health checks
     */
    $effect(() => {
        // Check immediately
        checkHealth();

        // Check every 30 seconds
        const intervalId = setInterval(checkHealth, 30000);

        // Cleanup
        return () => clearInterval(intervalId);
    });
</script>

<header class="header">
    <div class="header-content">
        <i class="bx bxs-git-compare header-icon"></i>

        <h1>
            Total Comments: <span class="count">{totalCommentsCount.value}</span
            >
        </h1>
        <div class="header-left">
            {#if auth.isAuthenticated}
                <button
                    class="disconnect-btn"
                    onclick={() => auth.logout()}
                    aria-label="Revoke token and disconnect from GitHub"
                    title="Revoke token and disconnect from GitHub"
                >
                    <i class="bx bxs-link-break"></i>
                    Disconnect
                </button>
            {/if}
            <div
                class="health-indicator"
                class:healthy={healthStatus === "healthy"}
                class:unhealthy={healthStatus === "unhealthy"}
                class:checking={healthStatus === "checking"}
                title={healthStatus === "healthy"
                    ? "API is up"
                    : healthStatus === "unhealthy"
                      ? "API is down"
                      : "Checking API status..."}
            >
                <span class="health-dot"></span>
                <span class="health-pulse"></span>
            </div>
        </div>
    </div>
</header>
