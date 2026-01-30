import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Download, RefreshCw } from 'lucide-react';

export default function Editor() {
  const { user, setUser } = useAuth();
  const [text, setText] = useState('');
  const [style, setStyle] = useState('minimal');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleGenerate = async () => {
    if (!text) {
        toast.error("Please enter some text description");
        return;
    }
    if (user.credits <= 0) {
        toast.error("Not enough credits!");
        return;
    }

    setLoading(true);
    try {
        const { data } = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/generate`, 
            { text, style },
            { withCredentials: true }
        );
        setGeneratedImage(data.image);
        setUser(prev => ({ ...prev, credits: data.credits }));
        toast.success("Thumbnail generated!");
    } catch (error) {
        console.error(error);
        toast.error("Generation failed. Try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[400px_1fr] gap-8 h-[calc(100vh-6rem)]">
      {/* Sidebar Controls */}
      <div className="bg-white border rounded-xl p-6 h-fit space-y-8 shadow-sm">
        <div>
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="text">Description / Text</Label>
                    <Input 
                        id="text" 
                        placeholder="e.g. A shocked face holding a stack of money" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)}
                        className="h-12"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label>Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minimal">Minimal & Clean</SelectItem>
                            <SelectItem value="bold">Bold & High Contrast</SelectItem>
                            <SelectItem value="gaming">Gaming / Neon</SelectItem>
                            <SelectItem value="vlog">Vlog / Lifestyle</SelectItem>
                            <SelectItem value="tech">Tech / Futuristic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        <Button 
            className="w-full h-12 text-lg font-medium" 
            onClick={handleGenerate}
            disabled={loading}
        >
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</> : 'Generate Thumbnail (1 Credit)'}
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
            {user?.credits} credits remaining
        </div>
      </div>

      {/* Canvas / Preview */}
      <div className="bg-[#E5E5E5] rounded-xl border flex items-center justify-center relative overflow-hidden group">
        {!generatedImage ? (
            <div className="text-center p-8">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <RefreshCw className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-muted-foreground">Ready to Create</h3>
                <p className="text-muted-foreground/80 max-w-xs mx-auto mt-2">Enter your prompt and hit generate to see magic happen.</p>
            </div>
        ) : (
            <div className="relative w-full h-full flex items-center justify-center p-8">
                <img 
                    src={generatedImage} 
                    alt="Generated Thumbnail" 
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                />
                <div className="absolute bottom-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={generatedImage} download="thumbnail.png">
                        <Button size="lg" className="rounded-full shadow-xl">
                            <Download className="mr-2 w-5 h-5" /> Download
                        </Button>
                    </a>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
