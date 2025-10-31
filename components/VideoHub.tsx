
import React, { useState, useEffect, useRef } from 'react';
import { VideoAspectRatio, Scene } from '../types';
import { generateVideo, extendVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { generateVideoThumbnail } from '../utils/videoUtils';
import { getApiErrorMessage, isInvalidApiKeyError } from '../utils/errorUtils';
import Spinner from './common/Spinner';
import Icon from './common/Icon';

type HubMode = 'generate' | 'analyze';

const PROGRESS_STAGES = [
    { progress: 0, message: "Initializing..." },
    { progress: 15, message: "Analyzing prompt..." },
    { progress: 30, message: "Generating keyframes..." },
    { progress: 50, message: "Synthesizing video..." },
    { progress: 80, message: "Upscaling and enhancing..." },
    { progress: 98, message: "Finalizing..." },
];

const ESTIMATED_GENERATION_TIME_SECONDS = 100;
const ESTIMATED_EXTENSION_TIME_SECONDS = 70;

const VideoHub: React.FC = () => {
    const [mode, setMode] = useState<HubMode>('generate');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(PROGRESS_STAGES[0].message);
    const [error, setError] = useState<string | null>(null);
    const [isApiKeyReady, setIsApiKeyReady] = useState(false);
    
    const imageFileInputRef = useRef<HTMLInputElement>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Timeline state
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(ESTIMATED_GENERATION_TIME_SECONDS);
    const [isExtending, setIsExtending] = useState(false);
    const [extensionPrompt, setExtensionPrompt] = useState('');
    
    const isProcessing = isLoading || isExtending;
    const selectedScene = scenes.find(s => s.id === selectedSceneId);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setIsApiKeyReady(true);
            }
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        let progressInterval: ReturnType<typeof setInterval> | undefined;
        if (isProcessing) {
            const duration = isExtending ? ESTIMATED_EXTENSION_TIME_SECONDS : ESTIMATED_GENERATION_TIME_SECONDS;
            setProgress(0); setTimeRemaining(duration); setLoadingMessage(PROGRESS_STAGES[0].message);
            let elapsedTime = 0;
            progressInterval = setInterval(() => {
                elapsedTime += 1;
                const currentProgress = Math.min(99, (elapsedTime / duration) * 100);
                setProgress(currentProgress);
                setTimeRemaining(Math.max(0, duration - elapsedTime));
                const currentStage = PROGRESS_STAGES.slice().reverse().find(stage => currentProgress >= stage.progress);
                if (currentStage) setLoadingMessage(currentStage.message);
                if (elapsedTime >= duration) if (progressInterval) clearInterval(progressInterval);
            }, 1000);
        }
        return () => { if (progressInterval) clearInterval(progressInterval); };
    }, [isProcessing, isExtending]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            setIsApiKeyReady(true);
        } catch (e) {
            setError("Could not open the API key selection dialog.");
        }
    };

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
    };

    const handleRemoveImage = () => {
        setImageFile(null); setImagePreview(null);
        if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    };

    const handleGenerateScene = async () => {
        if (!prompt) return;
        setIsLoading(true); setError(null);
        try {
            let imagePayload;
            if (imageFile) {
                const data = await fileToBase64(imageFile);
                imagePayload = { data, mimeType: imageFile.type };
            }
            const { videoUrl, finalOperation } = await generateVideo(prompt, aspectRatio, imagePayload);
            const thumbnail = await generateVideoThumbnail(videoUrl);
            const newScene: Scene = {
                id: `scene-${Date.now()}`,
                prompt, videoUrl, thumbnail, operation: finalOperation
            };
            setScenes(prev => [...prev, newScene]);
            setSelectedSceneId(newScene.id);
            setPrompt(''); handleRemoveImage();
        } catch (e: any) {
            handleApiError(e);
        }
        setIsLoading(false);
    };
    
    const handleExtendScene = async () => {
        if (!extensionPrompt.trim() || !selectedScene) return;
        setIsExtending(true); setError(null);
        try {
            const previousVideo = selectedScene.operation.response?.generatedVideos?.[0]?.video;
            if (!previousVideo) throw new Error("Could not find video data from the selected scene.");
            
            const { videoUrl: newUrl, finalOperation: newOperation } = await extendVideo(extensionPrompt, previousVideo, aspectRatio);
            const newThumbnail = await generateVideoThumbnail(newUrl);
            
            setScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, videoUrl: newUrl, thumbnail: newThumbnail, operation: newOperation } : s));
            setExtensionPrompt('');
        } catch (e: any) {
            handleApiError(e);
        }
        setIsExtending(false);
    };

    const handleDeleteScene = (idToDelete: string) => {
        setScenes(prev => prev.filter(s => s.id !== idToDelete));
        if (selectedSceneId === idToDelete) {
            setSelectedSceneId(null);
        }
    };

    const handleClearTimeline = () => {
        if (window.confirm('Are you sure you want to delete all scenes from the timeline? This action cannot be undone.')) {
            setScenes([]);
            setSelectedSceneId(null);
        }
    };

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newScenes = [...scenes];
        const draggedItemContent = newScenes.splice(dragItem.current, 1)[0];
        newScenes.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setScenes(newScenes);
    };

    const handleApiError = (e: any) => {
        setError(getApiErrorMessage(e, 'VideoHub'));
        if (isInvalidApiKeyError(e)) {
           setIsApiKeyReady(false);
        }
    };
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Video Hub</h2>
            {/* The rest of your component UI will be refactored to support the timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Controls */}
                <div className="lg:col-span-1 space-y-4">
                     {!isApiKeyReady ? (
                         <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                             <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">API Key Required</h3>
                             <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                 Video generation with Veo requires an API key. Please select one to proceed. See the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">billing documentation</a> for details.
                             </p>
                             <button onClick={handleSelectKey} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover">Select API Key</button>
                         </div>
                     ) : (
                         <>
                            <h3 className="text-lg font-bold">Create New Scene</h3>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A cat playing a tiny piano..." className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" rows={3}/>
                            <div>
                                <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
                                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark">
                                    <option value="16:9">16:9 (Landscape)</option>
                                    <option value="9:16">9:16 (Portrait)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Starting Image (Optional)</label>
                                {imagePreview ? (
                                    <div className="relative w-full group">
                                        <img src={imagePreview} alt="Start frame preview" className="w-full h-auto object-cover rounded-lg shadow-sm" />
                                        <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold" aria-label="Remove image">&#x2715;</button>
                                    </div>
                                ) : (
                                    <button onClick={() => imageFileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-dark">
                                        <Icon name="upload" className="w-6 h-6 text-gray-500" />
                                        <span className="text-xs mt-1">Add Image</span>
                                    </button>
                                )}
                                <input id="video-image-upload" ref={imageFileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                            </div>
                            <button onClick={handleGenerateScene} disabled={isProcessing || !prompt} className="w-full p-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:bg-gray-400 flex justify-center items-center gap-2">
                               {isLoading ? <Spinner size="sm"/> : <Icon name="plus" className="h-5 w-5"/>}
                               {isLoading ? 'Generating...' : 'Add Scene to Timeline'}
                            </button>
                         </>
                     )}
                     {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                {/* Right Panel: Preview & Timeline */}
                <div className="lg:col-span-2 space-y-4">
                     <div className="flex flex-col justify-center items-center bg-gray-100 dark:bg-dark rounded-lg p-4 min-h-[300px]">
                        {isProcessing ? (
                             <div className="text-center w-full max-w-sm p-4">
                                <h3 className="text-xl font-bold">{isExtending ? 'Extending Scene' : 'Generating Scene'}</h3>
                                <p className="mt-2 text-sm text-gray-500 h-10">{loadingMessage}</p>
                                <div className="w-full my-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"><div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}/></div>
                                <p className="text-lg font-mono">{formatTime(timeRemaining)} remaining</p>
                            </div>
                        ) : selectedScene ? (
                             <video key={selectedScene.videoUrl} src={selectedScene.videoUrl} controls autoPlay loop className="max-w-full max-h-80 rounded-lg shadow-lg" />
                        ) : (
                             <p className="text-gray-500">Your video preview will appear here.</p>
                        )}
                     </div>
                     {selectedScene && !isProcessing && (
                         <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            <h3 className="text-lg font-semibold">Extend Selected Scene</h3>
                            <textarea value={extensionPrompt} onChange={(e) => setExtensionPrompt(e.target.value)} placeholder="An alien spaceship appears..." className="w-full p-2 border rounded-lg bg-transparent" rows={2}/>
                            <button onClick={handleExtendScene} disabled={!extensionPrompt.trim()} className="w-full p-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 disabled:bg-gray-400">Extend Scene</button>
                         </div>
                     )}
                     
                    {/* Timeline */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">Timeline</h3>
                            {scenes.length > 0 && (
                                <button
                                    onClick={handleClearTimeline}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                                    aria-label="Clear all scenes from timeline"
                                >
                                    <Icon name="trash" className="h-4 w-4" />
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="bg-gray-100 dark:bg-dark rounded-lg p-2 min-h-[140px] overflow-x-auto flex items-center space-x-3">
                           {scenes.map((scene, index) => (
                               <div
                                 key={scene.id}
                                 role="button"
                                 tabIndex={0}
                                 aria-label={`Select scene ${index + 1} to view and edit`}
                                 aria-pressed={selectedSceneId === scene.id}
                                 className={`relative shrink-0 w-32 h-24 rounded-lg cursor-pointer group shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light dark:focus:ring-offset-dark focus:ring-primary ${selectedSceneId === scene.id ? 'ring-2 ring-primary' : ''}`}
                                 onClick={() => setSelectedSceneId(scene.id)}
                                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSceneId(scene.id); } }}
                                 draggable
                                 onDragStart={() => dragItem.current = index}
                                 onDragEnter={() => dragOverItem.current = index}
                                 onDragEnd={handleDragSort}
                                 onDragOver={(e) => e.preventDefault()}
                               >
                                    <img src={scene.thumbnail} alt={`Scene ${index + 1}`} className="w-full h-full object-cover rounded-lg"/>
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                       <button onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700">
                                            <Icon name="trash" className="h-4 w-4"/>
                                       </button>
                                    </div>
                                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">{index + 1}</span>
                               </div>
                           ))}
                           {scenes.length === 0 && !isProcessing && (
                               <div className="w-full text-center text-sm text-gray-500">Add scenes to build your video timeline.</div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoHub;
