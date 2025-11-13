import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Header from './components/Header'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <div>
        <Header />
        <main style={{ padding: 20 }}>
          <Routes>
            {/* Головна сторінка -> дашборд */}
            <Route path="/" element={<Dashboard />} />
            {/* Маршрути для аутентифікації */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
