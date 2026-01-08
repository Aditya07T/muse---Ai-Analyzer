export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  id: string;
}

export interface StoryState {
  originalImage: string | null; // Base64
  mimeType: string;
  generatedText: string;
  isGenerating: boolean;
  isPlayingAudio: boolean;
}
