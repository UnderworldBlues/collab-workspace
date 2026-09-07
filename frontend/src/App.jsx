import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import ChatRoom from './ChatRoom';

function RoomWrapper() {
  const { roomId } = useParams();
  return <ChatRoom roomId={roomId} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Automatically redirect the base URL to Room 1 for testing */}
        <Route path="/" element={<Navigate to="/room/1" replace />} />
        
        {/* Dynamic route that loads the chat room based on the URL parameter */}
        <Route path="/room/:roomId" element={<RoomWrapper />} />
      </Routes>
    </Router>
  );
}