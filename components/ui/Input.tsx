
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            <div className="mt-1">
                <input
                    id={id}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    {...props}
                />
            </div>
        </div>
    );
};

export default Input;
