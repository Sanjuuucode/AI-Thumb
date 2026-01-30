import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Download, RefreshCw, Upload, Image as ImageIcon, Type, Sparkles } from 'lucide-react';

export default function Editor() {
  const { user, setUser } = useAuth();
  
  const [description, setDescription] = useState('');
  const [thumbnailText, setThumbnailText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [subjectImage, setSubjectImage] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null);
  const [subjectPreview, setSubjectPreview] = useState(null);
  const [referencePreview, setReferencePreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleImageUpload = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!description || !subjectImage || !referenceImage) {
        toast.error("Please fill in description and upload both images");
        return;
    }
    if (user.credits <= 0) {
        toast.error("Not enough credits!");
        return;
    }

    setLoading(true);
    try {
        const payload = {
            description,
            thumbnail_text: thumbnailText,
            aspect_ratio: aspectRatio,
            subject_image: subjectPreview, // This is the base64 string
            reference_image: referencePreview // This is the base64 string
        };

        const { data } = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/generate`, 
            payload,
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
    <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[450px_1fr] gap-8 h-full min-h-[calc(100vh-6rem)]">
      {/* Sidebar Controls */}
      <div className="bg-white border rounded-xl p-6 h-fit space-y-6 shadow-sm overflow-y-auto max-h-[calc(100vh-2rem)]">
        <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Thumbnail Studio
            </h2>
            
            <div className="space-y-6">
                {/* Image Uploads */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>1. Subject Image</Label>
                        <div 
                            className="border-2 border-dashed rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors relative overflow-hidden"
                            onClick={() => document.getElementById('subject-upload').click()}
                        >
                            {subjectPreview ? (
                                <img src={subjectPreview} alt="Subject" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground text-center">Upload Subject</span>
                                </>
                            )}
                            <input 
                                id="subject-upload" 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, setSubjectImage, setSubjectPreview)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>2. Style Reference</Label>
                        <div 
                            className="border-2 border-dashed rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors relative overflow-hidden"
                            onClick={() => document.getElementById('ref-upload').click()}
                        >
                             {referencePreview ? (
                                <img src={referencePreview} alt="Reference" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <>
                                    <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground text-center">Upload Style</span>
                                </>
                            )}
                            <input 
                                id="ref-upload" 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, setReferenceImage, setReferencePreview)}
                            />
                        </div>
                    </div>
                </div>

                {/* Text Controls */}
                <div className="space-y-2">
                    <Label htmlFor="desc">3. Description / Concept</Label>
                    <Textarea 
                        id="desc" 
                        placeholder="e.g. A shocked face holding a stack of money in a futuristic city" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-20 resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="thumb-text" className="flex items-center gap-2">
                        <Type className="w-4 h-4" /> Text Overlay (Baked in)
                    </Label>
                    <Input 
                        id="thumb-text" 
                        placeholder="e.g. I MADE $1M!" 
                        value={thumbnailText} 
                        onChange={(e) => setThumbnailText(e.target.value)}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select ratio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="16:9">YouTube (16:9)</SelectItem>
                            <SelectItem value="9:16">Shorts / Reels (9:16)</SelectItem>
                            <SelectItem value="1:1">Square (1:1)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        <div className="pt-4 border-t">
            <Button 
                className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all" 
                onClick={handleGenerate}
                disabled={loading}
            >
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cooking...</> : 'Generate Thumbnail (1 Credit)'}
            </Button>
            <div className="text-center text-sm text-muted-foreground mt-2">
                {user?.credits} credits remaining
            </div>
        </div>
      </div>

      {/* Canvas / Preview */}
      <div className="bg-[#E5E5E5] rounded-xl border flex items-center justify-center relative overflow-hidden group shadow-inner min-h-[400px]">
        {!generatedImage ? (
            <div className="text-center p-8 max-w-md">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <RefreshCw className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-bold text-muted-foreground/80 mb-2">Canvas Empty</h3>
                <p className="text-muted-foreground/60">
                    Upload your subject and a reference style, add your text, and let our AI bake it all together.
                </p>
            </div>
        ) : (
            <div className="relative w-full h-full flex items-center justify-center p-4">
                <img 
                    src={generatedImage} 
                    alt="Generated Thumbnail" 
                    className={`max-w-full max-h-full rounded-lg shadow-2xl transition-all duration-500 ${aspectRatio === '9:16' ? 'h-[90%]' : 'w-[95%]'}`}
                />
                <div className="absolute bottom-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={generatedImage} download="thumbnail.png">
                        <Button size="lg" className="rounded-full shadow-xl bg-white text-black hover:bg-gray-100">
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
