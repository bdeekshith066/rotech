
import ModeCard from '@/components/ModeCard';
import { Book, Heart, Info, ShoppingBag } from 'lucide-react';

const Index = () => {
  const modes = [
    {
      title: "Religious Companion",
      description: "Engage in religious discussions, learn spiritual teachings, and find comfort in faith.",
      icon: <Book className="h-10 w-10" />,
      color: "#8B5CF6", // Purple
      route: "/chat/religious"
    },
    {
      title: "Wellness Guide",
      description: "Get guidance on health, exercise, diet, and general wellbeing tailored for seniors.",
      icon: <Heart className="h-10 w-10" />,
      color: "#34D399", // Green
      route: "/chat/wellness"
    },
    {
      title: "Information Assistant",
      description: "Find answers to your questions about government schemes, local resources, and more.",
      icon: <Info className="h-10 w-10" />,
      color: "#3B82F6", // Blue
      route: "/chat/information"
    },
    {
      title: "Shopping Helper",
      description: "Get assistance with ordering food, groceries, or other items from online services.",
      icon: <ShoppingBag className="h-10 w-10" />,
      color: "#F97316", // Orange
      route: "/chat/shopping"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-10">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-sahayak-blue to-sahayak-purple bg-clip-text text-transparent">
          Sahayak
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground">
          An AI-Powered Companion for Senior Citizens
        </p>
      </header>

      <main className="flex-grow flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl mb-8 text-center">
          How can I assist you today?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {modes.map((mode) => (
            <ModeCard
              key={mode.title}
              title={mode.title}
              description={mode.description}
              icon={mode.icon}
              color={mode.color}
              route={mode.route}
            />
          ))}
        </div>
      </main>

      <footer className="mt-12 text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} Sahayak - Wisdom Buddy</p>
      </footer>
    </div>
  );
};

export default Index;
