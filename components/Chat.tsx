
import React, { useState, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { generateText, analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Spinner from './common/Spinner';
import Icon from './common/Icon';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(scrollToBottom, [messages]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !image) return;

        setIsLoading(true);
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            ...(image && { image: image.preview }),
        };
        setMessages((prev) => [...prev, userMessage]);

        let responseText = '';
        try {
            if (image) {
                const base64Image = await fileToBase64(image.file);
                responseText = await analyzeImage(input, base64Image, image.file.type);
            } else {
                responseText = await generateText(input, useThinkingMode);
            }
        } catch (error) {
            responseText = 'An error occurred. Please try again.';
            console.error(error);
        }

        const modelMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
        };

        setMessages((prev) => [...prev, modelMessage]);
        setInput('');
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Chat & Analyze</h2>
            <div className="flex items-center justify-center mb-4 space-x-2">
                <span className={`font-medium ${!useThinkingMode ? 'text-primary' : ''}`}>Fast Mode</span>
                <label htmlFor="thinking-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="thinking-toggle" className="sr-only peer" checked={useThinkingMode} onChange={() => setUseThinkingMode(!useThinkingMode)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
                <span className={`font-medium ${useThinkingMode ? 'text-primary' : ''}`}>Deep Thought</span>
            </div>

            <div className="h-[60vh] overflow-y-auto mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-dark">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white"><Icon name="robot" className="h-5 w-5" /></div>}
                        <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-light text-gray-800 dark:text-gray-200'}`}>
                            {msg.image && <img src={msg.image} alt="user upload" className="rounded-md mb-2 max-h-48" />}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3 my-4">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white"><Icon name="robot" className="h-5 w-5" /></div>
                        <div className="p-3 rounded-lg bg-gray-200 dark:bg-dark-light">
                           <Spinner size="sm" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Icon name="upload" className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

                {image && <img src={image.preview} alt="preview" className="h-10 w-10 rounded-md object-cover" />}

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message or upload an image..."
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-transparent resize-none"
                    rows={1}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <button type="submit" disabled={isLoading || (!input.trim() && !image)} className="p-2 bg-primary text-white rounded-full hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    <Icon name="send" className="h-6 w-6" />
                </button>
            </form>
        </div>
    );
};

export default Chat;
