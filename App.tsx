
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Chat from './components/Chat';
import ImageStudio from './components/ImageStudio';
import VideoHub from './components/VideoHub';
import VoiceLab from './components/VoiceLab';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import ScriptWriter from './components/ScriptWriter';
import StoryTeller from './components/StoryTeller';
import MusicLab from './components/MusicLab';
import { Tool } from './types';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'chat':
        return <Chat />;
      case 'image':
        return <ImageStudio />;
      case 'video':
        return <VideoHub />;
      case 'voice':
        return <VoiceLab />;
      case 'thumbnail':
        return <ThumbnailGenerator />;
      case 'script':
        return <ScriptWriter />;
      case 'story':
        return <StoryTeller />;
      case 'music':
        return <MusicLab />;
      default:
        return <Chat />;
    }
  };

  return (
    <div className="min-h-screen bg-light dark:bg-secondary text-gray-800 dark:text-gray-200 font-sans">
      <Header activeTool={activeTool} setActiveTool={setActiveTool} theme={theme} toggleTheme={toggleTheme} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {renderTool()}
        </div>
      </main>
    </div>
  );
};

export default App;