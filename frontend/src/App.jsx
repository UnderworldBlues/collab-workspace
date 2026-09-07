import ChatRoom from './ChatRoom';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Django + React Workspace</h1>
      <ChatRoom roomId={1} />
    </div>
  );
}

export default App;