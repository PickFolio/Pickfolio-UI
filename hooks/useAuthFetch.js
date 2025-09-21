const { useCallback } = React;

const AUTH_API_URL = 'http://localhost:8080/api/auth';

const useAuthFetch = () => {
    const getTokens = () => JSON.parse(localStorage.getItem('authTokens'));
    const setTokens = (tokens) => localStorage.setItem('authTokens', JSON.stringify(tokens));

    const refreshToken = useCallback(async () => {
        const tokens = getTokens();
        // Check for the refreshToken property within the object
        if (!tokens?.refreshToken) {
            console.error("No refresh token available.");
            return null;
        }

        try {
            const response = await fetch(`${AUTH_API_URL}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refreshToken: tokens.refreshToken,
                    deviceInfo: "WebApp"
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const newTokens = await response.json();
            // Save the entire new token object
            setTokens(newTokens);
            return newTokens.accessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            localStorage.removeItem('authTokens');
            window.location.reload();
            return null;
        }
    }, []);

    const authFetch = useCallback(async (url, options = {}) => {
        let tokens = getTokens();
        if (!tokens?.accessToken) {
            return { data: null, error: 'Not authenticated' };
        }

        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                'Authorization': `Bearer ${tokens.accessToken}`,
            },
        };

        let response = await fetch(url, fetchOptions);

        if (response.status === 401) {
            console.log('Access token expired or invalid. Attempting refresh...');
            const newAccessToken = await refreshToken();
            if (newAccessToken) {
                fetchOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
                response = await fetch(url, fetchOptions); // Retry the request
            } else {
                return { data: null, error: 'Your session has expired. Please log in again.' };
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unexpected server error occurred.' }));
            console.error(response.status, errorData);
            return { data: null, error: errorData.message };
        }

        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : null;

        return { data, error: null };
    }, [refreshToken]);

    return authFetch;
};

