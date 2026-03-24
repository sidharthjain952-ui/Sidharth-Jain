/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { 
  Shirt, 
  Cloud, 
  Calendar, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Sun,
  CloudRain,
  Snowflake,
  ThermometerSun,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const OCCASIONS = [
  { id: 'casual', label: 'Casual', icon: Shirt },
  { id: 'office', label: 'Office', icon: Calendar },
  { id: 'party', label: 'Party', icon: Sparkles },
  { id: 'date', label: 'Date Night', icon: Sparkles },
  { id: 'wedding', label: 'Wedding', icon: Sparkles },
  { id: 'gym', label: 'Gym', icon: ThermometerSun },
];

const WEATHER_OPTIONS = [
  { id: 'sunny', label: 'Sunny', icon: Sun },
  { id: 'rainy', label: 'Rainy', icon: CloudRain },
  { id: 'cold', label: 'Cold', icon: Snowflake },
  { id: 'hot', label: 'Hot', icon: ThermometerSun },
  { id: 'windy', label: 'Windy', icon: Wind },
];

export default function App() {
  const [occasion, setOccasion] = useState('casual');
  const [weather, setWeather] = useState('sunny');
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // 1. Generate Text Recommendation
      const textResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I am going to a ${occasion} event and the weather is ${weather}. 
        Suggest 3 complete outfit ideas for me. 
        Include:
        1. A detailed description of each outfit (top, bottom, shoes, accessories).
        2. Why it works for this occasion and weather.
        3. A "Pro Tip" for each.
        
        At the very end of your response, provide a single line starting with "IMAGE_PROMPT:" followed by a highly descriptive, artistic prompt for an AI image generator to create a high-fashion, professional photograph of the best outfit among these three. Focus on the clothing, lighting, and mood. No people's faces, just the outfit on a mannequin or a stylish flat lay.
        
        Format the output in clean Markdown with headings.`,
        config: {
          systemInstruction: "You are a world-class fashion stylist with an eye for modern trends and practical comfort. Your advice is encouraging, stylish, and tailored to the specific context provided.",
        }
      });

      const fullText = textResponse.text || "";
      const promptMatch = fullText.match(/IMAGE_PROMPT:\s*(.*)/i);
      const imagePrompt = promptMatch ? promptMatch[1] : `A professional fashion photograph of a ${occasion} outfit suitable for ${weather} weather, high-end editorial style, studio lighting.`;
      
      // Clean up the text to remove the prompt line from the user view
      const cleanText = fullText.replace(/IMAGE_PROMPT:.*$/i, "").trim();
      setRecommendation(cleanText);

      // 2. Generate Image
      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: imagePrompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        });

        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            setImageUrl(`data:image/png;base64,${base64Data}`);
            break;
          }
        }
      } catch (imgErr) {
        console.error("Image generation failed:", imgErr);
        // We don't set error here because we still have the text recommendation
      }

    } catch (err) {
      console.error(err);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="border-b border-black/5 px-6 py-8 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-2">StyleAI</h1>
            <p className="text-sm uppercase tracking-widest opacity-50 font-medium">Personal Fashion Consultant</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs font-mono opacity-40 uppercase">v1.0 // Powered by Gemini</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12 grid md:grid-cols-12 gap-12">
        {/* Controls */}
        <div className="md:col-span-4 space-y-10">
          <section>
            <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4 block">Select Occasion</label>
            <div className="grid grid-cols-2 gap-3">
              {OCCASIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setOccasion(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 text-left",
                    occasion === item.id 
                      ? "bg-black text-white border-black shadow-lg scale-[1.02]" 
                      : "bg-white border-black/5 hover:border-black/20"
                  )}
                >
                  <item.icon size={18} className={occasion === item.id ? "opacity-100" : "opacity-40"} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4 block">Current Weather</label>
            <div className="flex flex-wrap gap-3">
              {WEATHER_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setWeather(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300",
                    weather === item.id 
                      ? "bg-black text-white border-black" 
                      : "bg-white border-black/5 hover:border-black/20"
                  )}
                >
                  <item.icon size={16} className={weather === item.id ? "opacity-100" : "opacity-40"} />
                  <span className="font-medium text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={generateRecommendation}
            disabled={isLoading}
            className="w-full bg-black text-white py-6 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-black/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Curating Outfits...
              </>
            ) : (
              <>
                Generate Lookbook
                <ChevronRight size={20} />
              </>
            )}
          </button>

          {error && (
            <p className="text-red-500 text-xs font-medium text-center">{error}</p>
          )}
        </div>

        {/* Results */}
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            {!recommendation && !isLoading ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full min-h-[400px] border-2 border-dashed border-black/5 rounded-[40px] flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6">
                  <Shirt size={32} className="opacity-20" />
                </div>
                <h2 className="text-2xl font-serif italic mb-2">Your style journey starts here</h2>
                <p className="text-sm opacity-40 max-w-xs">Select an occasion and weather to receive personalized outfit recommendations from our AI stylist.</p>
              </motion.div>
            ) : isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-8"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-2 border-black/5 rounded-full animate-pulse" />
                  <Loader2 className="absolute inset-0 m-auto animate-spin opacity-20" size={40} />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-serif italic text-xl">Analyzing trends...</p>
                  <p className="text-xs uppercase tracking-widest opacity-40">Matching fabrics to your context</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-black/5 rounded-[40px] p-8 md:p-12 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-black/5">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="font-serif italic text-2xl">Curated for You</h2>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                      {occasion} • {weather}
                    </p>
                  </div>
                </div>

                {imageUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-10 overflow-hidden rounded-[32px] border border-black/5 shadow-2xl shadow-black/5"
                  >
                    <img 
                      src={imageUrl} 
                      alt="Recommended Outfit" 
                      className="w-full h-auto object-cover aspect-square md:aspect-video"
                      referrerPolicy="no-referrer"
                    />
                    <div className="bg-black/5 px-6 py-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">AI-Generated Visual Concept</p>
                    </div>
                  </motion.div>
                )}

                <div className="markdown-body prose prose-zinc max-w-none prose-headings:font-serif prose-headings:italic prose-h1:text-3xl prose-h2:text-2xl prose-p:text-zinc-600 prose-strong:text-black">
                  <Markdown>{recommendation}</Markdown>
                </div>

                <div className="mt-12 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-[10px] uppercase tracking-widest opacity-30 font-bold italic">Style is a way to say who you are without having to speak.</p>
                  <button 
                    onClick={() => window.print()}
                    className="text-[10px] uppercase tracking-widest font-bold border-b border-black pb-1 hover:opacity-50 transition-opacity"
                  >
                    Print Lookbook
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="mt-20 border-t border-black/5 py-12 px-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-bold">
          © 2026 StyleAI // Crafted with Precision
        </p>
      </footer>
    </div>
  );
}
