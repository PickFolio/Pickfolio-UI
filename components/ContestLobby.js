const { useState, useEffect, useCallback } = React;

const CONTEST_API_URL = 'http://localhost:8081/api/contests';

const ContestLobby = ({ onLogout, onLogoutAll, onViewContest }) => {
    const [contests, setContests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const authFetch = useAuthFetch();

    const fetchContests = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await authFetch(`${CONTEST_API_URL}/open-public-contests`);
            setContests(data || []);
        } catch (err) {
            setError("Could not load contests. Please try again later.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => { fetchContests(); }, [fetchContests]);

    const handleJoinContest = async (contestId) => {
        try {
            await authFetch(`${CONTEST_API_URL}/join`, {
                method: 'POST',
                body: JSON.stringify({ contestId, inviteCode: null }),
            });
            onViewContest(contestId);
        } catch (err) {
            alert(`Failed to join contest: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-teal-400">Contest Lobby</h1>
                <div className="flex space-x-2">
                    <button onClick={onLogout} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">Logout</button>
                    <button onClick={onLogoutAll} className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">Logout All</button>
                </div>
            </header>
            <div className="mb-6">
                <button onClick={() => setShowCreateModal(true)} className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
                    + Create New Contest
                </button>
            </div>
            {isLoading && <p>Loading contests...</p>}
            {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!isLoading && !error && contests.length === 0 && <p>No open contests found. Create one to get started!</p>}
                {contests.map(contest => (
                    <ContestCard key={contest.id} contest={contest} onJoin={handleJoinContest} onView={onViewContest} />
                ))}
            </div>
            {showCreateModal && <CreateContestModal onClose={() => setShowCreateModal(false)} onContestCreated={fetchContests} />}
        </div>
    );
};

const ContestCard = ({ contest, onJoin, onView }) => {
     const formatDate = (dateString) => new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return (
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-teal-500 transition-all duration-300" onClick={() => onView(contest.id)}>
             <div>
                <h2 className="text-xl font-bold text-teal-300 mb-2">{contest.name}</h2>
                <p className="text-gray-400 text-sm mb-4">Starts: {formatDate(contest.startTime)}</p>
                 <div className="flex justify-between text-sm text-gray-300 mb-4">
                    <span><span className="font-bold">Budget:</span> ₹{Number(contest.virtualBudget).toLocaleString('en-IN')}</span>
                    <span><span className="font-bold">Players:</span> {contest.currentParticipants}/{contest.maxParticipants}</span>
                </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onJoin(contest.id); }} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 mt-4">
                Join Contest
            </button>
        </div>
    );
};

const CreateContestModal = ({ onClose, onContestCreated }) => {
    const [name, setName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [virtualBudget, setVirtualBudget] = useState('100000');
    const [maxParticipants, setMaxParticipants] = useState('10');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const authFetch = useAuthFetch();

    useEffect(() => {
        const now = new Date();
        const defaultStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const defaultEnd = new Date(defaultStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

        const toLocalISOString = (date) => {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
            return localISOTime;
        };
        setStartTime(toLocalISOString(defaultStart));
        setEndTime(toLocalISOString(defaultEnd));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authFetch(`${CONTEST_API_URL}/create`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    isPrivate,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    virtualBudget: parseFloat(virtualBudget),
                    maxParticipants: parseInt(maxParticipants, 10),
                }),
            });
            onContestCreated();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="modal-overlay" onClick={onClose}>
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-teal-300 mb-6">Create New Contest</h2>
                <form onSubmit={handleSubmit}>
                    {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="contest-name">Contest Name</label>
                        <input className="bg-gray-700 text-white focus:outline-none border border-gray-600 rounded-lg py-3 px-4 w-full" type="text" id="contest-name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="start-time">Start Time</label>
                            <input className="bg-gray-700 text-white focus:outline-none border border-gray-600 rounded-lg py-3 px-4 w-full" type="datetime-local" id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="end-time">End Time</label>
                            <input className="bg-gray-700 text-white focus:outline-none border border-gray-600 rounded-lg py-3 px-4 w-full" type="datetime-local" id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="budget">Virtual Budget (₹)</label>
                            <input className="bg-gray-700 text-white focus:outline-none border border-gray-600 rounded-lg py-3 px-4 w-full" type="number" id="budget" value={virtualBudget} onChange={(e) => setVirtualBudget(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="participants">Max Participants</label>
                            <input className="bg-gray-700 text-white focus:outline-none border border-gray-600 rounded-lg py-3 px-4 w-full" type="number" id="participants" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} required />
                        </div>
                    </div>
                    <div className="flex items-center mb-6">
                        <input type="checkbox" id="is-private" className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                        <label htmlFor="is-private" className="ml-2 text-sm font-medium text-gray-300">Make this a private contest</label>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300">Cancel</button>
                        <button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:bg-teal-800">
                            {isLoading ? 'Creating...' : 'Create Contest'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
