import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Header from './components/Header'

export default function App() {
  return (
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
  )
}
