const { useState, useEffect, useCallback } = React;

// --- API and WebSocket URLs ---
// Note the different protocols: "http://" for REST API, "ws://" for WebSocket
const CONTEST_API_URL = window.API_URLS.CONTEST_API_URL;
const CONTEST_WS_URL = window.API_URLS.CONTEST_WS_URL;

const ContestView = ({ contestId, onBackToLobby }) => {
    const [contest, setContest] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const authFetch = useAuthFetch();

    // Effect for fetching the initial contest and portfolio data once
    const fetchInitialData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [portfolioRes, leaderboardRes, contestRes] = await Promise.all([
                authFetch(`${CONTEST_API_URL}/${contestId}/portfolio`),
                authFetch(`${CONTEST_API_URL}/${contestId}/leaderboard`),
                authFetch(`${CONTEST_API_URL}/details/${contestId}`)
            ]);

            if (portfolioRes.error) throw new Error(`Failed to load portfolio: ${portfolioRes.error}`);
            if (leaderboardRes.error) throw new Error(`Failed to load leaderboard: ${leaderboardRes.error}`);
            if (contestRes.error) throw new Error(`Failed to load contest details: ${contestRes.error}`);

            setPortfolio(portfolioRes.data);
            setLeaderboard(leaderboardRes.data || []);
            setContest(contestRes.data);

        } catch (err) {
            setError(err.message || "Failed to load contest data. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [contestId, authFetch]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Effect for handling the live WebSocket connection for score updates
    useEffect(() => {
        const tokens = JSON.parse(localStorage.getItem('authTokens'));
        if (!tokens || !contestId) return;

        // Use the modern StompJS client
        const stompClient = new StompJs.Client({
            brokerURL: CONTEST_WS_URL,
            connectHeaders: {
                Authorization: `Bearer ${tokens.accessToken}`
            },
            reconnectDelay: 5000, // try to reconnect every 5 seconds
            onConnect: () => {
                console.log('Connected to STOMP WebSocket!');
                stompClient.subscribe(`/topic/contest/${contestId}`, (message) => {
                    const update = JSON.parse(message.body);
                    console.log('Received score update:', update);

                    // Update the portfolio if the update is for the current user
                    if (portfolio && update.participantId === portfolio.participantId) {
                       setPortfolio(prev => ({...prev, totalPortfolioValue: update.totalPortfolioValue}));
                    }

                    // Update the leaderboard with the new value
                    setLeaderboard(prevLeaderboard => {
                        const newLeaderboard = [...prevLeaderboard];
                        const participantIndex = newLeaderboard.findIndex(p => p.participantId === update.participantId);

                        if (participantIndex > -1) {
                            newLeaderboard[participantIndex].totalPortfolioValue = update.totalPortfolioValue;
                        } else {
                            newLeaderboard.push({ ...update });
                        }
                        // Sort by value, descending
                        return newLeaderboard.sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue);
                    });
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onWebSocketError: (error) => {
                console.error('WebSocket Error', error);
            }
        });

        stompClient.activate();

        // Cleanup function to deactivate the client when the component unmounts
        return () => {
            if (stompClient.active) {
                stompClient.deactivate();
                console.log('STOMP client deactivated.');
            }
        };
    }, [contestId, portfolio]); // Rerun if contestId or the portfolio object changes


    const handleTransactionSuccess = () => {
        // Just refetch the initial data to get the most up-to-date portfolio state
        fetchInitialData();
    };

    if (isLoading) return <div className="text-white text-center p-8">Loading Contest...</div>;
    if (error) return <div className="text-red-400 text-center p-8">{error}</div>;
    if (!contest) return null; // Don't render anything if contest data is missing

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
             <header className="flex justify-between items-center mb-8">
                <div>
                   <button onClick={onBackToLobby} className="text-teal-400 hover:text-teal-300 mb-2">&larr; Back to Lobby</button>
                   <h1 className="text-3xl font-bold">{contest.name}</h1>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-400">Status</div>
                    <div className={`text-lg font-bold ${contest.status === 'LIVE' ? 'text-green-400 animate-pulse' : 'text-yellow-400'}`}>{contest.status}</div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   <PortfolioView portfolio={portfolio} />
                   <TradeWidget contestId={contestId} authFetch={authFetch} onTransactionSuccess={handleTransactionSuccess}/>
                </div>

                <div className="lg:col-span-1">
                   <Leaderboard leaderboard={leaderboard} currentParticipantId={portfolio?.participantId}/>
                </div>
            </div>
        </div>
    );
};

const PortfolioView = ({ portfolio }) => {
    const formatCurrency = (value) => {
        if (value === null || typeof value === 'undefined') return '---';
        return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getPLColor = (value) => {
        if (value === null || typeof value === 'undefined') return 'text-gray-400';
        return value >= 0 ? 'text-green-400' : 'text-red-400';
    };

    const holdings = portfolio?.holdings || [];

    return (
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-teal-300">My Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                 <div>
                    <p className="text-sm text-gray-400">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalPortfolioValue)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400">Holdings Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalHoldingsValue)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400">Cash Balance</p>
                    <p className="text-2xl font-bold">{formatCurrency(portfolio?.cashBalance)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400">Total P/L</p>
                    <p className={`text-2xl font-bold ${getPLColor(portfolio?.totalProfitLoss)}`}>{formatCurrency(portfolio?.totalProfitLoss)}</p>
                </div>
            </div>

            <div>
                <h3 className="font-bold mb-2">My Holdings</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3">Symbol</th>
                                <th scope="col" className="px-4 py-3 text-right">Qty</th>
                                <th scope="col" className="px-4 py-3 text-right">Avg. Buy</th>
                                <th scope="col" className="px-4 py-3 text-right">Current Value</th>
                                <th scope="col" className="px-4 py-3 text-right">P/L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-4 text-gray-500">You have no holdings.</td></tr>
                            )}
                            {holdings.map(h => (
                                <tr key={h.id} className="border-b border-gray-700">
                                    <th scope="row" className="px-4 py-4 font-medium whitespace-nowrap">{h.stockSymbol}</th>
                                    <td className="px-4 py-4 text-right">{h.quantity}</td>
                                    <td className="px-4 py-4 text-right">{formatCurrency(h.averageBuyPrice)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurrency(h.currentValue)}</td>
                                    <td className={`px-4 py-4 text-right font-semibold ${getPLColor(h.profit)}`}>{formatCurrency(h.profit)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Leaderboard = ({ leaderboard, currentParticipantId }) => {
     return (
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-teal-300">Leaderboard</h2>
            <ol className="space-y-3">
                {leaderboard.map((player, index) => (
                    <li key={player.participantId} className={`flex justify-between items-center p-3 rounded-lg ${player.participantId === currentParticipantId ? 'bg-teal-900/50 ring-2 ring-teal-500' : 'bg-gray-700'}`}>
                        <div className="flex items-center">
                            <span className="text-lg font-bold w-8">{index + 1}</span>
                            <span className="font-semibold">{player.participantId === currentParticipantId ? "You" : `${player.username.substring(0, 16)}`}</span>
                        </div>
                        <span className="font-bold text-lg">₹{Number(player.totalPortfolioValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

const TradeWidget = ({ contestId, authFetch, onTransactionSuccess }) => {
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [tradeType, setTradeType] = useState('BUY');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hardcoded list of popular NIFTY 50 stocks for the dropdown
    const popularStocks = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'ITC', 'SBIN', 'BAJFINANCE', 'BHARTIARTL',
        'KOTAKBANK', 'HCLTECH', 'ASIANPAINT', 'MARUTI', 'AXISBANK', 'LT', 'BAJAJFINSV', 'WIPRO', 'ULTRACEMCO', 'NESTLEIND'
    ];
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredStocks = popularStocks.filter(stock => stock.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSymbolSelect = (selectedSymbol) => {
        setSymbol(selectedSymbol);
        setSearchTerm(selectedSymbol);
        setShowDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const { error: apiError } = await authFetch(`${CONTEST_API_URL}/${contestId}/transactions`, {
                method: 'POST',
                body: JSON.stringify({
                    stockSymbol: symbol.toUpperCase() + '.NS',
                    transactionType: tradeType,
                    quantity: parseInt(quantity, 10),
                })
            });
            if (apiError) throw new Error(apiError);

            alert(`Successfully ${tradeType === 'BUY' ? 'bought' : 'sold'} ${quantity} share(s) of ${symbol.toUpperCase()}.`);
            setSymbol('');
            setSearchTerm('');
            setQuantity('1');
            onTransactionSuccess();
        } catch(err) {
            setError(err.message || 'Transaction failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-teal-300">Place a Trade</h2>
             {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <label htmlFor="symbol" className="block text-sm font-medium text-gray-400 mb-1">Stock Symbol</label>
                        <input
                            type="text"
                            id="symbol"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setSymbol(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
                            required
                            className="w-full bg-gray-700 text-white border-gray-600 rounded-lg p-3"
                            placeholder="e.g., RELIANCE"
                            autoComplete="off"
                        />
                        {showDropdown && filteredStocks.length > 0 && (
                            <ul className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-lg mt-1 max-h-48 overflow-y-auto">
                                {filteredStocks.map(stock => (
                                    <li
                                        key={stock}
                                        onClick={() => handleSymbolSelect(stock)}
                                        className="px-3 py-2 text-white hover:bg-indigo-500 cursor-pointer"
                                    >
                                        {stock}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                     <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                        <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" className="w-full bg-gray-700 text-white border-gray-600 rounded-lg p-3" />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" disabled={isLoading || !symbol} className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 ${tradeType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-gray-500`}>
                            {isLoading ? 'Processing...' : `Execute ${tradeType}`}
                        </button>
                    </div>
                </div>
                <div className="flex justify-center space-x-4 pt-2">
                     <button type="button" onClick={() => setTradeType('BUY')} className={`px-6 py-2 rounded-full text-sm font-semibold ${tradeType === 'BUY' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>BUY</button>
                     <button type="button" onClick={() => setTradeType('SELL')} className={`px-6 py-2 rounded-full text-sm font-semibold ${tradeType === 'SELL' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>SELL</button>
                </div>
            </form>
         </div>
    );
};

