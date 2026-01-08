import React, { useState, useRef, useEffect } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { ChatInterface } from './components/ChatInterface';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateStoryFromImage, generateSpeech } from './services/geminiService';
import { BookOpen, RefreshCw, Volume2, StopCircle, Mic } from 'lucide-react';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [story, setStory] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000
    });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const handleImageSelected = async (base64: string, type: string) => {
    setImage(base64);
    setMimeType(type);
    setStory(''); // Reset story
    setAudioBuffer(null);
    setIsGenerating(true);

    try {
      const generatedStory = await generateStoryFromImage(base64, type);
      setStory(generatedStory);
    } catch (err) {
      setStory("Sorry, I was unable to read the stars for this image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReadAloud = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!story) return;

    // If we already have the buffer, just play it
    if (audioBuffer) {
      playBuffer(audioBuffer);
      return;
    }

    // Otherwise generate it
    try {
      // Show some loading state on the button?
      // For now just assume fast enough or user waits
      const buffer = await generateSpeech(story);
      if (buffer) {
        setAudioBuffer(buffer);
        playBuffer(buffer);
      }
    } catch (e) {
      console.error("Failed to play audio", e);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    
    sourceNodeRef.current = source;
    source.start();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleReset = () => {
    stopAudio();
    setImage(null);
    setStory('');
    setAudioBuffer(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Muse</h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Powered by Gemini
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* If no image, show upload only */}
        {!image ? (
          <div className="max-w-2xl mx-auto mt-12 fade-in">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Spark your creativity</h2>
              <p className="text-lg text-gray-600">Upload an image and let AI analyze the atmosphere to write the perfect opening for your next story.</p>
            </div>
            <ImageUpload onImageSelected={handleImageSelected} />
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Instant Analysis</h3>
                <p className="text-sm text-gray-500">Advanced vision models detect mood, lighting, and hidden details.</p>
              </div>
              <div className="p-4">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Expressive Voice</h3>
                <p className="text-sm text-gray-500">Listen to your story narrated by a lifelike AI voice.</p>
              </div>
               <div className="p-4">
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-2">Co-Author Chat</h3>
                <p className="text-sm text-gray-500">Collaborate with the AI to continue the plot.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Editor Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
            
            {/* Left Column: Visuals & Controls (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="relative group rounded-2xl overflow-hidden shadow-lg aspect-[4/3] bg-gray-200">
                <img src={image} alt="Inspiration" className="w-full h-full object-cover" />
                <button 
                  onClick={handleReset}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Upload new image"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

               {/* Chat Interface (Fills remaining height) */}
               <div className="flex-1 min-h-[300px]">
                 <ChatInterface initialContext={story} />
               </div>
            </div>

            {/* Right Column: Story (8 cols) */}
            <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
              
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                 <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                   Story Draft
                 </h2>
                 <div className="flex gap-2">
                   <button 
                    onClick={handleReadAloud}
                    disabled={isGenerating || !story}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${isPlaying 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                   >
                     {isPlaying ? (
                       <><StopCircle className="w-4 h-4" /> Stop Reading</>
                     ) : (
                       <><Volume2 className="w-4 h-4" /> Read Aloud</>
                     )}
                   </button>
                 </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto bg-white relative">
                 {isGenerating ? (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                     <LoadingSpinner />
                     <p className="animate-pulse font-medium">Analyzing scene & composing...</p>
                   </div>
                 ) : (
                   <div className="prose prose-lg max-w-none">
                     <p className="font-serif text-gray-800 leading-relaxed text-xl whitespace-pre-wrap">
                       {story}
                     </p>
                     
                     {story && (
                       <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                         <p className="text-sm text-gray-400 italic">
                           Generated by Gemini 3 Pro
                         </p>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
