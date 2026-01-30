import React from 'react';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Pricing() {
  const { user, login } = useAuth();

  const handleSubscribe = async () => {
    if (!user) {
        login();
        return;
    }
    
    try {
        const { data } = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/create-checkout-session`, 
            {}, 
            { withCredentials: true }
        );
        window.location.href = data.url;
    } catch (error) {
        toast.error("Failed to start checkout");
    }
  };

  return (
    <div className="py-20 px-4 max-w-7xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
      <p className="text-muted-foreground mb-12">Pay as you go. No subscription required.</p>
      
      <div className="max-w-md mx-auto bg-white border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-2xl font-bold mb-2">Creator Pack</h3>
        <div className="text-5xl font-bold my-6">$10</div>
        <p className="text-muted-foreground mb-8">One time payment</p>
        
        <ul className="space-y-4 text-left mb-8 max-w-xs mx-auto">
            <li className="flex items-center gap-2"><div className="bg-green-100 p-1 rounded-full"><Check className="w-4 h-4 text-green-600" /></div> 50 Credits</li>
            <li className="flex items-center gap-2"><div className="bg-green-100 p-1 rounded-full"><Check className="w-4 h-4 text-green-600" /></div> High Resolution Downloads</li>
            <li className="flex items-center gap-2"><div className="bg-green-100 p-1 rounded-full"><Check className="w-4 h-4 text-green-600" /></div> Commercial Usage Rights</li>
        </ul>
        
        <Button size="lg" className="w-full rounded-full h-12 text-lg" onClick={handleSubscribe}>
            Get 50 Credits
        </Button>
      </div>
    </div>
  );
}
