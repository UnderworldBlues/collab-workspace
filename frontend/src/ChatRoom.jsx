import { useState, useEffect, useRef } from 'react';
import api from './api';
import { useWorkspace } from './WorkspaceContext';

export default function ChatRoom({ roomId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const { ws, latestMessage, isConnected } = useWorkspace();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        api.get(`/api/chat/messages/?room=${roomId}`).then(res => {
            if (isMounted) setMessages(res.data.results || res.data);
        }).catch(err => console.error("Error fetching history:", err));
        
        return () => { isMounted = false; };
    }, [roomId]);

    useEffect(() => {
        if (isConnected && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ action: "join_room", room_id: roomId }));
            
            return () => {
                if (ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ action: "leave_room", room_id: roomId }));
                }
            };
        }
    }, [roomId, isConnected, ws]);

    useEffect(() => {
        if (latestMessage?.action === 'receive_message' && latestMessage.room_id == roomId) {
            setMessages(prev => [...prev, { 
                sender: { username: latestMessage.sender }, 
                content: latestMessage.message 
            }]);
        }
    }, [latestMessage, roomId]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                action: "send_message",
                room_id: roomId,
                message: input
            }));
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Top Header */}
            <header className="h-14 px-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-lg font-semibold">#</span>
                    <h2 className="font-semibold text-white">Room {roomId}</h2>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isConnected 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                    {isConnected ? 'Connected' : 'Reconnecting...'}
                </span>
            </header>
            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        No messages in this room yet. Say hello!
                    </div>
                ) : (
                    messages?.map((msg, index) => (
                        <div key={index} className="flex items-start space-x-3 group">
                            {/* Avatar Initial Placeholder */}
                            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm shrink-0 uppercase">
                                {msg.sender?.username?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline space-x-2">
                                    <span className="font-medium text-sm text-slate-200">
                                        {msg.sender?.username}
                                    </span>
                                </div>
                                <p className="text-slate-300 text-sm mt-0.5 break-words leading-relaxed">
                                    {msg.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form onSubmit={sendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center space-x-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <input
                        type="text"
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message #Room ${roomId}...`}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}