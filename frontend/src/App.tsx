import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <AlertProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AlertProvider>
  );
}

export default App;
