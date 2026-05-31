import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  BarChart2, Layers, Users, Barcode, LogOut, ChevronRight,
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

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
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
    <aside className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-gray-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Barcode size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 leading-tight">InvoTrack</div>
          <div className="text-[10px] text-gray-400 leading-tight">Inventory & Billing</div>
        </div>
      </div>

      {/* Nav */}
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
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors duration-150 group
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
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

      {/* User footer */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-500'}`}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
