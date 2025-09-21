const { useCallback } = React;

const AUTH_SERVICE_BASE_URL = 'http://localhost:8080';
const CONTEST_SERVICE_BASE_URL = 'http://localhost:8081';

const useAuthFetch = () => {
    const getAccessToken = () => localStorage.getItem('accessToken');
    const setAccessToken = (token) => localStorage.setItem('accessToken', token);
    const getRefreshToken = () => localStorage.getItem('refreshToken');

    const handleRefreshToken = useCallback(async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            console.error("No refresh token available.");
            return null;
        }

        try {
            const response = await fetch(`${AUTH_SERVICE_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken, deviceInfo: "WebApp" }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            setAccessToken(data.accessToken);
            // Also update the refresh token in case of token rotation
            localStorage.setItem('refreshToken', data.refreshToken);
            return data.accessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear tokens and force re-login if refresh fails
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.reload();
            return null;
        }
    }, []);

    const authFetch = useCallback(async (endpoint, options = {}) => {
        let accessToken = getAccessToken();

        const fullUrl = `${CONTEST_SERVICE_BASE_URL}${endpoint}`;

        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`,
            },
        };

        let response = await fetch(fullUrl, fetchOptions);

        if (response.status === 401) {
            console.log('Access token expired. Attempting refresh...');
            const newAccessToken = await handleRefreshToken();
            if (newAccessToken) {
                fetchOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
                response = await fetch(fullUrl, fetchOptions);
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

    }, [handleRefreshToken]);

    return authFetch;
};

