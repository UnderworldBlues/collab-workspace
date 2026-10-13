import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext';
import Sidebar from './Sidebar';
import ChatRoom from './ChatRoom';
import Login from './Login';

function RoomWrapper() {
  const { roomId } = useParams();
  return <ChatRoom roomId={roomId} key={roomId} />;
}

function MainLayout() {
  const { token } = useWorkspace();
  
  if (!token) return <Login />;

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 antialiased overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/room/1" replace />} />
          <Route path="/room/:roomId" element={<RoomWrapper />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <Router>
        <MainLayout />
      </Router>
    </WorkspaceProvider>
  );
}