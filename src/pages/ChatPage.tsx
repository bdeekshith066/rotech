import ChatInterface from '@/components/ChatInterface';
import LocationPrompt from '@/components/LocationPrompt';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, Heart, Info, ShoppingBag } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ModeConfig {
  name: string;
  color: string;
  icon: React.ReactNode;
  systemPrompt: string;
}

const ChatPage = () => {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('en-IN');

  const modeConfigs: Record<string, ModeConfig> = {
    religious: {
      name: "Religious Companion",
      color: "#8B5CF6",
      icon: <Book className="h-8 w-8" />,
      systemPrompt: "You are a religious companion for elderly users. Respond with compassion, wisdom, and respect for all beliefs. Focus on providing religious teachings, stories, and spiritual guidance when asked. Avoid political commentary and respect the user's faith tradition. Keep responses concise and easy to understand for senior citizens."
    },
    wellness: {
      name: "Wellness Guide",
      color: "#34D399",
      icon: <Heart className="h-8 w-8" />,
      systemPrompt: "You are a wellness guide for elderly users. Provide gentle, practical health advice, focusing on exercises suitable for seniors, nutrition guidance, and mental wellbeing tips. Never give specific medical diagnoses or replace professional medical advice. Keep responses concise and easy to understand for senior citizens."
    },
    information: {
      name: "Information Assistant",
      color: "#3B82F6",
      icon: <Info className="h-8 w-8" />,
      systemPrompt: "You are an information assistant for elderly users. Provide clear, factual, and helpful information about government schemes, local resources, technology usage, and general knowledge. Avoid complex jargon and explain concepts in simple terms. Keep responses concise and easy to understand for senior citizens."
    },
    shopping: {
      name: "Shopping Helper",
      color: "#F97316",
      icon: <ShoppingBag className="h-8 w-8" />,
      systemPrompt: "You are a shopping assistant for elderly users. Help them navigate online shopping platforms, place orders for food, groceries, and other essentials. When the user wants to place an order, ask for their location or address. Keep responses concise and easy to understand for senior citizens."
    }
  };

  const currentMode = mode && modeConfigs[mode] ? modeConfigs[mode] : modeConfigs.information;

  const handleLocationRequest = () => {
    setShowLocationPrompt(true);
  };

  const handleLocationConfirm = (address: string, coordinates?: { latitude: number; longitude: number }) => {
    setLocation(address);
    setShowLocationPrompt(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: `${currentMode.color}10` }}>
        {/* Back + Title */}
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-12 w-12 md:h-15 md:w-15" />
          </Button>

          <div className="flex items-center">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-white mr-3"
              style={{ backgroundColor: currentMode.color }}
            >
              {currentMode.icon}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{currentMode.name}</h1>
          </div>
        </div>

        {/* Location and Language Selector */}
        <div className="flex flex-col items-end gap-2">
          {location && (
            <div className="text-lg text-muted-foreground hidden md:block">
              <span>Location: {location}</span>
            </div>
          )}
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="border rounded p-2 text-base"
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">Hindi (हिन्दी)</option>
            <option value="bn-IN">Bengali (বাংলা)</option>
            <option value="ta-IN">Tamil (தமிழ்)</option>
            <option value="te-IN">Telugu (తెలుగు)</option>
            <option value="mr-IN">Marathi (मराठी)</option>
            <option value="gu-IN">Gujarati (ગુજરાતી)</option>
            <option value="ml-IN">Malayalam (മലയാളം)</option>
            <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="ur-IN">Urdu (اُردُو)</option>
          </select>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ChatInterface 
          mode={currentMode} 
          onLocationRequest={mode === 'shopping' ? handleLocationRequest : undefined}
          selectedLang={selectedLang}
        />
      </main>

      <LocationPrompt 
        isOpen={showLocationPrompt}
        onClose={() => setShowLocationPrompt(false)}
        onConfirm={handleLocationConfirm}
      />
    </div>
  );
};

export default ChatPage;
