const { useState, useEffect } = React;

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
         const tokens = JSON.parse(localStorage.getItem('authTokens'));
         if (tokens && tokens.refreshToken) {
            try {
                await authFetch(`${AUTH_API_URL}/logout-all`, {
                     method: 'POST',
                     body: JSON.stringify({ refreshToken: tokens.refreshToken }),
                });
            } catch (err) {
                 console.error("Logout All API call failed, logging out locally anyway.", err);
            }
        }
        localStorage.removeItem('authTokens');
        setIsLoggedIn(false);
        setSelectedContestId(null);
    };

    const token = localStorage.getItem('accessToken');
    const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null;

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
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed: ', err));
    });
}
