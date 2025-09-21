const { useState, useEffect, useCallback } = React;

const CONTEST_API_URL = 'http://localhost:8081/api/contests';

// --- NEW COMPONENT: A modal for joining a private contest with a code ---
const JoinPrivateContestModal = ({ authFetch, onClose, onContestJoined }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // This calls the new backend endpoint for joining with a code
            const { error: apiError } = await authFetch('/api/contests/join-by-code', {
                method: 'POST',
                body: JSON.stringify({ inviteCode }),
            });

            if (apiError) {
                throw new Error(apiError);
            }
            onContestJoined(); // This will close the modal and refresh the lobby
        } catch (err) {
            setError(err.message || 'Failed to join contest. Please check the code and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Join Private Contest</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Enter Invite Code"
                        className="w-full bg-gray-700 text-white rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        maxLength="6"
                        autoFocus
                    />
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={isLoading || !inviteCode} className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed">
                            {isLoading ? 'Joining...' : 'Join'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- ENHANCED: CreateContestModal now shows the invite code on success ---
const CreateContestModal = ({ authFetch, onClose, onContestCreated }) => {
    const [step, setStep] = useState(1); // Step 1 for the form, Step 2 for sharing the code
    const [newContest, setNewContest] = useState(null);
    const [formData, setFormData] = useState({
        name: '', isPrivate: false, startTime: '', endTime: '',
        virtualBudget: '100000', maxParticipants: '10',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const copyToClipboard = () => {
        if (!newContest?.inviteCode) return;
        // A simple copy mechanism for modern browsers
        navigator.clipboard.writeText(newContest.inviteCode).then(() => {
            alert('Invite code copied to clipboard!');
        }, () => {
            alert('Failed to copy invite code.');
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                virtualBudget: parseFloat(formData.virtualBudget),
                maxParticipants: parseInt(formData.maxParticipants, 10),
            };
            const { data, error: apiError } = await authFetch('/api/contests/create', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (apiError) throw new Error(apiError);

            setNewContest(data);
            if (data.isPrivate) {
                // For private contests, go to the share screen instead of closing
                setStep(2);
            } else {
                onContestCreated(); // Close immediately for public contests
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    // This is the new success screen for private contests
    if (step === 2) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm text-center">
                    <h2 className="text-xl font-bold mb-2 text-white">Private Contest Created!</h2>
                    <p className="text-gray-300 mb-4">Share this code with your friends:</p>
                    <div className="bg-gray-900 rounded p-4 mb-4 flex items-center justify-between">
                        <span className="text-2xl font-mono text-indigo-400">{newContest.inviteCode}</span>
                        <button onClick={copyToClipboard} className="p-2 rounded bg-gray-700 hover:bg-gray-600" title="Copy code">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                        </button>
                    </div>
                    <button onClick={onContestCreated} className="w-full px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500">Done</button>
                </div>
            </div>
        );
    }

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-white">Create New Contest</h2>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* The form inputs (name, private toggle, etc.) are unchanged */}
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Contest Name" className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <div className="flex items-center">
                        <input type="checkbox" name="isPrivate" id="isPrivate" checked={formData.isPrivate} onChange={handleChange} className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"/>
                        <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-300">Private Contest</label>
                    </div>
                    {/* Other fields: startTime, endTime, virtualBudget, maxParticipants */}
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 disabled:bg-indigo-800">
                            {isLoading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
         </div>
    );
};

// --- ENHANCED: ContestCard now has smarter logic for its buttons and info display ---
const ContestCard = ({ contest, userId, onJoin, onView }) => {
    // Determine if the current user is the creator of this contest
    const isCreator = contest.creatorId === userId;
    // Determine if this card is in the "My Contests" list (which implies the user has joined)
    const hasJoined = contest.hasJoined;

    return (
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col space-y-3">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-white">{contest.name}</h3>
                {contest.isPrivate && (
                    <span className="text-xs font-semibold bg-indigo-500 text-white px-2 py-1 rounded-full">Private</span>
                )}
            </div>
            {/* ... Other details like player count are unchanged ... */}

            {/* Show invite code only to the creator of a private contest */}
            {contest.isPrivate && isCreator && (
                <div className="text-xs text-center text-indigo-300 bg-gray-700 p-2 rounded">
                    Invite Code: <span className="font-mono">{contest.inviteCode}</span>
                </div>
            )}

            {/* Show a "View" button if the user has joined, otherwise a "Join" button */}
            {hasJoined ? (
                 <button onClick={() => onView(contest.id)} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-500 transition duration-300">
                    View Contest
                </button>
            ) : (
                <button onClick={() => onJoin(contest.id)} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-500 transition duration-300">
                    Join Public Contest
                </button>
            )}
        </div>
    );
};

// --- REWRITTEN: The main ContestLobby component ---
const ContestLobby = ({ userId, onLogout, onLogoutAll, onViewContest }) => {
    const authFetch = useAuthFetch();
    const [myContests, setMyContests] = useState([]);
    const [publicContests, setPublicContests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // --- THIS IS THE FIX: Use the full URL ---
            const [myContestsRes, publicContestsRes] = await Promise.all([
                authFetch(`${CONTEST_API_URL}/my-contests`),
                authFetch(`${CONTEST_API_URL}/open-public-contests`)
            ]);

            if (myContestsRes.error) throw new Error(`Failed to load your contests: ${myContestsRes.error}`);
            if (publicContestsRes.error) throw new Error(`Failed to load public contests: ${publicContestsRes.error}`);

            setMyContests(myContestsRes.data || []);

            const myContestIds = new Set((myContestsRes.data || []).map(c => c.id));
            setPublicContests((publicContestsRes.data || []).filter(c => !myContestIds.has(c.id)));

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleContestCreated = () => {
        setShowCreateModal(false);
        fetchData();
    };
    const handleContestJoined = () => {
        setShowJoinModal(false);
        fetchData();
    };

    const handleJoinPublic = async (contestId) => {
        try {
             // --- THIS IS THE FIX: Use the full URL ---
             const { error } = await authFetch(`${CONTEST_API_URL}/join`, {
                method: 'POST',
                body: JSON.stringify({ contestId }),
            });
            if (error) throw new Error(error);
            fetchData();
        } catch (err) {
            alert(`Error joining contest: ${err.message}`);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4">
            <header className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">PickFolio</h1>
                <div>
                    <button onClick={onLogoutAll} className="bg-red-600 text-white font-bold py-2 px-3 rounded hover:bg-red-500 mr-2 text-sm">Logout All</button>
                    <button onClick={onLogout} className="bg-gray-700 text-white font-bold py-2 px-3 rounded hover:bg-gray-600 text-sm">Logout</button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Contest Lobby</h1>
                    <div className="flex space-x-2">
                         <button onClick={() => setShowJoinModal(true)} className="bg-gray-700 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">
                            Join with Code
                        </button>
                        <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-500">
                            Create Contest
                        </button>
                    </div>
                </div>

                {isLoading && <div className="text-center p-8">Loading contests...</div>}
                {error && <div className="text-center p-8 text-red-400">Could not load contests. Please try again later.</div>}

                {!isLoading && !error && (
                    <>
                        {/* --- MY CONTESTS SECTION --- */}
                        <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">My Contests</h2>
                        {myContests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {myContests.map(contest => (
                                    <ContestCard key={contest.id} contest={contest} userId={userId} hasJoined={true} onView={onViewContest} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 mb-8">You haven't joined or created any contests yet. Join a public contest below or create a new one!</p>
                        )}

                        {/* --- PUBLIC CONTESTS SECTION --- */}
                        <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">Public Contests</h2>
                        {publicContests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {publicContests.map(contest => (
                                    <ContestCard key={contest.id} contest={contest} userId={userId} hasJoined={false} onJoin={handleJoinPublic} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">There are no open public contests right now.</p>
                        )}
                    </>
                )}
            </div>

            {/* Modals are rendered here */}
            {showCreateModal && <CreateContestModal authFetch={authFetch} onClose={() => setShowCreateModal(false)} onContestCreated={handleContestCreated} />}
            {showJoinModal && <JoinPrivateContestModal authFetch={authFetch} onClose={() => setShowJoinModal(false)} onContestJoined={handleContestJoined} />}
        </div>
    );
};

