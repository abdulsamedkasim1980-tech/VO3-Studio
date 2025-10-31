import React from 'react';

export const Header: React.FC = () => (
  <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-6 text-center sm:text-left">
    <div>
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
        VO3 Studio
      </h1>
      <p className="text-lg text-slate-300">AI-Enhanced Image-to-Video Maker</p>
    </div>
    <div className="text-sm text-slate-400 mt-2 sm:mt-0">
      Zero-cost · Client-side processing · Privacy-friendly
    </div>
  </header>
);
