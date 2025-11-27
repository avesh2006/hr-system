
import { User } from '../types';

const API_BASE_URL = '/api';

export const getAIResponse = async (prompt: string, user: User): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, user }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `AI service error: ${response.status}`);
        }

        const data = await response.json();
        return data.response || "I am sorry, I couldn't generate a response.";

    } catch (error: any) {
        console.error("Error calling backend AI service:", error);
         if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
             return 'Could not connect to the backend AI service. Please ensure the server is running.';
        }
        return `An error occurred while communicating with the AI: ${error.message}. Please try again later.`;
    }
};
