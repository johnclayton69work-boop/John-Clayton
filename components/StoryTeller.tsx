
import React, { useState } from 'react';
import { generateStory } from '../services/geminiService';
import Spinner from './common/Spinner';

const StoryTeller: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [genre, setGenre] = useState('Fantasy');
    const [tone, setTone] = useState('Adventurous');
    const [story, setStory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const genres = ['Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Horror', 'Adventure', 'Comedy'];
    const tones = ['Adventurous', 'Humorous', 'Dramatic', 'Whimsical', 'Suspenseful', 'Heartwarming', 'Dark'];

    const storyIdeas = [
        {
            title: 'Lost Astronaut',
            prompt: 'An astronaut wakes up on a mysterious, jungle-covered planet with no memory of how they got there. Their only companion is a strange, four-legged creature that seems to understand them.',
            genre: 'Science Fiction',
            tone: 'Suspenseful',
        },
        {
            title: 'Magic Cafe',
            prompt: 'In a cozy, hidden cafe, the barista serves coffee that grants temporary magical abilities. A down-on-their-luck musician orders a latte and gets the ability to play any instrument perfectly, but only for one hour.',
            genre: 'Fantasy',
            tone: 'Whimsical',
        },
        {
            title: 'Talking Dog Detective',
            prompt: 'A cynical, hard-boiled detective solves crimes with the help of his new partner: a cheerful, talking golden retriever who is surprisingly good at sniffing out clues.',
            genre: 'Mystery',
            tone: 'Humorous',
        },
    ];

    const handleExampleClick = (idea: { prompt: string; genre: string; tone: string; }) => {
        setPrompt(idea.prompt);
        setGenre(idea.genre);
        setTone(idea.tone);
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setStory('');

        try {
            const result = await generateStory(prompt, genre, tone);
            setStory(result);
        } catch (e) {
            setError('An unexpected error occurred while telling the story.');
            console.error(e);
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Story Teller</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium mb-1">Your Story Idea</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A young wizard who is afraid of heights."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-transparent"
                            rows={6}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="genre" className="block text-sm font-medium mb-1">Genre</label>
                            <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none">
                                {genres.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tone" className="block text-sm font-medium mb-1">Tone</label>
                            <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none">
                                {tones.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Need inspiration? Try one of these!</label>
                        <div className="flex flex-wrap gap-2">
                            {storyIdeas.map((idea) => (
                                <button
                                    key={idea.title}
                                    onClick={() => handleExampleClick(idea)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-dark dark:text-gray-300 dark:hover:bg-dark-light transition-colors"
                                >
                                    {idea.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full p-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Generate Story'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                {/* Display */}
                <div className="bg-gray-50 dark:bg-dark rounded-lg p-4 h-[60vh] overflow-y-auto border dark:border-gray-700">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Spinner />
                        </div>
                    ) : story ? (
                        <p className="whitespace-pre-wrap text-base leading-relaxed">{story}</p>
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500 text-center">Your generated story will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryTeller;