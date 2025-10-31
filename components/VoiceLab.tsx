
import React, { useState, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { PrebuiltVoice } from '../types';

const VoiceLab: React.FC = () => {
    const [text, setText] = useState('Hello! I am a friendly AI assistant from Google. How can I help you today?');
    const [voice, setVoice] = useState<PrebuiltVoice>('Kore');
    const [isLoading, setIsLoading] = useState(false);
    const [audioData, setAudioData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);

    const availableVoices: PrebuiltVoice[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

    const handleGenerate = async () => {
        if (!text) return;
        setIsLoading(true);
        setError(null);
        setAudioData(null);
        try {
            const result = await generateSpeech(text, voice);
            if (result) {
                setAudioData(result);
            } else {
                setError('Failed to generate speech.');
            }
        } catch (e) {
            setError('An unexpected error occurred during speech generation.');
            console.error(e);
        }
        setIsLoading(false);
    };

    const handlePlay = async () => {
        if (!audioData) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        
        try {
            const decodedBytes = decode(audioData);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
        } catch (e) {
            setError('Failed to play audio.');
            console.error(e);
        }
    };

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Voice Lab</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Select a pre-trained voice model and enter text to generate speech.
            </p>
            <div className="space-y-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-transparent"
                    rows={6}
                />
                
                <div>
                    <label htmlFor="voice-select" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Voice Model
                    </label>
                    <select
                        id="voice-select"
                        value={voice}
                        onChange={(e) => setVoice(e.target.value as PrebuiltVoice)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none"
                    >
                        {availableVoices.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !text.trim()}
                    className="w-full p-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                    {isLoading ? <Spinner size="sm" /> : 'Generate Speech'}
                </button>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {audioData && !isLoading && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-dark rounded-lg">
                        <p className="font-medium mb-3">Speech generated successfully!</p>
                        <button
                            onClick={handlePlay}
                            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors"
                        >
                            <Icon name="play" className="h-5 w-5" />
                            <span>Play Audio</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceLab;