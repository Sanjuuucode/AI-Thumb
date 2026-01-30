import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Plus, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground">You have {user?.credits} credits remaining.</p>
        </div>
        <Link to="/editor">
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2">
                <Plus className="w-5 h-5" /> Create New
            </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-2xl p-10 text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold mb-2">No history yet</h3>
        <p className="text-muted-foreground mb-6">Start creating viral thumbnails to see them here.</p>
        <Link to="/editor">
            <Button variant="outline">Create a Thumbnail</Button>
        </Link>
      </div>
    </div>
  );
}
