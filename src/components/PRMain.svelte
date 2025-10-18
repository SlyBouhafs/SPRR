<script>
    import PRPanel from "./PRPanel.svelte";
    import Toast from "./Toast.svelte";

    /**
     * Current toast message to display
     * @type {string | null}
     */
    let toastMessage = $state(null);

    /**
     * Type of toast notification (success, error, info)
     * @type {"success" | "error" | "info"}
     */
    let toastType = $state("info");

    /**
     * Displays a toast notification message
     * @param {string} message - The message to display
     * @param {"success" | "error" | "info"} type - The type of notification
     * @returns {void}
     */
    function showToast(message, type = "info") {
        toastMessage = message;
        toastType = type;
        setTimeout(() => (toastMessage = null), 3000);
    }
</script>

<main class="main-content">
    <PRPanel index={1} {showToast} />
    <PRPanel index={2} {showToast} />
    <PRPanel index={3} {showToast} />
</main>

<Toast message={toastMessage} type={toastType} />
