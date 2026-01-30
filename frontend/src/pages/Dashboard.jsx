import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Plus, Clock, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/thumbnails`, {
          withCredentials: true
        });
        setThumbnails(data);
      } catch (error) {
        console.error("Failed to fetch thumbnails", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnails();
  }, []);

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

      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : thumbnails.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {thumbnails.map((thumb) => (
                <div key={thumb.id} className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all">
                    {/* Placeholder for now since we don't store the image URL in DB yet. 
                        In a real app, we'd upload to S3 and store the URL. 
                        For now, we just show metadata. */}
                    <div className="aspect-video bg-secondary flex items-center justify-center">
                         <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                         <span className="text-xs text-muted-foreground ml-2">Image not stored (MVP)</span>
                    </div>
                    
                    <div className="p-4">
                        <p className="font-medium truncate mb-1">{thumb.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                             <span>{thumb.aspect_ratio}</span>
                             <span>{format(new Date(thumb.created_at), 'MMM d, yyyy')}</span>
                        </div>
                         {thumb.thumbnail_text && (
                            <div className="mt-2 text-xs bg-secondary/50 p-2 rounded">
                                <span className="font-semibold">Text:</span> {thumb.thumbnail_text}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
