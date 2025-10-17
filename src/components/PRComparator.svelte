<script>
    import PRPanel from "./PRPanel.svelte";
    import Toast from "./Toast.svelte";

    let toastMessage = $state(null);
    let toastType = $state("info");
    let totalComments = [];

    function showToast(message, type = "info") {
        toastMessage = message;
        toastType = type;
        setTimeout(() => (toastMessage = null), 3000);
    }
</script>

<main class="main-content">
    <PRPanel index={1} {totalComments} {showToast} />
    <PRPanel index={2} {totalComments} {showToast} />
    <PRPanel index={3} {totalComments} {showToast} />
</main>

<Toast message={toastMessage} type={toastType} />
