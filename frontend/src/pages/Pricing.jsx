import React from 'react';
import { Button } from '../components/ui/button';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Pricing() {
  const { user, login } = useAuth();

  const handleSubscribe = async (packId) => {
    if (!user) {
        login();
        return;
    }
    
    try {
        const { data } = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/create-checkout-session`, 
            { pack_id: packId }, 
            { withCredentials: true }
        );
        window.location.href = data.url;
    } catch (error) {
        console.error(error);
        toast.error("Failed to start checkout");
    }
  };

  return (
    <div className="py-20 px-4 max-w-7xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Choose Your Fuel</h1>
      <p className="text-muted-foreground mb-12">One-time payments. No recurring fees. Credits never expire.</p>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Starter */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <div className="flex items-baseline justify-center gap-1 my-4">
                <span className="text-3xl font-bold">₹500</span>
            </div>
            <div className="bg-secondary/50 rounded-full py-1 px-3 text-sm font-medium mb-6 inline-block">
                50 Credits
            </div>
            
            <ul className="space-y-3 text-left mb-8 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Standard Generation</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Commercial Usage</li>
            </ul>
            
            <Button className="w-full rounded-full" variant="outline" onClick={() => handleSubscribe('pack_starter')}>
                Get Started
            </Button>
        </div>

        {/* Pro */}
        <div className="bg-white border-2 border-primary/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all relative overflow-hidden transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="flex items-baseline justify-center gap-1 my-4">
                <span className="text-4xl font-bold">₹2,500</span>
            </div>
            <div className="bg-primary/10 text-primary rounded-full py-1 px-3 text-sm font-bold mb-6 inline-block">
                300 Credits
            </div>
            
            <ul className="space-y-3 text-left mb-8 text-sm">
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary" /> <strong>Best Value</strong> per credit</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary" /> Priority Generation</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary" /> Early Access to features</li>
            </ul>
            
            <Button className="w-full rounded-full" onClick={() => handleSubscribe('pack_pro')}>
                Get Pro
            </Button>
        </div>

        {/* Agency */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Agency</h3>
            <div className="flex items-baseline justify-center gap-1 my-4">
                <span className="text-3xl font-bold">₹5,000</span>
            </div>
            <div className="bg-purple-100 text-purple-700 rounded-full py-1 px-3 text-sm font-medium mb-6 inline-block">
                700 Credits
            </div>
            
            <ul className="space-y-3 text-left mb-8 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Massive Volume</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Bulk Download</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Priority Support</li>
            </ul>
            
            <Button className="w-full rounded-full" variant="outline" onClick={() => handleSubscribe('pack_agency')}>
                Get Agency
            </Button>
        </div>
      </div>
    </div>
  );
}
