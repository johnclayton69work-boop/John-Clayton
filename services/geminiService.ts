

import { GoogleGenAI, Modality } from "@google/genai";
import { VideoAspectRatio, ImageAspectRatio, PrebuiltVoice, MusicGenerationType } from "../types";
import type { VideosOperation } from "@google/genai";

const getGenAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateText = async (prompt: string, useThinkingMode: boolean): Promise<string> => {
  try {
    const ai = getGenAI();
    const model = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config = useThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const ai = getGenAI();
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
};

export const analyzeVideoPrompt = async (prompt: string): Promise<string> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Analyze the following video description and provide key information: "${prompt}"`,
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing video prompt:", error);
        throw error;
    }
};

export const generateImage = async (prompt: string, aspectRatio: ImageAspectRatio): Promise<string | null> => {
    try {
        const ai = getGenAI();
        // Incorporate the aspect ratio into the prompt as gemini-2.5-flash-image doesn't have a specific config for it.
        const fullPrompt = `${prompt}, aspect ratio ${aspectRatio}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: fullPrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string | null> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error editing image:", error);
        throw error;
    }
};

const pollAndGetVideoUrl = async (operation: VideosOperation): Promise<{ videoUrl: string; finalOperation: VideosOperation }> => {
    const ai = getGenAI();
    let currentOperation = operation;
    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
    }

    if(currentOperation.error) {
        throw new Error(`Video operation failed: ${currentOperation.error.message}`);
    }

    const downloadLink = currentOperation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video operation completed, but no download link was found.");
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    return { videoUrl, finalOperation: currentOperation };
};


export const generateVideo = async (prompt: string, aspectRatio: VideoAspectRatio, image?: { data: string; mimeType: string }): Promise<{ videoUrl: string; finalOperation: VideosOperation }> => {
    const ai = getGenAI();
    const initialOperation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        ...(image && { image: { imageBytes: image.data, mimeType: image.mimeType } }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio,
        }
    });
    return pollAndGetVideoUrl(initialOperation);
};

export const extendVideo = async (prompt: string, previousVideo: any, aspectRatio: VideoAspectRatio): Promise<{ videoUrl: string; finalOperation: VideosOperation }> => {
    const ai = getGenAI();
    const initialOperation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        video: previousVideo,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio,
        }
    });
    return pollAndGetVideoUrl(initialOperation);
};


export const generateSpeech = async (text: string, voice: PrebuiltVoice): Promise<string | null> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
};

export const generateScript = async (prompt: string, format: string): Promise<string> => {
  try {
    const ai = getGenAI();
    const fullPrompt = `You are a professional scriptwriter. Your task is to write a ${format} based on the following prompt. Make sure to use standard industry formatting for the chosen type.\n\nPrompt: "${prompt}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};

export const generateStory = async (prompt: string, genre: string, tone: string): Promise<string> => {
  try {
    const ai = getGenAI();
    const fullPrompt = `You are a creative and engaging storyteller. Your task is to write a ${tone} ${genre} story based on the following prompt.\n\nPrompt: "${prompt}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateMusicComponent = async (
  type: MusicGenerationType,
  genre: string,
  mood: string,
  instruments: string,
  duration: string,
  lyricTheme: string,
  key: string,
  tempo: string
): Promise<string> => {
  try {
    const ai = getGenAI();
    
    const context = `The user is looking for ideas for a track with the following characteristics:
- Genre: ${genre}
- Mood: ${mood}
- Key: ${key}
- Tempo: ${tempo} BPM
- Instruments: ${instruments}
- Approximate Duration: ${duration}`;

    let userPrompt = '';
    switch (type) {
      case 'Description':
        userPrompt = `${context}\n\nDescribe the track's structure (e.g., intro, verse, chorus, bridge, outro), instrumentation, melody, harmony, and rhythm. Provide a rich, evocative description that would inspire a human composer. Do not generate actual audio or links to audio. Only provide the text description.`;
        break;
      case 'Chords':
        userPrompt = `${context}\n\nBased on these characteristics, generate 3-4 interesting and suitable chord progressions. Provide them in a clear format (e.g., I - V - vi - IV or C - G - Am - F). Briefly explain why each progression fits the mood and key.`;
        break;
      case 'Melody':
        userPrompt = `${context}\n\nDescribe a simple, memorable melody idea for the main hook or verse. You can describe it in terms of note relationships (e.g., "starts on the root, leaps up a fifth, then walks down the scale") or general contour and feeling (e.g., "a soaring, optimistic phrase with a syncopated rhythm"). Do not use musical notation.`;
        break;
      case 'Lyrics':
        userPrompt = `${context}\n\nThe theme for the song is: "${lyricTheme}".\n\nBased on all this information, write a creative and fitting first verse and a chorus for the song.`;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
       config: {
        systemInstruction: "You are an expert AI music composer and collaborator. Your task is to generate creative musical ideas in text format.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating music component:", error);
    throw error;
  }
};