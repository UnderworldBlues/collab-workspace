import { useState, useEffect, useRef } from 'react';
import api from './api';

export default function ChatRoom({ roomId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const ws = useRef(null);
    
    useEffect(() => {
        if (!token) return;
        api.get(`/api/chat/messages/?room=${roomId}`)
            .then(response => {
                setMessages(response.data.results);
            })
            .catch(err => console.error("Error fetching history:", err));
    }, [roomId, token]);

const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('http://localhost:8000/api/token/', {
                username,
                password
            });
            const { access, refresh } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setToken(access);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    useEffect(() => {
        if (!token) return;

        axios.get(`http://localhost:8000/api/chat/messages/?room=${roomId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setMessages(response.data.results))
        .catch(err => console.error("Error fetching history:", err));
        ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/?token=${token}`);
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.action === 'receive_message') {
                setMessages(prev => [...prev, {
                    sender: { username: data.sender },
                    content: data.message
                }]);
            }
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [roomId, token]);
    if (!token) {
        return (
            <form onSubmit={handleLogin}>
                <h2>Login to Chat</h2>
                <input name="username" placeholder="Username" required />
                <input name="password" type="password" placeholder="Password" required />
                <button type="submit">Login</button>
            </form>
        );
    }
    return (
        <div>
            <h2>Room: {roomId}</h2>
            <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid black', padding: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index}>
                        <b>{msg.sender.username}:</b> {msg.content}
                    </div>
                ))}
            </div>
            <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Type a message..." 
            />
            <button onClick={() => {
                ws.current.send(JSON.stringify({ action: "send_message", message: input }));
                setInput("");
            }}>Send</button>
        </div>
    );
}