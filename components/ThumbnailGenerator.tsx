
import React, { useState, useRef, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import { getApiErrorMessage } from '../utils/errorUtils';
import Spinner from './common/Spinner';
import Icon from './common/Icon';

type Template = 'minimalist' | 'bold' | 'gaming' | 'modern' | 'retro' | 'abstract';
type FillType = 'solid' | 'gradient';
type GradientDirection = 'to right' | 'to bottom' | 'to bottom right' | 'to bottom left';

interface ShadowStyle {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

interface CustomTextStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right';
  strokeColor: string;
  strokeWidth: number;
  textTransform?: 'uppercase' | 'none';
  fontStyle?: 'italic' | 'normal';
  backgroundColor?: string;
  padding?: string;
  fillType: FillType;
  color: string;
  gradientColors: [string, string];
  gradientDirection: GradientDirection;
  shadow: ShadowStyle;
}

const FONT_FAMILIES = [
  'Impact, sans-serif',
  'Arial, sans-serif',
  'Verdana, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Anton, sans-serif',
  'Bangers, cursive',
  'Lobster, cursive',
];

const TEMPLATES: Record<Template, { name: string; promptEnhancer: (prompt: string) => string; titleStyle: CustomTextStyle; subtitleStyle: CustomTextStyle }> = {
    minimalist: {
        name: 'Minimalist',
        promptEnhancer: (prompt) => `Clean, minimalist YouTube thumbnail background for a video about "${prompt}". Soft, simple colors, elegant, lots of negative space.`,
        titleStyle: {
            fontFamily: 'Arial, sans-serif', fontSize: '64px', fontWeight: 'bold', letterSpacing: 0, textAlign: 'center', strokeColor: '#FFFFFF', strokeWidth: 2, fontStyle: 'normal', textTransform: 'none',
            fillType: 'solid', color: '#111111', gradientColors: ['#111111', '#555555'], gradientDirection: 'to right',
            shadow: { enabled: false, color: '#00000080', offsetX: 2, offsetY: 2, blur: 4 },
        },
        subtitleStyle: {
             fontFamily: 'Arial, sans-serif', fontSize: '32px', fontWeight: 'normal', letterSpacing: 1, textAlign: 'center', strokeColor: '#FFFFFF', strokeWidth: 1, fontStyle: 'normal', textTransform: 'none',
             fillType: 'solid', color: '#333333', gradientColors: ['#333333', '#666666'], gradientDirection: 'to right',
             shadow: { enabled: false, color: '#00000080', offsetX: 1, offsetY: 1, blur: 2 },
        },
    },
    bold: {
        name: 'Bold & Punchy',
        promptEnhancer: (prompt) => `Bold, high-contrast, eye-catching YouTube thumbnail background for a video about "${prompt}". Vibrant, saturated colors. Dynamic shapes and lines.`,
        titleStyle: {
            fontFamily: 'Impact, sans-serif', fontSize: '80px', fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', strokeColor: '#000000', strokeWidth: 4, textTransform: 'uppercase', fontStyle: 'normal',
            fillType: 'solid', color: '#FFFF00', gradientColors: ['#FFFF00', '#FFD700'], gradientDirection: 'to bottom',
            shadow: { enabled: true, color: '#000000', offsetX: 5, offsetY: 5, blur: 0 },
        },
        subtitleStyle: {
            fontFamily: 'Impact, sans-serif', fontSize: '40px', fontWeight: 'normal', letterSpacing: 2, textAlign: 'center', strokeColor: '#000000', strokeWidth: 0, textTransform: 'uppercase', fontStyle: 'normal', backgroundColor: '#e63946', padding: '5px 10px',
            fillType: 'solid', color: '#FFFFFF', gradientColors: ['#FFFFFF', '#DDDDDD'], gradientDirection: 'to right',
            shadow: { enabled: false, color: '#000000', offsetX: 2, offsetY: 2, blur: 3 },
        },
    },
    gaming: {
        name: 'Gaming',
        promptEnhancer: (prompt) => `Epic, high-energy gaming YouTube thumbnail background for a video about "${prompt}". Neon lights, futuristic elements, dramatic lighting, particle effects.`,
        titleStyle: {
            fontFamily: 'Verdana, sans-serif', fontSize: '72px', fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', strokeColor: '#000000', strokeWidth: 3, fontStyle: 'italic', textTransform: 'none',
            fillType: 'gradient', color: '#00FF00', gradientColors: ['#00FF00', '#00FFFF'], gradientDirection: 'to bottom right',
            shadow: { enabled: true, color: '#000000', offsetX: 0, offsetY: 0, blur: 15 },
        },
        subtitleStyle: {
            fontFamily: 'Verdana, sans-serif', fontSize: '36px', fontWeight: 'normal', letterSpacing: 1, textAlign: 'center', strokeColor: '#000000', strokeWidth: 2, fontStyle: 'normal', textTransform: 'none',
            fillType: 'solid', color: '#FF00FF', gradientColors: ['#FF00FF', '#FF0088'], gradientDirection: 'to right',
            shadow: { enabled: true, color: '#FF00FF', offsetX: 0, offsetY: 0, blur: 10 },
        },
    },
    modern: {
        name: 'Modern & Clean',
        promptEnhancer: (prompt) => `Clean, modern, professional YouTube thumbnail background for a video about "${prompt}". Geometric shapes, sans-serif fonts, a sophisticated color palette.`,
        titleStyle: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '72px',
            fontWeight: 'bold',
            letterSpacing: 1,
            textAlign: 'left',
            strokeColor: '#FFFFFF',
            strokeWidth: 0,
            fontStyle: 'normal',
            textTransform: 'uppercase',
            fillType: 'solid',
            color: '#0A0A0A',
            gradientColors: ['#111111', '#555555'],
            gradientDirection: 'to right',
            shadow: { enabled: true, color: '#00000030', offsetX: 0, offsetY: 4, blur: 10 },
        },
        subtitleStyle: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px',
            fontWeight: 'normal',
            letterSpacing: 2,
            textAlign: 'left',
            strokeColor: '#FFFFFF',
            strokeWidth: 0,
            fontStyle: 'normal',
            textTransform: 'uppercase',
            fillType: 'solid',
            color: '#666666',
            gradientColors: ['#333333', '#666666'],
            gradientDirection: 'to right',
            shadow: { enabled: false, color: '#00000080', offsetX: 1, offsetY: 1, blur: 2 },
        },
    },
    retro: {
        name: 'Retro Wave',
        promptEnhancer: (prompt) => `80s retro, synthwave style YouTube thumbnail background for a video about "${prompt}". Neon grid lines, vibrant pinks and blues, a setting sun over a digital landscape.`,
        titleStyle: {
            fontFamily: 'Bangers, cursive',
            fontSize: '84px',
            fontWeight: 'normal',
            letterSpacing: 2,
            textAlign: 'center',
            strokeColor: '#FF00FF',
            strokeWidth: 3,
            fontStyle: 'normal',
            textTransform: 'none',
            fillType: 'gradient',
            color: '#FFFFFF',
            gradientColors: ['#FFFF00', '#FF8C00'],
            gradientDirection: 'to bottom',
            shadow: { enabled: true, color: '#FF00FF', offsetX: 0, offsetY: 0, blur: 20 },
        },
        subtitleStyle: {
            fontFamily: 'Courier New, monospace',
            fontSize: '40px',
            fontWeight: 'bold',
            letterSpacing: 1,
            textAlign: 'center',
            strokeColor: '#000000',
            strokeWidth: 0,
            fontStyle: 'normal',
            textTransform: 'uppercase',
            fillType: 'solid',
            color: '#00FFFF',
            gradientColors: ['#FFFFFF', '#DDDDDD'],
            gradientDirection: 'to right',
            shadow: { enabled: true, color: '#00FFFF', offsetX: 0, offsetY: 0, blur: 10 },
        },
    },
    abstract: {
        name: 'Abstract Art',
        promptEnhancer: (prompt) => `Abstract, artistic YouTube thumbnail background for a video about "${prompt}". A mix of paint strokes, textures, and fluid shapes. Unconventional color combinations.`,
        titleStyle: {
            fontFamily: 'Lobster, cursive',
            fontSize: '78px',
            fontWeight: 'normal',
            letterSpacing: 0,
            textAlign: 'right',
            strokeColor: '#FFFFFF',
            strokeWidth: 2,
            fontStyle: 'italic',
            textTransform: 'none',
            fillType: 'solid',
            color: '#FFFFFF',
            gradientColors: ['#FFFFFF', '#EEEEEE'],
            gradientDirection: 'to bottom',
            shadow: { enabled: true, color: '#00000080', offsetX: 3, offsetY: 3, blur: 5 },
        },
        subtitleStyle: {
            fontFamily: 'Georgia, serif',
            fontSize: '34px',
            fontWeight: 'normal',
            letterSpacing: 1,
            textAlign: 'right',
            strokeColor: '#000000',
            strokeWidth: 0,
            fontStyle: 'normal',
            textTransform: 'none',
            fillType: 'solid',
            color: '#EFEFEF',
            gradientColors: ['#333333', '#666666'],
            gradientDirection: 'to right',
            shadow: { enabled: false, color: '#00000080', offsetX: 1, offsetY: 1, blur: 2 },
        },
    }
};

