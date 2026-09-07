import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatRoom from './ChatRoom';

function RoomWrapper() {
  const { roomId } = useParams();
  return <ChatRoom roomId={roomId} key={roomId} />; 
}

export default function App() {
  return (
    <Router>
      <div style={{ display: 'flex', fontFamily: 'sans-serif' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/room/1" replace />} />
            <Route path="/room/:roomId" element={<RoomWrapper />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}