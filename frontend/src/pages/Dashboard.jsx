import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Plus, Clock, Image as ImageIcon, Download, Coins } from 'lucide-react';
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

  const getImageUrl = (thumb) => {
    if (!thumb.image_url) return null;
    // thumb.image_url now already contains /api/static/images/... 
    // We just need to prepend the backend URL if it's not already absolute (it isn't)
    return `${process.env.REACT_APP_BACKEND_URL}${thumb.image_url}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
        <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span>You have {user?.credits} credits remaining.</span>
                <Link to="/pricing" className="text-primary hover:underline text-sm font-medium ml-2">
                    Top up credits
                </Link>
            </div>
        </div>
        <div className="flex gap-3">
            <Link to="/pricing">
                <Button variant="outline" className="rounded-full">
                    Buy Credits
                </Button>
            </Link>
            <Link to="/editor">
                <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2">
                    <Plus className="w-5 h-5" /> Create New
                </Button>
            </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : thumbnails.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {thumbnails.map((thumb) => (
                <div key={thumb.id} className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all">
                    <div className={`bg-secondary flex items-center justify-center relative overflow-hidden ${thumb.aspect_ratio === '9:16' ? 'aspect-[9/16]' : thumb.aspect_ratio === '1:1' ? 'aspect-square' : 'aspect-video'}`}>
                         {getImageUrl(thumb) ? (
                            <>
                                <img 
                                    src={getImageUrl(thumb)} 
                                    alt={thumb.description} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                    }}
                                />
                                <div className="fallback-icon flex-col items-center gap-2 hidden absolute inset-0 justify-center">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                    <span className="text-xs text-muted-foreground">Load failed</span>
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <a href={getImageUrl(thumb)} download={`thumbnail-${thumb.id}.png`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" size="sm" className="gap-2">
                                            <Download className="w-4 h-4" /> Download
                                        </Button>
                                    </a>
                                </div>
                            </>
                         ) : (
                            <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                <span className="text-xs text-muted-foreground">Image missing</span>
                            </div>
                         )}
                    </div>
                    
                    <div className="p-4">
                        <p className="font-medium truncate mb-1" title={thumb.description}>{thumb.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                             <span>{thumb.aspect_ratio}</span>
                             <span>{format(new Date(thumb.created_at), 'MMM d')}</span>
                        </div>
                         {thumb.thumbnail_text && (
                            <div className="mt-2 text-xs bg-secondary/50 p-2 rounded truncate" title={thumb.thumbnail_text}>
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
