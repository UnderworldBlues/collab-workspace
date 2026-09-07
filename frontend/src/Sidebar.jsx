import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

export default function Sidebar() {
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        Promise.all([
            api.get('/api/chat/rooms/'),
            api.get('/api/chat/users/')
        ]).then(([roomsRes, usersRes]) => {
            setRooms(roomsRes.data.results || roomsRes.data);
            setUsers(usersRes.data.results || usersRes.data);
        }).catch(err => console.error("Failed to load sidebar data:", err));
    }, []);

    return (
        <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '20px', height: '100vh' }}>
            <h3>🏠 Rooms</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {rooms.map(room => (
                    <li key={room.id} style={{ margin: '10px 0' }}>
                        <Link to={`/room/${room.id}`} style={{ textDecoration: 'none', color: 'blue' }}>
                            # {room.name}
                        </Link>
                    </li>
                ))}
            </ul>

            <h3 style={{ marginTop: '40px' }}>👥 Members</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {users.map(user => (
                    <li key={user.id} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
                        <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: user.status === 'online' ? 'green' : 'gray',
                            marginRight: '10px'
                        }}></span>
                        {user.username} 
                        <span style={{ fontSize: '0.8em', color: 'gray', marginLeft: '5px' }}>
                            {user.title ? `(${user.title})` : ''}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}