const { useCallback } = React;

const AUTH_API_URL = 'http://localhost:8080/api/auth';

const useAuthFetch = () => {
    const getAuthTokens = () => JSON.parse(localStorage.getItem('authTokens'));
    const setAuthTokens = (tokens) => localStorage.setItem('authTokens', JSON.stringify(tokens));
    const clearAuthTokens = () => localStorage.removeItem('authTokens');

    const refreshToken = useCallback(async (token, deviceInfo) => {
        try {
            const response = await fetch(`${AUTH_API_URL}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: token, deviceInfo: deviceInfo || "WebApp" }),
            });
            if (!response.ok) throw new Error('Refresh failed');
            const newTokens = await response.json();
            setAuthTokens(newTokens);
            return newTokens.accessToken;
        } catch (error) {
            console.error('Token refresh error:', error);
            clearAuthTokens();
            window.location.reload();
            return null;
        }
    }, []);

    const authFetch = useCallback(async (url, options = {}) => {
        let tokens = getAuthTokens();
        if (!tokens) throw new Error('Not authenticated');

        const isTokenExpired = (token) => {
            if (!token) return true;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return Date.now() >= payload.exp * 1000;
            } catch (e) { return true; }
        };

        if (isTokenExpired(tokens.accessToken)) {
            tokens.accessToken = await refreshToken(tokens.refreshToken, "WebApp");
            if (!tokens.accessToken) throw new Error('Session expired');
        }

        const fetchOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokens.accessToken}`,
            },
        };

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
            const errorMessage = `API call failed: ${errorBody.message || 'Unknown error'}`;
            throw new Error(errorMessage);
        }
        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return null;
        }
        return response.json();
    }, [refreshToken]);

    return authFetch;
};
