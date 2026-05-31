import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  BarChart2, Layers, Users, Barcode, LogOut,
  ChevronRight, Home, AlertTriangle, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { label: 'Dashboard',  to: '/dashboard', icon: LayoutDashboard, section: 'main' },
  { label: 'Products',   to: '/products',  icon: Package,          section: 'main' },
  { label: 'Orders',     to: '/orders',    icon: ShoppingCart,     section: 'main' },
  { label: 'Billing',    to: '/billing',   icon: Receipt,          section: 'main' },
  { label: 'Analytics',  to: '/analytics', icon: BarChart2,        section: 'reports' },
  { label: 'Inventory',  to: '/inventory', icon: Layers,           section: 'reports' },
  { label: 'Users',      to: '/users',     icon: Users,            section: 'system', roles: ['admin'] },
];

const ROLE_COLORS = {
  admin:   'bg-blue-50 text-blue-700',
  manager: 'bg-emerald-50 text-emerald-700',
  cashier: 'bg-amber-50 text-amber-700',
  viewer:  'bg-gray-100 text-gray-600',
};

// ── Logout Confirmation Dialog ────────────────────────────
function LogoutConfirmModal({ open, onConfirm, onCancel, userName }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut size={18} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Sign out</h2>
              <p className="text-xs text-gray-400">Are you sure you want to leave?</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-5">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3 mb-5">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              You are signed in as <span className="font-semibold">{userName}</span>. 
              Signing out will end your session and you will need to log in again to access the system.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Stay signed in
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={14} />
              Yes, sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────
export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Called when user clicks Sign out
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Called when user confirms logout in the modal
  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    toast.success('You have been signed out');
    navigate('/');    // go to landing page
  };

  // Called when user cancels logout
  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const sections = [
    { key: 'main',    label: 'Main' },
    { key: 'reports', label: 'Reports' },
    { key: 'system',  label: 'System' },
  ];

  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      <aside className="flex flex-col h-full bg-white border-r border-gray-100">

        {/* ── Logo ─────────────────────────────────────── */}
        <div className="h-14 flex items-center gap-3 px-5 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Barcode size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 leading-tight">InvoTrack</div>
            <div className="text-[10px] text-gray-400 leading-tight">Inventory & Billing</div>
          </div>
        </div>

        {/* ── Nav links ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sections.map((section) => {
            const items = visibleNav.filter((n) => n.section === section.key);
            if (!items.length) return null;
            return (
              <div key={section.key} className="mb-5">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                  {section.label}
                </div>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5
                       transition-colors duration-150 group
                       ${isActive
                         ? 'bg-blue-50 text-blue-700 font-medium'
                         : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                       }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={16}
                          className={isActive
                            ? 'text-blue-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                          }
                        />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight size={13} className="text-blue-400" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* ── User footer ──────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 p-3">

          {/* User info card */}
          <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-gray-50 rounded-xl">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-500'}`}>
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-500'}`}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Home page button */}
          <button
            onClick={() => { navigate('/'); if (onClose) onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                       text-gray-500 hover:bg-gray-50 hover:text-gray-700
                       transition-colors duration-150 mb-0.5"
          >
            <Home size={15} />
            Home page
          </button>

          {/* Sign out button — shows confirmation modal */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                       text-gray-500 hover:bg-red-50 hover:text-red-600
                       transition-colors duration-150"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Logout confirmation modal ─────────────────── */}
      <LogoutConfirmModal
        open={showLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        userName={user?.name}
      />
    </>
  );
}
