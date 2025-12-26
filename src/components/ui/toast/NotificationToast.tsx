import React from 'react';
import { toast } from 'sonner';

interface NotificationToastProps {
    t: string | number; // Toast ID
    title: string;
    description: string;
    onClose?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ t, title, description, onClose }) => {
    return (
        <div className="flex w-full items-start gap-3 rounded-xl bg-white p-4 shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700 pointer-events-auto">
            {/* Green Check Icon */}
            <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-50 border border-green-100">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
                    {title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
                    {description}
                </p>
            </div>

            {/* Close Button */}
            <button
                onClick={() => {
                    toast.dismiss(t);
                    onClose?.();
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
                aria-label="Close"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
