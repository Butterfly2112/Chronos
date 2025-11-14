import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ConfirmEmail from './pages/ConfirmEmail'
import Dashboard from './pages/Dashboard'
import Header from './components/Header'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <div>
        <Header />
        <main>
          <Routes>
            {/* Головна сторінка -> дашборд */}
            <Route path="/" element={<Dashboard />} />
            {/* Маршрути для аутентифікації */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
