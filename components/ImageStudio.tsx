
import React, { useState, useRef } from 'react';
import { ImageAspectRatio, Layer } from '../types';
import { generateImage } from '../services/geminiService';
import { getApiErrorMessage } from '../utils/errorUtils';
import Spinner from './common/Spinner';
import Icon from './common/Icon';

const ImageStudio: React.FC = () => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleGenerateLayer = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateImage(prompt, aspectRatio);
            if (result) {
                const newLayer: Layer = {
                    id: `layer-${Date.now()}`,
                    src: result,
                    name: `Generated: ${prompt.substring(0, 20)}...`,
                    opacity: 1,
                    isVisible: true,
                };
                setLayers(prev => [newLayer, ...prev]);
                setPrompt('');
            } else {
                setError('Failed to generate image. The model did not return any content. Please try again with a different prompt.');
            }
        } catch (e: any) {
            setError(getApiErrorMessage(e, 'ImageStudio'));
        }
        setIsLoading(false);
    };

    const handleUploadLayer = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newLayer: Layer = {
                    id: `layer-${Date.now()}`,
                    src: e.target?.result as string,
                    name: `Uploaded: ${file.name}`,
                    opacity: 1,
                    isVisible: true,
                };
                setLayers(prev => [newLayer, ...prev]);
            };
            reader.readAsDataURL(file);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const updateLayer = (id: string, updates: Partial<Layer>) => {
        setLayers(layers => layers.map(layer => layer.id === id ? { ...layer, ...updates } : layer));
    };

    const deleteLayer = (id: string) => {
        setLayers(layers => layers.filter(layer => layer.id !== id));
    };

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        };
        
        const newLayers = [...layers];
        const draggedItemContent = newLayers.splice(dragItem.current, 1)[0];
        newLayers.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;
        
        setLayers(newLayers);
    };

    const downloadImage = () => {
        const canvas = document.createElement('canvas');
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
        const maxDim = 1024;
        canvas.width = widthRatio >= heightRatio ? maxDim : maxDim * (widthRatio / heightRatio);
        canvas.height = heightRatio > widthRatio ? maxDim : maxDim * (heightRatio / widthRatio);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Could not create canvas context for download.');
            return;
        }

        const visibleLayers = [...layers].reverse().filter(l => l.isVisible);
        if (visibleLayers.length === 0) {
            setError("No visible layers to download.");
            return;
        }

        let loadedCount = 0;

        const finalize = () => {
            const link = document.createElement('a');
            link.download = 'composition.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }

        visibleLayers.forEach(layer => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = layer.src;
            img.onload = () => {
                ctx.globalAlpha = layer.opacity;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                loadedCount++;
                if (loadedCount === visibleLayers.length) {
                   finalize();
                }
            };
            img.onerror = () => {
                loadedCount++;
                console.error(`Failed to load image for layer ${layer.name}`);
                if (loadedCount === visibleLayers.length) {
                   finalize();
                }
            }
        });
    };
    
    const aspectRatios: ImageAspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
    const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Image Studio</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold">Controls</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe an image to generate as a new layer..."
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-transparent"
                        rows={4}
                    />
                    <div>
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium mb-1">Aspect Ratio</label>
                        <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as ImageAspectRatio)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-primary focus:outline-none">
                            {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateLayer}
                        disabled={isLoading || !prompt}
                        className="w-full p-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Generate Layer'}
                    </button>
                    <div className="text-center my-2 text-sm text-gray-500">OR</div>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark">
                        <Icon name="upload" className="h-5 w-5 mr-2" /> Upload Layer
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleUploadLayer} accept="image/*" className="hidden" />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    
                    <hr className="my-4 border-gray-200 dark:border-gray-700"/>

                    <button
                        onClick={downloadImage}
                        disabled={layers.length === 0}
                        className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Download Image
                    </button>
                </div>
                
                {/* Canvas & Layers */}
                <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {/* Canvas */}
                    <div className="xl:col-span-2 flex justify-center items-center bg-gray-100 dark:bg-dark rounded-lg p-2 min-h-[300px]">
                        <div
                            className="relative bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
                            style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}`, width: '100%', maxWidth: '512px' }}
                        >
                            {[...layers].reverse().map(layer => (
                                layer.isVisible && (
                                    <img
                                        key={layer.id}
                                        src={layer.src}
                                        alt={layer.name}
                                        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                                        style={{ opacity: layer.opacity }}
                                    />
                                )
                            ))}
                             {layers.length === 0 && !isLoading && (
                                <div className="flex h-full w-full items-center justify-center text-gray-500">Add a layer to begin</div>
                            )}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <Spinner />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Layers Panel */}
                    <div className="xl:col-span-1 space-y-2">
                        <h3 className="text-lg font-semibold">Layers</h3>
                        <div className="bg-gray-50 dark:bg-dark rounded-lg p-2 h-96 overflow-y-auto space-y-2">
                           {layers.map((layer, index) => (
                                <div
                                    key={layer.id}
                                    className="bg-white dark:bg-dark-light p-2 rounded-lg border dark:border-gray-700 cursor-grab active:cursor-grabbing"
                                    draggable
                                    onDragStart={() => dragItem.current = index}
                                    onDragEnter={() => dragOverItem.current = index}
                                    onDragEnd={handleDragSort}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={layer.src} alt="thumbnail" className="w-10 h-10 object-cover rounded-md bg-gray-200"/>
                                        <p className="text-xs font-medium flex-grow truncate">{layer.name}</p>
                                        <button onClick={() => updateLayer(layer.id, { isVisible: !layer.isVisible })} className="p-1 hover:bg-gray-200 dark:hover:bg-dark rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${layer.isVisible ? '' : 'text-gray-500'}`}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                               {!layer.isVisible && <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />}
                                            </svg>
                                        </button>
                                         <button onClick={() => deleteLayer(layer.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div>
                                        <label htmlFor={`opacity-${layer.id}`} className="block text-xs font-medium mb-1">Opacity ({Math.round(layer.opacity * 100)}%)</label>
                                        <input
                                            id={`opacity-${layer.id}`}
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={layer.opacity}
                                            onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                                        />
                                    </div>
                                </div>
                           ))}
                           {layers.length === 0 && <p className="text-xs text-center text-gray-500 py-4">Your layers will appear here.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageStudio;
