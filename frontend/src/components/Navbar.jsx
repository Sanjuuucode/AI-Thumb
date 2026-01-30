import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Sparkles, LayoutGrid } from 'lucide-react';

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">QuickThumb.ai</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                 <Button variant="ghost" className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Dashboard
                 </Button>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-sm font-medium">
                <span>{user.credits} Credits</span>
              </div>
              <Button onClick={logout} variant="outline">Logout</Button>
            </>
          ) : (
            <>
                <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
                <Button onClick={login}>Get Started</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
