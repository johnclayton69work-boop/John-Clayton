
import React from 'react';
import { Tool } from '../types';
import Icon from './common/Icon';

interface HeaderProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTool, setActiveTool, theme, toggleTheme }) => {
  const navItems: { id: Tool; name: string; icon: React.ReactNode }[] = [
    { id: 'chat', name: 'Chat & Analyze', icon: <Icon name="chat" className="h-5 w-5" /> },
    { id: 'image', name: 'Image Studio', icon: <Icon name="image" className="h-5 w-5" /> },
    { id: 'video', name: 'Video Hub', icon: <Icon name="video" className="h-5 w-5" /> },
    { id: 'voice', name: 'Voice Lab', icon: <Icon name="voice" className="h-5 w-5" /> },
    { id: 'thumbnail', name: 'Thumbnail Gen', icon: <Icon name="thumbnail" className="h-5 w-5" /> },
    { id: 'script', name: 'Script Writer', icon: <Icon name="script" className="h-5 w-5" /> },
    { id: 'story', name: 'Story Teller', icon: <Icon name="story" className="h-5 w-5" /> },
    { id: 'music', name: 'Music Lab', icon: <Icon name="music" className="h-5 w-5" /> },
  ];

  return (
    <header className="bg-white dark:bg-dark-light shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
             <Icon name="robot" className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gemini Creative Suite</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <Icon name="moon" className="h-6 w-6" /> : <Icon name="sun" className="h-6 w-6" />}
            </button>
          </div>
        </div>
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id)}
              className={`${
                activeTool === item.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
              } flex items-center space-x-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;