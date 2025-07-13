import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BookOpenIcon, LoaderIcon, AlertTriangleIcon } from './icons';

const API_KEY = process.env.API_KEY;

const StoryGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [story, setStory] = useState('');
    const [storyTitle, setStoryTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateStory = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt for the story.');
            return;
        }
        if (!API_KEY) {
            setError('API key is not configured. Please contact the administrator.');
            return;
        }

        setIsLoading(true);
        setStory('');
        setError('');
        setStoryTitle(prompt);

        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: "You are a creative storyteller for children. Generate a short, fun, and imaginative story based on the user's prompt. The story should be easy to read and have a positive message.",
                },
            });

            setStory(response.text);

        } catch (e: any) {
            console.error('Error generating story:', e);
            setError('Failed to generate story. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerateStory();
        }
    };
    
    const storyParagraphs = story.split('\n').filter(p => p.trim() !== '');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">AI Story Generator</h2>
                <p className="text-gray-500 dark:text-gray-400">Let your imagination run wild! Create a unique story with the help of AI.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="story-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            What should the story be about?
                        </label>
                        <textarea
                            id="story-prompt"
                            rows={3}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="e.g., A talking squirrel who wants to fly to the moon"
                            disabled={isLoading}
                        />
                         <p className="text-xs text-gray-400 mt-1">Press Enter to generate or click the button.</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerateStory}
                            disabled={isLoading || !prompt.trim()}
                            className="inline-flex items-center gap-2 bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-sky-300 dark:disabled:bg-sky-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <LoaderIcon className="w-5 h-5 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                'Generate Story'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-md min-h-[300px] flex flex-col ${story && !isLoading && !error ? 'justify-start items-start' : 'justify-center items-center'} transition-all duration-300`}>
                {isLoading ? (
                     <div className="text-center text-gray-500 animate-fade-in">
                        <LoaderIcon className="w-12 h-12 animate-spin mx-auto text-sky-500" />
                        <p className="mt-4 font-semibold">Our AI storyteller is thinking...</p>
                        <p className="text-sm">This may take a moment.</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 animate-fade-in">
                        <AlertTriangleIcon className="w-12 h-12 mx-auto" />
                        <p className="mt-4 font-bold">An Error Occurred</p>
                        <p className="text-sm">{error}</p>
                    </div>
                ) : story ? (
                     <div className="w-full text-left animate-fade-in">
                        <h3 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-6 pb-3 border-b-2 border-sky-100 dark:border-sky-900 font-serif">
                            {storyTitle}
                        </h3>
                        <div className="text-gray-700 dark:text-gray-300 space-y-4 text-base md:text-lg">
                            {storyParagraphs.map((paragraph, index) => (
                                <p key={index} className="animate-fade-in leading-relaxed" style={{ animationDelay: `${index * 150}ms` }}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 dark:text-gray-500 animate-fade-in">
                         <BookOpenIcon className="w-16 h-16 mx-auto" />
                        <p className="mt-4 font-semibold text-lg">What adventure shall we create today?</p>
                        <p>Enter a prompt above and let the magic begin!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoryGenerator;