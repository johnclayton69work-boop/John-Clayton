import React, { useState } from 'react';
import { generateMusicComponent } from '../services/geminiService';
import Spinner from './common/Spinner';
import { MusicGenerationType } from '../types';

const MusicLab: React.FC = () => {
    const [generationType, setGenerationType] = useState<MusicGenerationType>('Description');
    const [genre, setGenre] = useState('Lofi');
    const [mood, setMood] = useState('Relaxing');
    const [instruments, setInstruments] = useState('Piano, soft drums, vinyl crackle');
    const [duration, setDuration] = useState('2 minutes');
    const [key, setKey] = useState('C Major');
    const [tempo, setTempo] = useState('85');
    const [lyricTheme, setLyricTheme] = useState('a rainy day in the city');
    const [musicIdea, setMusicIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const genres = ['Lofi', 'Cinematic', 'Electronic', 'Acoustic', 'Ambient', 'Orchestral', 'Hip Hop'];
    const moods = ['Relaxing', 'Uplifting', 'Intense', 'Melancholic', 'Happy', 'Epic', 'Mysterious'];
    const durations = ['30 seconds', '1 minute', '2 minutes', '3 minutes', '5 minutes'];
    const musicalKeys = [
        'C Major', 'A minor', 'G Major', 'E minor', 'D Major', 'B minor',
        'A Major', 'F# minor', 'E Major', 'C# minor', 'B Major', 'G# minor',
        'F# Major', 'D# minor', 'C# Major', 'A# minor', 'F Major', 'D minor',
        'Bb Major', 'G minor', 'Eb Major', 'C minor', 'Ab Major', 'F minor',
        'Db Major', 'Bb minor', 'Gb Major', 'Eb minor', 'Cb Major', 'Ab minor',
    ];

    const handleGenerate = async () => {
        if ((generationType === 'Lyrics' && !lyricTheme.trim()) || !instruments.trim()) return;
        setIsLoading(true);
        setError(null);
        setMusicIdea('');

        try {
            const result = await generateMusicComponent(generationType, genre, mood, instruments, duration, lyricTheme, key, tempo);
            setMusicIdea(result);
        } catch (e) {
            setError('An unexpected error occurred while generating the music idea.');
            console.error(e);
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">AI Music Composer</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Your creative partner for musical ideas. Generate descriptions, chord progressions, melodies, and lyrics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">1. What do you want to generate?</label>
                        <div className="flex flex-wrap gap-2">
                            {(['Description', 'Chords', 'Melody', 'Lyrics'] as MusicGenerationType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setGenerationType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${generationType === type ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark hover:bg-gray-300'}`}
                                >
                                    {type === 'Chords' ? 'Chord Progressions' : type === 'Melody' ? 'Melody Ideas' : type === 'Lyrics' ? 'Lyrical Ideas' : 'Full Description'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {generationType === 'Lyrics' && (
                        <div>
                            <label htmlFor="lyric-theme" className="block text-sm font-medium mb-1">Lyrical Theme</label>
                            <input
                                id="lyric-theme"
                                type="text"
                                value={lyricTheme}
                                onChange={(e) => setLyricTheme(e.target.value)}
                                placeholder="e.g., Overcoming a challenge"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
                            />
                        </div>
                    )}

                    <div>
                        <p className="block text-sm font-medium mb-2">2. Set the Vibe</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="genre" className="block text-sm font-medium mb-1">Genre</label>
                                <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none">
                                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="mood" className="block text-sm font-medium mb-1">Mood</label>
                                <select id="mood" value={mood} onChange={(e) => setMood(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none">
                                    {moods.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="key" className="block text-sm font-medium mb-1">Musical Key</label>
                                <select id="key" value={key} onChange={(e) => setKey(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none">
                                    {musicalKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tempo" className="block text-sm font-medium mb-1">Tempo (BPM)</label>
                                <input
                                    id="tempo"
                                    type="number"
                                    value={tempo}
                                    onChange={(e) => setTempo(e.target.value)}
                                    placeholder="e.g., 120"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
                                />
                            </div>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="duration" className="block text-sm font-medium mb-1">Approx. Duration</label>
                        <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none">
                            {durations.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="instruments" className="block text-sm font-medium mb-1">Key Instruments</label>
                        <textarea
                            id="instruments"
                            value={instruments}
                            onChange={(e) => setInstruments(e.target.value)}
                            placeholder="e.g., Electric guitar, bass, energetic drums"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-transparent"
                            rows={3}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !instruments.trim() || (generationType === 'Lyrics' && !lyricTheme.trim())}
                        className="w-full p-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Generate Music Idea'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                {/* Display */}
                <div className="bg-gray-50 dark:bg-dark rounded-lg p-4 h-[70vh] overflow-y-auto border dark:border-gray-700">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Spinner />
                        </div>
                    ) : musicIdea ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{musicIdea}</pre>
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500 text-center">Your generated music ideas will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MusicLab;