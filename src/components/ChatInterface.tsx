import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  mode: {
    name: string;
    color: string;
    systemPrompt: string;
  };
  onLocationRequest?: () => void;
  selectedLang: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const ChatInterface = ({ mode, onLocationRequest, selectedLang }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage = {
      text: `Hello! I'm your ${mode.name} assistant. How can I help you today?`,
      isUser: false,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);

    const storedApiKey = localStorage.getItem('geminiApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      const defaultApiKey = 'AIzaSyD5j3fIDPEsCtJcD0N7HQvkviuQZbXlquM';
      localStorage.setItem('geminiApiKey', defaultApiKey);
      setApiKey(defaultApiKey);
    }
  }, [mode.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening, selectedLang]);

  const speakResponse = async (text: string) => {
    const synth = window.speechSynthesis;
  
    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
  
      const preferredVoice =
        voices.find(v => v.lang === selectedLang) ||
        voices.find(v => v.lang.startsWith(selectedLang.split('-')[0])) ||
        voices.find(v => v.name.includes("Google")) ||
        voices[0];
  
      if (preferredVoice) utterance.voice = preferredVoice;
  
      utterance.rate = 0.9;
      utterance.pitch = 1;
  
      synth.cancel();
      synth.speak(utterance);
    };
  
    try {
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = speakNow;
        synth.getVoices(); // Trigger loading
      } else {
        speakNow();
      }
  
      // fallback: if no voices or synth fails
      setTimeout(async () => {
        if (!synth.speaking) {
          console.warn("TTS failed — falling back to gTTS");
          const langCode = selectedLang.split('-')[0];
          const res = await fetch("http://localhost:5000/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lang: langCode }),
          });
  
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
          } else {
            console.error("gTTS API failed");
          }
        }
      }, 1500); // wait for 1.5s to see if browser voice worksss
    } catch (err) {
      console.error("Speech error:", err);
    }
  };
  
  

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    const langCode = targetLang.split('-')[0];
    const supported = ['hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'zh'];
    if (!supported.includes(langCode)) return text;


    try {
      const res = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: langCode,
          format: 'text',
        }),
      });
      const data = await res.json();
      return data.translatedText;
    } catch (err) {
      console.error('Translation failed:', err);
      return text;
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (mode.name === "Shopping Helper" && (input.toLowerCase().includes("order") || input.toLowerCase().includes("buy") || input.toLowerCase().includes("purchase"))) {
      if (onLocationRequest) onLocationRequest();
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: mode.systemPrompt + "\n\nUser: " + input }]
            }
          ],
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        })
      });

      const data = await response.json();
      let responseText = "Sorry, I encountered an error. Please try again later.";

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        responseText = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        console.error('API Error:', data.error);
        responseText = `Error: ${data.error.message || 'Unknown error occurred'}`;

        if (data.error.status === 'INVALID_ARGUMENT' || data.error.status === 'PERMISSION_DENIED') {
          const newKey = prompt("Your API key seems invalid. Please enter a valid Gemini API Key:");
          if (newKey) {
            localStorage.setItem('geminiApiKey', newKey);
            setApiKey(newKey);
            toast.info("API key updated. Please try your question again.");
          }
        }
      }

      const translatedText = await translateText(responseText, selectedLang);
      const assistantMessage = {
        text: translatedText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      speakResponse(translatedText);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, I encountered an error. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-4 ${message.isUser ? `bg-primary text-white` : 'bg-muted'}`} style={message.isUser ? {} : { backgroundColor: `${mode.color}20` }}>
                <p className="text-2xl">{message.text}</p>
                <div className={`text-sm mt-2 ${message.isUser ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl p-4 bg-muted">
                <div className="flex space-x-2">
                  <div className="w-4 h-4 rounded-full bg-muted-foreground animate-pulse"></div>
                  <div className="w-4 h-4 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-4 h-4 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`rounded-full w-16 h-16 ${isListening ? 'bg-red-100' : ''}`}
          onClick={toggleListening}
        >
          {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="text-2xl p-6 rounded-full h-16"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full w-16 h-16"
          style={{ backgroundColor: mode.color }}
        >
          <Send className="h-8 w-8" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;