const { useState, useEffect } = React;

const AUTH_API_URL = window.API_URLS.AUTH_API_URL;

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authTokens'));
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedContestId, setSelectedContestId] = useState(null);
    const authFetch = useAuthFetch();

    const handleLogout = async () => {
        const tokens = JSON.parse(localStorage.getItem('authTokens'));

        if (tokens && tokens.refreshToken) {
            try {
                await fetch(`${AUTH_API_URL}/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
                });
            } catch (err) {
                console.error("Logout API call failed, logging out locally anyway.", err);
            }
        }
        localStorage.removeItem('authTokens');
        setIsLoggedIn(false);
        setSelectedContestId(null);
    };

    const handleLogoutAll = async () => {
        // --- THIS IS THE FIX ---
        const tokens = JSON.parse(localStorage.getItem('authTokens'));
        if (tokens && tokens.refreshToken) {
           // This is an authenticated call, so we use authFetch.
           // The hook handles adding the base URL for the contest service, but for auth we must be explicit.
           await authFetch(`${AUTH_API_URL}/logout-all`, {
                method: 'POST',
                body: JSON.stringify({ refreshToken: tokens.refreshToken }),
           });
        }
        // Whether the API call succeeds or fails, we log the user out locally
        localStorage.removeItem('authTokens');
        setIsLoggedIn(false);
        setSelectedContestId(null);
    };

    const tokens = JSON.parse(localStorage.getItem('authTokens'));
    const userId = tokens?.accessToken ? JSON.parse(atob(tokens.accessToken.split('.')[1])).sub : null;

    if (isLoggedIn) {
        if (selectedContestId) {
            return <ContestView contestId={selectedContestId} onBackToLobby={() => setSelectedContestId(null)} />;
        }
        return <ContestLobby userId={userId} onLogout={handleLogout} onLogoutAll={handleLogoutAll} onViewContest={setSelectedContestId} />;
    }

    if (isRegistering) {
        return <RegistrationPage
                    onRegisterSuccess={() => {
                        alert('Registration successful! Please log in.');
                        setIsRegistering(false);
                    }}
                    onSwitchToLogin={() => setIsRegistering(false)}
                />;
    }

    return <LoginPage
                onLoginSuccess={() => setIsLoggedIn(true)}
                onSwitchToRegister={() => setIsRegistering(true)}
            />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered.'))
            .catch(err => console.log('Service Worker registration failed: ', err));
    });
}
