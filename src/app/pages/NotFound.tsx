import React from 'react';
import { Link } from 'react-router';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-zinc-500">Page not found</p>
      <Link to="/" className="text-indigo-400 hover:text-indigo-300">Go Home</Link>
    </div>
  );
};
