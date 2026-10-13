import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from './api';
import { useWorkspace } from './WorkspaceContext';

export default function Sidebar() {
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const { latestMessage, setToken } = useWorkspace();

    useEffect(() => {
        Promise.all([
            api.get('/api/chat/rooms/'),
            api.get('/api/chat/users/')
        ]).then(([roomsRes, usersRes]) => {
            setRooms(roomsRes.data.results || roomsRes.data);
            setUsers(usersRes.data.results || usersRes.data);
        }).catch(err => console.error("Failed to load sidebar:", err));
    }, []);

    useEffect(() => {
        if (latestMessage?.action === 'status_update') {
            setUsers(prevUsers => prevUsers.map(user => 
                user.username === latestMessage.user 
                    ? { ...user, status: latestMessage.status } 
                    : user
            ));
        }
    }, [latestMessage]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setToken(null);
    };

    return (
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none">
            {/* Workspace Header */}
            <div className="h-14 px-5 flex items-center border-b border-slate-800">
                <span className="font-bold text-lg tracking-tight text-white">DjangoChat</span>
            </div>

            {/* Scrollable Navigation & Presence Lists */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {/* Channels Section */}
                <div>
                    <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Channels
                    </h3>
                    <ul className="space-y-1">
                        {rooms?.map(room => (
                            <li key={room.id}>
                                <NavLink
                                    to={`/room/${room.id}`}
                                    className={({ isActive }) =>
                                        `flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                        }`
                                    }
                                >
                                    <span className="text-slate-400 mr-2">#</span>
                                    <span className="truncate">{room.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Members Section */}
                <div>
                    <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Members — {users?.length || 0}
                    </h3>
                    <ul className="space-y-1">
                        {users?.map(user => {
                            const isOnline = user.status === 'online';
                            return (
                                <li
                                    key={user.id}
                                    className="flex items-center px-2.5 py-1.5 rounded-md text-sm text-slate-300"
                                >
                                    <span
                                        className={`w-2.5 h-2.5 rounded-full mr-2.5 shrink-0 ${
                                            isOnline
                                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                                                : 'bg-slate-600'
                                        }`}
                                    />
                                    <span className={`truncate ${!isOnline && 'text-slate-500'}`}>
                                        {user.username}
                                    </span>
                                    {user.title && (
                                        <span className="ml-1.5 text-xs text-slate-500 truncate">
                                            ({user.title})
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Footer / Logout */}
            <div className="p-3 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left flex items-center justify-between"
                >
                    <span>Sign Out</span>
                    <span>→</span>
                </button>
            </div>
        </aside>
    );
}