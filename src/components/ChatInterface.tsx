import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from '@/components/ChatInterface';
import LocationPrompt from '@/components/LocationPrompt';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, Heart, Info, ShoppingBag } from 'lucide-react';

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
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const stored = localStorage.getItem('preferredLang');
    if (stored) setLanguage(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('preferredLang', language);
  }, [language]);

  const modeConfigs: Record<string, ModeConfig> = {
    religious: {
      name: "Religious Companion",
      color: "#8B5CF6",
      icon: <Book className="h-8 w-8" />,
      systemPrompt: "You are a religious companion..."
    },
    wellness: {
      name: "Wellness Guide",
      color: "#34D399",
      icon: <Heart className="h-8 w-8" />,
      systemPrompt: "You are a wellness guide..."
    },
    information: {
      name: "Information Assistant",
      color: "#3B82F6",
      icon: <Info className="h-8 w-8" />,
      systemPrompt: "You are an information assistant..."
    },
    shopping: {
      name: "Shopping Helper",
      color: "#F97316",
      icon: <ShoppingBag className="h-8 w-8" />,
      systemPrompt: "You are a shopping assistant..."
    }
  };

  const currentMode = mode && modeConfigs[mode] ? modeConfigs[mode] : modeConfigs.information;

  const handleLocationRequest = () => setShowLocationPrompt(true);

  const handleLocationConfirm = (address: string) => {
    setLocation(address);
    setShowLocationPrompt(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center p-4 border-b" style={{ backgroundColor: `${currentMode.color}10` }}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft className="h-12 w-12" />
        </Button>
        <div className="flex items-center justify-center flex-grow">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white mr-3" style={{ backgroundColor: currentMode.color }}>
            {currentMode.icon}
          </div>
          <h1 className="text-3xl font-bold">{currentMode.name}</h1>
        </div>
        {location && (
          <div className="ml-auto text-lg text-muted-foreground hidden md:block">
            Location: {location}
          </div>
        )}
      </header>

      <main className="flex-grow overflow-hidden">
        <ChatInterface
          mode={currentMode}
          onLocationRequest={mode === 'shopping' ? handleLocationRequest : undefined}
          selectedLanguage={language}
          onLanguageChange={setLanguage}
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
