
import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';
import Spinner from './common/Spinner';

const ScriptWriter: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [format, setFormat] = useState('Screenplay (Film/TV)');
    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scriptFormats = ['Screenplay (Film/TV)', 'Stage Play', 'YouTube Video'];

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setScript('');

        try {
            const result = await generateScript(prompt, format);
            setScript(result);
        } catch (e) {
            setError('An unexpected error occurred while writing the script.');
            console.error(e);
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Script Writer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium mb-1">Your Idea</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A detective discovers a secret about their partner while solving a case."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-transparent"
                            rows={8}
                        />
                    </div>
                    <div>
                        <label htmlFor="format" className="block text-sm font-medium mb-1">Script Format</label>
                        <select
                            id="format"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none"
                        >
                            {scriptFormats.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full p-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Generate Script'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                {/* Display */}
                <div className="bg-gray-50 dark:bg-dark rounded-lg p-4 h-[60vh] overflow-y-auto border dark:border-gray-700">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Spinner />
                        </div>
                    ) : script ? (
                        <pre className="whitespace-pre-wrap font-mono text-sm">{script}</pre>
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500 text-center">Your generated script will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScriptWriter;
