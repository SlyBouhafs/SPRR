// ============================================================================
// Authentication State
// ============================================================================

/**
 * Safely retrieves the GitHub token from localStorage
 * @returns {string} - The stored token or empty string if unavailable
 */
function getStoredToken() {
    try {
        return localStorage.getItem("githubToken") || "";
    } catch (error) {
        console.error("Failed to access localStorage:", error);
        return "";
    }
}

/**
 * Safely stores the GitHub token in localStorage
 * @param {string} token - The token to store
 */
function setStoredToken(token) {
    try {
        localStorage.setItem("githubToken", token);
    } catch (error) {
        console.error("Failed to save token to localStorage:", error);
    }
}

/**
 * Safely removes the GitHub token from localStorage
 */
function removeStoredToken() {
    try {
        localStorage.removeItem("githubToken");
    } catch (error) {
        console.error("Failed to remove token from localStorage:", error);
    }
}

let _token = $state(getStoredToken());
let _isAuthenticated = $derived(!!_token);

/**
 * Creates and exports the authentication state manager
 * Handles GitHub token storage and authentication status
 */
export function createAuthState() {
    return {
        get token() {
            return _token;
        },
        get isAuthenticated() {
            return _isAuthenticated;
        },
        login(newToken) {
            _token = newToken;
            setStoredToken(newToken);
        },
        logout() {
            _token = "";
            removeStoredToken();
        },
    };
}

/**
 * Singleton instance of authentication state
 */
export const auth = createAuthState();

// ============================================================================
// Panel Comments State
// ============================================================================

// Store for individual panel comment counts using $state
let _panelComments = $state({
    1: 0,
    2: 0,
    3: 0,
});

// Derived total comments count using $derived
let _totalCommentsCount = $derived(
    Object.values(_panelComments).reduce((sum, count) => sum + count, 0),
);

/**
 * Creates and exports the panel comments state manager
 * Provides access to panel comment counts and update methods
 */
export function createPanelCommentsState() {
    return {
        get counts() {
            return _panelComments;
        },
        getCount(panelIndex) {
            return _panelComments[panelIndex];
        },
        updatePanel(panelIndex, count) {
            _panelComments[panelIndex] = count;
        },
        resetPanel(panelIndex) {
            _panelComments[panelIndex] = 0;
        },
    };
}

/**
 * Singleton instance of panel comments state
 */
export const panelComments = createPanelCommentsState();

/**
 * Reactive total comments count across all panels
 * This is a derived value that automatically updates when any panel count changes
 */
export const totalCommentsCount = {
    get value() {
        return _totalCommentsCount;
    },
};

// ============================================================================
// URL Propagation State
// ============================================================================

// Store for URL propagation between panels using $state
let _urlPropagation = $state({
    url: "",
    sourceIndex: null,
    autoLoad: false,
});

/**
 * Creates and exports the URL propagation state manager
 * Handles URL sharing between panels for auto-fill functionality
 */
export function createUrlPropagationState() {
    return {
        get url() {
            return _urlPropagation.url;
        },
        get sourceIndex() {
            return _urlPropagation.sourceIndex;
        },
        get autoLoad() {
            return _urlPropagation.autoLoad;
        },
        get value() {
            return _urlPropagation;
        },
        set(data) {
            _urlPropagation = data;
        },
    };
}

/**
 * Singleton instance of URL propagation state
 */
export const urlPropagation = createUrlPropagationState();
