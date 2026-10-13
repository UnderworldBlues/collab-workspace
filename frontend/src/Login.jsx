import { useState } from 'react';
import axios from 'axios';
import { useWorkspace } from './WorkspaceContext';

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { setToken } = useWorkspace();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await axios.post('http://localhost:8000/api/token/', { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setToken(response.data.access);
        } catch (err) {
            setError("Invalid username or password.");
        }
    };

    return (
        <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white text-center mb-1">Welcome back</h2>
                <p className="text-xs text-slate-400 text-center mb-6">Sign in to your workspace</p>

                {error && (
                    <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="Enter your username"
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="••••••••"
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}