const StyleEditor: React.FC<{ styles: CustomTextStyle, setStyles: React.Dispatch<React.SetStateAction<CustomTextStyle>> }> = ({ styles, setStyles }) => {
    const fontSizeValue = parseInt(styles.fontSize, 10) || 64;
    const gradientDirections: { key: GradientDirection, label: string }[] = [
        { key: 'to right', label: '→' },
        { key: 'to bottom', label: '↓' },
        { key: 'to bottom right', label: '↘' },
        { key: 'to bottom left', label: '↙' },
    ];

    return (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-dark rounded-lg border dark:border-gray-700">
            {/* Font */}
            <div className="space-y-2">
                <p className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Font</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1">Family</label>
                        <select value={styles.fontFamily} onChange={e => setStyles(s => ({ ...s, fontFamily: e.target.value }))} className="w-full p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-light">
                            {FONT_FAMILIES.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Weight</label>
                        <select value={styles.fontWeight} onChange={e => setStyles(s => ({ ...s, fontWeight: e.target.value }))} className="w-full p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-light">
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="lighter">Lighter</option>
                            <option value="bolder">Bolder</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-medium mb-1">Style</label>
                        <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
                            {(['normal', 'italic'] as const).map(style => (
                                <button key={style} onClick={() => setStyles(s => ({ ...s, fontStyle: style }))} className={`flex-1 p-1 text-xs capitalize ${styles.fontStyle === style ? 'bg-primary text-white' : 'bg-white dark:bg-dark-light hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                 <div>
                    <label className="block text-xs font-medium mb-1">Size ({fontSizeValue}px)</label>
                    <input type="range" min="16" max="128" step="1" value={fontSizeValue} onChange={e => setStyles(s => ({ ...s, fontSize: `${e.target.value}px` }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Letter Spacing ({styles.letterSpacing}px)</label>
                    <input type="range" min="-5" max="20" step="0.5" value={styles.letterSpacing} onChange={e => setStyles(s => ({ ...s, letterSpacing: Number(e.target.value) }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />
            
            {/* Appearance */}
            <div className="space-y-2">
                 <p className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Appearance</p>
                 <div>
                     <label className="block text-xs font-medium mb-1">Fill Style</label>
                     <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
                        {(['solid', 'gradient'] as const).map(type => (
                            <button key={type} onClick={() => setStyles(s => ({ ...s, fillType: type }))} className={`flex-1 p-1 text-xs capitalize ${styles.fillType === type ? 'bg-primary text-white' : 'bg-white dark:bg-dark-light hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                {type}
                            </button>
                        ))}
                     </div>
                </div>

                {styles.fillType === 'solid' ? (
                    <div>
                        <label className="block text-xs font-medium mb-1">Color</label>
                        <input type="color" value={styles.color} onChange={e => setStyles(s => ({ ...s, color: e.target.value }))} className="w-full h-8 p-0 border-none rounded cursor-pointer" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs font-medium mb-1">Gradient Colors</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="color" value={styles.gradientColors[0]} onChange={e => setStyles(s => ({ ...s, gradientColors: [e.target.value, s.gradientColors[1]] }))} className="w-full h-8 p-0 border-none rounded cursor-pointer" />
                                <input type="color" value={styles.gradientColors[1]} onChange={e => setStyles(s => ({ ...s, gradientColors: [s.gradientColors[0], e.target.value] }))} className="w-full h-8 p-0 border-none rounded cursor-pointer" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-medium mb-1">Direction</label>
                            <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
                                {gradientDirections.map(({ key, label }) => (
                                    <button key={key} onClick={() => setStyles(s => ({ ...s, gradientDirection: key }))} className={`flex-1 p-1 text-lg ${styles.gradientDirection === key ? 'bg-primary text-white' : 'bg-white dark:bg-dark-light hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                 <div>
                    <label className="block text-xs font-medium mb-1">Stroke Color</label>
                    <input type="color" value={styles.strokeColor} onChange={e => setStyles(s => ({ ...s, strokeColor: e.target.value }))} className="w-full h-8 p-0 border-none rounded cursor-pointer" />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Stroke Width ({styles.strokeWidth}px)</label>
                    <input type="range" min="0" max="10" step="1" value={styles.strokeWidth} onChange={e => setStyles(s => ({ ...s, strokeWidth: Number(e.target.value) }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />
            
            {/* Layout */}
             <div className="space-y-2">
                 <p className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Layout & Transform</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1">Alignment</label>
                        <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
                            {(['left', 'center', 'right'] as const).map(align => (
                                <button key={align} onClick={() => setStyles(s => ({ ...s, textAlign: align }))} className={`flex-1 p-1 text-xs capitalize ${styles.textAlign === align ? 'bg-primary text-white' : 'bg-white dark:bg-dark-light hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                    {align}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Transform</label>
                        <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
                            {(['none', 'uppercase'] as const).map(transform => (
                                <button key={transform} onClick={() => setStyles(s => ({ ...s, textTransform: transform }))} className={`flex-1 p-1 text-xs capitalize ${styles.textTransform === transform ? 'bg-primary text-white' : 'bg-white dark:bg-dark-light hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                    {transform === 'none' ? 'Normal' : 'Uppercase'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700" />
            
            {/* Shadow */}
            <div className="space-y-2">
                 <p className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Effects</p>
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium">Shadow</label>
                    <label htmlFor="shadow-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="shadow-toggle" className="sr-only peer" checked={styles.shadow.enabled} onChange={e => setStyles(s => ({...s, shadow: {...s.shadow, enabled: e.target.checked}}))} />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>
                {styles.shadow.enabled && (
                    <div className="space-y-2">
                        <div>
                           <label className="block text-xs font-medium mb-1">Shadow Color</label>
                           <input type="color" value={styles.shadow.color} onChange={e => setStyles(s => ({...s, shadow: {...s.shadow, color: e.target.value}}))} className="w-full h-8 p-0 border-none rounded cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Offset X ({styles.shadow.offsetX}px)</label>
                            <input type="range" min="-20" max="20" step="1" value={styles.shadow.offsetX} onChange={e => setStyles(s => ({...s, shadow: {...s.shadow, offsetX: Number(e.target.value)}}))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium mb-1">Offset Y ({styles.shadow.offsetY}px)</label>
                            <input type="range" min="-20" max="20" step="1" value={styles.shadow.offsetY} onChange={e => setStyles(s => ({...s, shadow: {...s.shadow, offsetY: Number(e.target.value)}}))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Blur ({styles.shadow.blur}px)</label>
                            <input type="range" min="0" max="40" step="1" value={styles.shadow.blur} onChange={e => setStyles(s => ({...s, shadow: {...s.shadow, blur: Number(e.target.value)}}))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ThumbnailGenerator: React.FC = () => {
    const [template, setTemplate] = useState<Template>('bold');
    const [title, setTitle] = useState('My Awesome Video');
    const [subtitle, setSubtitle] = useState('You Won\'t Believe This!');
    const [backgroundPrompt, setBackgroundPrompt] = useState('a surprised cat');
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Overlay State
    const [overlayImage, setOverlayImage] = useState<string | null>(null);
    const [overlaySize, setOverlaySize] = useState(50); // percentage
    const [overlayOpacity, setOverlayOpacity] = useState(1); // 0-1
    const [overlayPositionX, setOverlayPositionX] = useState(50); // percentage
    const [overlayPositionY, setOverlayPositionY] = useState(80); // percentage
    const overlayFileInputRef = useRef<HTMLInputElement>(null);

    // Styling State
    const [activeStyleTab, setActiveStyleTab] = useState<'title' | 'subtitle'>('title');
    const [titleStyles, setTitleStyles] = useState<CustomTextStyle>(TEMPLATES[template].titleStyle);
    const [subtitleStyles, setSubtitleStyles] = useState<CustomTextStyle>(TEMPLATES[template].subtitleStyle);
    
    useEffect(() => {
        const updateScale = () => {
            if (previewRef.current) {
                const width = previewRef.current.offsetWidth;
                setScale(width / 1280);
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    useEffect(() => {
        setTitleStyles(TEMPLATES[template].titleStyle);
        setSubtitleStyles(TEMPLATES[template].subtitleStyle);
    }, [template]);

    const toCssProperties = (styles: CustomTextStyle, scale: number): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            fontFamily: styles.fontFamily,
            fontSize: `${parseInt(styles.fontSize, 10) * scale}px`,
            fontWeight: styles.fontWeight,
            fontStyle: styles.fontStyle,
            textAlign: styles.textAlign,
            textTransform: styles.textTransform,
            letterSpacing: `${styles.letterSpacing * scale}px`,
            backgroundColor: styles.backgroundColor,
            padding: styles.padding,
            WebkitTextStroke: styles.strokeWidth > 0 ? `${styles.strokeWidth * scale}px ${styles.strokeColor}` : 'unset',
            paintOrder: styles.strokeWidth > 0 ? 'stroke fill' : 'unset',
            lineHeight: 1.2,
        };

        if (styles.shadow.enabled) {
          baseStyles.textShadow = `${styles.shadow.offsetX * scale}px ${styles.shadow.offsetY * scale}px ${styles.shadow.blur * scale}px ${styles.shadow.color}`;
        }

        if (styles.fillType === 'gradient') {
            return {
                ...baseStyles,
                backgroundImage: `linear-gradient(${styles.gradientDirection}, ${styles.gradientColors[0]}, ${styles.gradientColors[1]})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
            };
        }

        return {
            ...baseStyles,
            color: styles.color,
        };
    };

    const handleGenerateBackground = async () => {
        if (!backgroundPrompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const fullPrompt = TEMPLATES[template].promptEnhancer(backgroundPrompt);
            const result = await generateImage(fullPrompt, '16:9');
            if (result) {
                setBackgroundImage(result);
            } else {
                setError('Failed to generate background. The model did not return any content. Please try a different prompt.');
            }
        } catch (e: any) {
            setError(getApiErrorMessage(e, 'ThumbnailGenerator'));
        }
        setIsLoading(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setImageFunc: (url: string) => void) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImageFunc(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const downloadThumbnail = () => {
        if (!backgroundImage) return;

        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = backgroundImage;
        
        bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

            const finalizeAndDownload = () => {
                const drawText = (text: string, styles: CustomTextStyle, defaultYPercent: number) => {
                    ctx.font = `${styles.fontStyle || 'normal'} ${styles.fontWeight || 'normal'} ${styles.fontSize} ${styles.fontFamily}`;
                    ctx.letterSpacing = `${styles.letterSpacing}px`;
                    ctx.textAlign = styles.textAlign;
                    ctx.textBaseline = 'middle';
                    ctx.strokeStyle = styles.strokeColor;
                    ctx.lineWidth = styles.strokeWidth;
                    ctx.lineJoin = 'round';
                    
                    if (styles.shadow.enabled) {
                        ctx.shadowColor = styles.shadow.color;
                        ctx.shadowOffsetX = styles.shadow.offsetX;
                        ctx.shadowOffsetY = styles.shadow.offsetY;
                        ctx.shadowBlur = styles.shadow.blur;
                    }

                    const textToDraw = styles.textTransform === 'uppercase' ? text.toUpperCase() : text;
                    const maxWidth = canvas.width * 0.9;
                    
                    let xPos: number;
                    if (styles.textAlign === 'left') xPos = canvas.width * 0.05;
                    else if (styles.textAlign === 'right') xPos = canvas.width * 0.95;
                    else xPos = canvas.width / 2;
                    
                    // Word wrapping logic
                    const words = textToDraw.split(' ');
                    let line = '';
                    const lines = [];
                    const lineHeight = parseInt(styles.fontSize, 10) * 1.2;

                    for (let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + ' ';
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth && n > 0) {
                            lines.push(line.trim());
                            line = words[n] + ' ';
                        } else {
                            line = testLine;
                        }
                    }
                    lines.push(line.trim());

                    // Revised vertical centering logic
                    const totalTextHeight = lines.length * lineHeight;
                    const blockTopY = (canvas.height * defaultYPercent) - (totalTextHeight / 2);

                    lines.forEach((l, index) => {
                        const currentLineY = blockTopY + (lineHeight / 2) + (index * lineHeight);
                        const trimmedLine = l;
                        
                        let fillStyle: string | CanvasGradient;
                        if (styles.fillType === 'gradient') {
                            const metrics = ctx.measureText(trimmedLine);
                            const textWidth = metrics.width;
                            const textHeight = lineHeight;
                            
                            let x0 = xPos, y0 = currentLineY, x1 = xPos, y1 = currentLineY;
                            
                            const left = styles.textAlign === 'center' ? xPos - textWidth / 2 : styles.textAlign === 'right' ? xPos - textWidth : xPos;
                            const right = styles.textAlign === 'center' ? xPos + textWidth / 2 : styles.textAlign === 'right' ? xPos : xPos + textWidth;
                            const top = currentLineY - textHeight / 2;
                            const bottom = currentLineY + textHeight / 2;

                            switch (styles.gradientDirection) {
                                case 'to right':
                                    x0 = left; x1 = right;
                                    break;
                                case 'to bottom':
                                    y0 = top; y1 = bottom;
                                    break;
                                case 'to bottom right':
                                    x0 = left; y0 = top;
                                    x1 = right; y1 = bottom;
                                    break;
                                case 'to bottom left':
                                    x0 = right; y0 = top;
                                    x1 = left; y1 = bottom;
                                    break;
                            }
                             const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
                             gradient.addColorStop(0, styles.gradientColors[0]);
                             gradient.addColorStop(1, styles.gradientColors[1]);
                             fillStyle = gradient;
                        } else {
                            fillStyle = styles.color;
                        }
                        ctx.fillStyle = fillStyle;
                        
                        if (styles.strokeWidth > 0) ctx.strokeText(trimmedLine, xPos, currentLineY);
                        ctx.fillText(trimmedLine, xPos, currentLineY);
                    });
                    
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.letterSpacing = '0px';
                };

                drawText(title, titleStyles, 0.45);
                drawText(subtitle, subtitleStyles, 0.65);

                const link = document.createElement('a');
                link.download = 'youtube-thumbnail.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            };

            if (overlayImage) {
                const overlay = new Image();
                overlay.crossOrigin = 'anonymous';
                overlay.src = overlayImage;
                overlay.onload = () => {
                    const overlayWidth = canvas.width * (overlaySize / 100);
                    const overlayHeight = overlayWidth * (overlay.height / overlay.width);
                    const x = (canvas.width * (overlayPositionX / 100)) - (overlayWidth / 2);
                    const y = (canvas.height * (overlayPositionY / 100)) - (overlayHeight / 2);
                    
                    ctx.globalAlpha = overlayOpacity;
                    ctx.drawImage(overlay, x, y, overlayWidth, overlayHeight);
                    ctx.globalAlpha = 1.0;
                    
                    finalizeAndDownload();
                };
            } else {
                finalizeAndDownload();
            }
        };
    };

    return (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">YouTube Thumbnail Generator</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">1. Choose a Template</label>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(TEMPLATES) as Template[]).map(key => (
                                <button key={key} onClick={() => setTemplate(key)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${template === key ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark hover:bg-gray-300'}`}>
                                    {TEMPLATES[key].name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">2. Enter Text</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Main Title" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent mb-2" />
                        <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle (optional)" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">3. Customize Text Style</label>
                         <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button onClick={() => setActiveStyleTab('title')} className={`px-4 py-2 font-medium text-sm ${activeStyleTab === 'title' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Title</button>
                            <button onClick={() => setActiveStyleTab('subtitle')} className={`px-4 py-2 font-medium text-sm ${activeStyleTab === 'subtitle' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Subtitle</button>
                        </div>
                        {activeStyleTab === 'title' ? <StyleEditor styles={titleStyles} setStyles={setTitleStyles} /> : <StyleEditor styles={subtitleStyles} setStyles={setSubtitleStyles} />}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">4. Set Background</label>
                        <div className="flex gap-2">
                             <input type="text" value={backgroundPrompt} onChange={e => setBackgroundPrompt(e.target.value)} placeholder="Describe background..." className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                             <button onClick={handleGenerateBackground} disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:bg-gray-400 flex items-center justify-center">
                                {isLoading ? <Spinner size="sm" /> : 'Generate'}
                             </button>
                        </div>
                         <div className="text-center my-2 text-sm text-gray-500">OR</div>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark">
                            <Icon name="upload" className="h-5 w-5 mr-2" /> Upload Background
                        </button>
                        <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, setBackgroundImage)} accept="image/*" className="hidden" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">5. Add Overlay (Optional)</label>
                         <button onClick={() => overlayFileInputRef.current?.click()} className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark">
                            <Icon name="upload" className="h-5 w-5 mr-2" /> Upload Overlay Image
                        </button>
                        <input type="file" ref={overlayFileInputRef} onChange={(e) => handleFileUpload(e, setOverlayImage)} accept="image/*" className="hidden" />
                        
                        {overlayImage && (
                            <div className="mt-4 space-y-3 p-3 bg-gray-50 dark:bg-dark rounded-lg border dark:border-gray-700">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Size ({overlaySize}%)</label>
                                    <input type="range" min="5" max="150" value={overlaySize} onChange={e => setOverlaySize(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                                </div>
                                 <div>
                                    <label className="block text-xs font-medium mb-1">Opacity ({Math.round(overlayOpacity * 100)}%)</label>
                                    <input type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={e => setOverlayOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Horizontal Position ({overlayPositionX}%)</label>
                                    <input type="range" min="0" max="100" value={overlayPositionX} onChange={e => setOverlayPositionX(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Vertical Position ({overlayPositionY}%)</label>
                                    <input type="range" min="0" max="100" value={overlayPositionY} onChange={e => setOverlayPositionY(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                                </div>
                                <button onClick={() => setOverlayImage(null)} className="w-full p-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600">
                                    Remove Overlay
                                </button>
                            </div>
                        )}
                    </div>
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                {/* Preview */}
                <div className="space-y-4">
                    <div id="thumbnail-preview" ref={previewRef} className="relative w-full aspect-video bg-gray-200 dark:bg-dark rounded-lg overflow-hidden flex items-center justify-center select-none">
                        {backgroundImage ? (
                            <img src={backgroundImage} alt="Thumbnail background" className="absolute top-0 left-0 w-full h-full object-cover" />
                        ) : (
                           <p className="text-gray-500 z-10">Generate or upload a background</p>
                        )}
                        {overlayImage && (
                            <img 
                                src={overlayImage} 
                                alt="Overlay" 
                                className="absolute"
                                style={{
                                    left: `${overlayPositionX}%`,
                                    top: `${overlayPositionY}%`,
                                    width: `${overlaySize}%`,
                                    opacity: overlayOpacity,
                                    transform: 'translate(-50%, -50%)',
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                        <div 
                            className="absolute" 
                            style={{ 
                                top: '45%', 
                                left: '5%',
                                width: '90%',
                                transform: 'translateY(-50%)', 
                                pointerEvents: 'none'
                            }}
                        >
                            <div style={toCssProperties(titleStyles, scale)}>{title}</div>
                        </div>
                        <div 
                            className="absolute" 
                            style={{
                                top: '65%', 
                                left: '5%',
                                width: '90%',
                                transform: 'translateY(-50%)', 
                                pointerEvents: 'none'
                            }}
                        >
                            <div style={toCssProperties(subtitleStyles, scale)}>{subtitle}</div>
                        </div>
                    </div>
                     <button onClick={downloadThumbnail} disabled={!backgroundImage} className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Download Thumbnail
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThumbnailGenerator;
