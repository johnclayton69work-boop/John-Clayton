export type Tool = 'chat' | 'image' | 'video' | 'voice' | 'thumbnail' | 'script' | 'story' | 'music';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export interface Layer {
  id: string;
  src: string;
  name: string;
  opacity: number;
  isVisible: boolean;
}

export interface Scene {
  id: string;
  prompt: string;
  videoUrl: string;
  thumbnail: string;
  operation: any; // Stores the final operation object for extensions
}

export type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type VideoAspectRatio = "16:9" | "9:16";
export type PrebuiltVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
export type MusicGenerationType = 'Description' | 'Chords' | 'Melody' | 'Lyrics';

// FIX: Removed conflicting 'aistudio' declaration.
// The error message "Subsequent property declarations must have the same type.
// Property 'aistudio' must be of type 'AIStudio'..." indicates that this global
// type is already defined elsewhere in the project. Removing this duplicate
// declaration resolves the conflict.