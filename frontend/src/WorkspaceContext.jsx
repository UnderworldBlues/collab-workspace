import { createContext, useState, useEffect, useRef, useContext } from 'react';
import api from './api';

const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [latestMessage, setLatestMessage] = useState(null);
    const ws = useRef(null);
    useEffect(() => {
        if (!token) return;

        let isMounted = true;
        const currentToken = localStorage.getItem('access_token');
        
        ws.current = new WebSocket(`ws://localhost:8000/ws/workspace/?token=${currentToken}`);
        ws.current.onmessage = (event) => {
            if (isMounted) {
                setLatestMessage(JSON.parse(event.data));
            }
        };
        ws.current.onclose = async (event) => {
            if (!isMounted) return;
            if (event.code === 4001) {
                try {
                    await api.get(`/api/chat/rooms/`);
                    setToken(localStorage.getItem('access_token'));
                } catch (error) {
                    setToken(null);
                }
            }
        };
        return () => {
            isMounted = false;
            if (ws.current) ws.current.close();
        };
    }, [token]);
    return (
        <WorkspaceContext.Provider value={{ ws, latestMessage, token, setToken }}>
            {children}
        </WorkspaceContext.Provider>
    );
};