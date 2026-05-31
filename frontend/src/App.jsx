import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Products   from './pages/Products';
import Orders     from './pages/Orders';
import Billing    from './pages/Billing';
import Analytics  from './pages/Analytics';
import Inventory  from './pages/Inventory';
import Users      from './pages/Users';
import NotFound   from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,.10)',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/products"   element={<Products />} />
              <Route path="/orders"     element={<Orders />} />
              <Route path="/billing"    element={<Billing />} />
              <Route path="/analytics"  element={<Analytics />} />
              <Route path="/inventory"  element={<Inventory />} />
              <Route path="/users"      element={<Users />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
