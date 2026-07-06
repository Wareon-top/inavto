import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import CarDetail from './pages/CarDetail'
import Selection from './pages/Selection'
import Calculator from './pages/Calculator'
import Orders from './pages/Orders'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
  }, [])

  const hideNav = location.pathname.startsWith('/car/')

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f1a]">
      <div className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/selection" element={<Selection />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
