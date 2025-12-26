import React from "react";

interface EmptyStateProps {
    title: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title }) => {
    return (
        <div className="flex items-center justify-center p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
                {title}
            </p>
        </div>
    );
};

export default EmptyState;
