import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
// import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import DashboardPage from './pages/DashboardPage';
import './index.css';

function App() {
  return (
    <Router>
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',  /* --ink: matches HomePage exactly */
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
        {/* <Footer /> */}
      </div>
    </Router>
  );
}

export default App;