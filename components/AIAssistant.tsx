
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAIResponse } from '../services/geminiService';
import { RobotIcon, CloseIcon, SendIcon } from './icons';
import Button from './ui/Button';

interface Message {
    text: string;
    sender: 'user' | 'ai';
}

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || !user) return;

        const userMessage: Message = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getAIResponse(input, user);
            const aiMessage: Message = { text: aiResponse, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { text: 'Sorry, I encountered an error.', sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                aria-label="Open AI Assistant"
            >
                <RobotIcon className="h-8 w-8" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col z-50">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <RobotIcon className="h-6 w-6 text-primary-500" />
                    <h2 className="text-lg font-semibold">AI HR Assistant</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    <CloseIcon className="h-6 w-6" />
                </button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Ask me anything..."
                        className="flex-1 bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} isLoading={isLoading} disabled={!input.trim()}>
                        <SendIcon className="h-5 w-5" />
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default AIAssistant;
