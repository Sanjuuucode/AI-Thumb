import React from 'react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Zap, Image, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const { login, user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <main className="flex-1">
        <section className="py-20 lg:py-32 px-4 max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-medium mb-8">
                <Zap className="w-4 h-4" />
                <span>AI-Powered Thumbnail Generation</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
                Viral Thumbnails in <span className="text-primary">Seconds</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Stop wasting hours on Photoshop. Upload an image or describe your idea, and let our AI generate high-CTR thumbnails instantly.
            </p>
            <div className="flex items-center justify-center gap-4">
                {user ? (
                    <Link to="/dashboard">
                        <Button size="lg" className="h-12 px-8 text-lg rounded-full">Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" /></Button>
                    </Link>
                ) : (
                    <Button size="lg" onClick={login} className="h-12 px-8 text-lg rounded-full">Start Creating for Free <ArrowRight className="ml-2 w-5 h-5" /></Button>
                )}
            </div>
        </section>

        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
                <div className="p-8 rounded-2xl bg-[#FAFAFA] border hover:border-primary/20 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                    <p className="text-muted-foreground">Generate professional thumbnails in under 5 seconds. Speed up your workflow.</p>
                </div>
                <div className="p-8 rounded-2xl bg-[#FAFAFA] border hover:border-primary/20 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                        <Image className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">High Quality</h3>
                    <p className="text-muted-foreground">AI models trained on viral content to ensure maximum click-through rates.</p>
                </div>
                <div className="p-8 rounded-2xl bg-[#FAFAFA] border hover:border-primary/20 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                        <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Cost Effective</h3>
                    <p className="text-muted-foreground">Cheaper than hiring a designer. Get 5 free credits when you sign up.</p>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
