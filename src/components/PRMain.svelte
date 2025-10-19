<script>
    import PRPanel from "./PRPanel.svelte";

    /**
     * Function to display toast notifications
     * Passed down from App.svelte
     */
    let { showToast } = $props();
</script>

<main class="main-content">
    <PRPanel index={1} {showToast} />
    <PRPanel index={2} {showToast} />
    <PRPanel index={3} {showToast} />
</main>
