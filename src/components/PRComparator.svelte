<script>
    import PRPanel from "./PRPanel.svelte";
    import Toast from "./Toast.svelte";

    let toastMessage = $state(null);
    let toastType = $state("info");

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
