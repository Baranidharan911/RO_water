import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import UserHistory from './components/UserHistory'; // Import the UserHistory component

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/history" element={<UserHistory />} /> {/* Add the route for UserHistory */}
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

export default App;
