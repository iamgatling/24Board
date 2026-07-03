import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Container from './Container';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/board/:roomId" element={<Container />} />
        <Route path="*" element={<Navigate to="/board/default" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
