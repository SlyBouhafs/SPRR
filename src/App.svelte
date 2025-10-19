<script>
    import { auth } from "./state/state.svelte.js";
    import Header from "./components/Header.svelte";
    import Login from "./components/Login.svelte";
    import PRMain from "./components/PRMain.svelte";
    import Toast from "./components/Toast.svelte";

    let toastMessage = $state(null);
    let toastType = $state("");

    /**
     * Shows a toast notification
     * @param {string} message - Message to display
     * @param {"success" | "error" | "info"} type - Type of notification
     * @returns {void}
     */
    function showToast(message, type = "info") {
        toastMessage = message;
        toastType = type;
        setTimeout(() => (toastMessage = null), 3000);
    }
</script>

<Header />

{#if auth.isAuthenticated}
    <PRMain {showToast} />
{:else}
    <Login {showToast} />
{/if}

<Toast message={toastMessage} type={toastType} />
