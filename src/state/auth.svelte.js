let token = $state(localStorage.getItem("githubToken") || "");
let isAuthenticated = $derived(!!token);

export function createAuth() {
    return {
        get token() {
            return token;
        },
        get isAuthenticated() {
            return isAuthenticated;
        },

        login(newToken) {
            token = newToken;
            localStorage.setItem("githubToken", newToken);
        },

        logout() {
            token = "";
            localStorage.removeItem("githubToken");
        },
    };
}

export const auth = createAuth();
