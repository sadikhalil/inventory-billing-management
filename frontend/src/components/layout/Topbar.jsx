import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/products':  'Products',
  '/orders':    'Orders',
  '/billing':   'Billing & Invoices',
  '/analytics': 'Analytics',
  '/inventory': 'Inventory',
  '/users':     'Users & Roles',
};

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const title = TITLES[pathname] || 'InvoTrack';
  const hour  = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="h-14 flex items-center gap-4 px-5 bg-white border-b border-gray-100 flex-shrink-0">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden btn btn-icon text-gray-500"
      >
        <Menu size={18} />
      </button>

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        <p className="text-[11px] text-gray-400 hidden sm:block">
          {greeting}, {user?.name?.split(' ')[0]}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="btn btn-icon text-gray-500"
          title="Search"
        >
          <Search size={16} />
        </button>

        {/* Notifications */}
        <button className="btn btn-icon text-gray-500 relative" title="Notifications">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs ml-1 cursor-pointer">
          {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Search bar (expandable) */}
      {showSearch && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 px-5 py-3 z-40 shadow-sm">
          <input
            autoFocus
            type="text"
            placeholder="Search products, orders, invoices…"
            className="input max-w-md"
            onBlur={() => setShowSearch(false)}
          />
        </div>
      )}
    </header>
  );
}
