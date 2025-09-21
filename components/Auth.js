const { useState } = React;

const LoginPage = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${AUTH_API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, deviceInfo: "WebApp" }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            localStorage.setItem('authTokens', JSON.stringify(data));
            onLoginSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-teal-400">PickFolio</h1>
                    <p className="text-gray-400 mt-2">Log in to join the battle.</p>
                </div>
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="username">Username</label>
                            <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full appearance-none leading-normal" type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">Password</label>
                            <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full appearance-none leading-normal" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-teal-800">
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                 <p className="text-center text-gray-500 text-sm mt-6">
                    Don't have an account? <button onClick={onSwitchToRegister} className="text-teal-400 hover:text-teal-300 font-bold">Sign Up</button>
                </p>
            </div>
        </div>
    );
};

const RegistrationPage = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${AUTH_API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Registration failed');
            }
            onRegisterSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-teal-400">PickFolio</h1>
                    <p className="text-gray-400 mt-2">Create your account.</p>
                </div>
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                            <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="reg-username">Username</label>
                            <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full" type="text" id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="reg-password">Password</label>
                            <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full" type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-teal-800">
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
                 <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account? <button onClick={onSwitchToLogin} className="text-teal-400 hover:text-teal-300 font-bold">Log In</button>
                </p>
            </div>
        </div>
    );
};
