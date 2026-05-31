import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Barcode } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <Barcode size={18} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg">InvoTrack</span>
        </div>

        {/* 404 */}
        <div className="text-[120px] font-semibold leading-none text-white/10 select-none mb-4">
          404
        </div>

        <h1 className="text-2xl font-semibold text-white mb-3">
          Page not found
        </h1>
        <p className="text-blue-200/50 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 h-9 rounded-lg border border-white/10 bg-white/5
                       text-white/70 hover:text-white hover:bg-white/10 text-sm transition-colors"
          >
            <ArrowLeft size={14} /> Go back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-blue-600 hover:bg-blue-500
                       text-white text-sm font-medium transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
