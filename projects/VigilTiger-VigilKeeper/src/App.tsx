import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import Confirm from './components/Confirm';
import ThemeToggle from './components/ThemeToggle';

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: JSX.Element }): JSX.Element => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ThemeToggle />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <div className="app">
                  <ChatInterface />
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;


