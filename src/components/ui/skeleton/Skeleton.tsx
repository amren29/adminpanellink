import React from "react";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    variant = "text",
    width,
    height,
    animation = "pulse",
}) => {
    const variantClasses = {
        text: "rounded h-4",
        circular: "rounded-full",
        rectangular: "",
        rounded: "rounded-lg",
    };

    const animationClasses = {
        pulse: "animate-pulse",
        wave: "animate-shimmer",
        none: "",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height) style.height = typeof height === "number" ? `${height}px` : height;

    return (
        <div
            className={`bg-gray-200 dark:bg-gray-700 ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
};

// Preset skeleton components
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                variant="text"
                width={i === lines - 1 ? "75%" : "100%"}
            />
        ))}
    </div>
);

export const SkeletonCard: React.FC = () => (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
        <Skeleton variant="rounded" height={120} className="w-full" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
        <div className="flex gap-2 pt-2">
            <Skeleton variant="rounded" width={60} height={28} />
            <Skeleton variant="rounded" width={60} height={28} />
        </div>
    </div>
);

export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
    <tr>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-4 py-3">
                <Skeleton variant="text" width={i === 0 ? "80%" : "60%"} />
            </td>
        ))}
    </tr>
);

export const SkeletonAvatar: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
    const sizes = { sm: 32, md: 40, lg: 56 };
    return <Skeleton variant="circular" width={sizes[size]} height={sizes[size]} />;
};

export default Skeleton;
