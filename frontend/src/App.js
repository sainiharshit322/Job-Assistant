import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import DashboardPage from './pages/DashboardPage';
import { clearSession } from './utils/session';
import './index.css';

function App() {
  useEffect(() => {
    const handleUnload = () => clearSession();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <Router>
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 10% -10%, #c6ff0009 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 90% 110%, #4f8aff08 0%, transparent 60%)
        `,
        backgroundAttachment: 'fixed',
      }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/"          element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/jobs"      element={<JobsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;