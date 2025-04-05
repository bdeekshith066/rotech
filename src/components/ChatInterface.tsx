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
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const translateText = async (text: string, targetLang: string, sourceLang = 'auto') => {
  if (targetLang === 'en') return text;
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

const ChatInterface = ({ mode, onLocationRequest, selectedLanguage, onLanguageChange }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [language, setLanguage] = useState(selectedLanguage);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supportedLanguages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'bn', label: 'Bengali' },
    { code: 'te', label: 'Telugu' },
    { code: 'mr', label: 'Marathi' },
    { code: 'ta', label: 'Tamil' },
    { code: 'gu', label: 'Gujarati' },
    { code: 'kn', label: 'Kannada' },
    { code: 'ml', label: 'Malayalam' },
    { code: 'pa', label: 'Punjabi' }
  ];

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
    setLanguage(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    onLanguageChange(language);
  }, [language]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);

    if (isListening) recognition.start();
    return () => recognition.stop();
  }, [isListening, language]);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.lang.startsWith(language));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => setIsListening(!isListening);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { text: input, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (
      mode.name === "Shopping Helper" &&
      (input.toLowerCase().includes("order") || input.toLowerCase().includes("buy") || input.toLowerCase().includes("purchase"))
    ) {
      onLocationRequest?.();
    }

    try {
      const translatedInput = await translateText(input, 'en', language);
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
              parts: [{ text: mode.systemPrompt + "\n\nUser: " + translatedInput }]
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
      let responseText = "Sorry, I encountered an error.";
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        responseText = `Error: ${data.error.message || 'Unknown error'}`;
        if (['INVALID_ARGUMENT', 'PERMISSION_DENIED'].includes(data.error.status)) {
          const newKey = prompt("API key is invalid. Enter new key:");
          if (newKey) {
            localStorage.setItem('geminiApiKey', newKey);
            setApiKey(newKey);
            toast.info("API key updated.");
          }
        }
      }

      const localizedResponse = await translateText(responseText, language, 'en');
      const assistantMessage = { text: localizedResponse, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
      speakResponse(localizedResponse);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "Sorry, an error occurred.", isUser: false, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <label className="font-semibold text-lg">Language: </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="ml-2 p-2 border rounded text-lg"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>

      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-4 ${message.isUser ? 'bg-primary text-white' : 'bg-muted'}`} style={message.isUser ? {} : { backgroundColor: `${mode.color}20` }}>
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
        <Button type="button" variant="outline" size="icon" className={`rounded-full w-16 h-16 ${isListening ? 'bg-red-100' : ''}`} onClick={toggleListening}>
          {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        <Input value={input} onChange={handleInputChange} placeholder="Type your message..." className="text-2xl p-6 rounded-full h-16" />
        <Button type="submit" size="icon" className="rounded-full w-16 h-16" style={{ backgroundColor: mode.color }}>
          <Send className="h-8 w-8" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
