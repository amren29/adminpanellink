"use client";

import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface FileUploaderProps {
    orderId: string;
    fileType: 'proof' | 'print' | 'customer';
    onUploadComplete?: (attachment: UploadedFile) => void;
    maxSizeMB?: number;
    accept?: string;
}

interface UploadedFile {
    id: string;
    name: string;
    url: string;
    fileSize: number;
    mimeType: string;
    fileType: string;
    uploadedAt: string;
}

interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completing' | 'done' | 'error';
}

export default function FileUploader({
    orderId,
    fileType,
    onUploadComplete,
    maxSizeMB = 500,
    accept = '*/*'
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFiles(files);
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFiles = async (files: File[]) => {
        for (const file of files) {
            if (file.size > maxSizeBytes) {
                toast.error(`${file.name} is too large. Maximum size is ${maxSizeMB}MB.`);
                continue;
            }
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        const uploadId = `${file.name}-${Date.now()}`;

        // Add to uploads list
        setUploads(prev => [...prev, {
            fileName: file.name,
            progress: 0,
            status: 'uploading'
        }]);

        try {
            // Step 1: Get presigned URL
            const presignRes = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || 'application/octet-stream',
                    fileType
                })
            });

            if (!presignRes.ok) {
                const error = await presignRes.json();
                throw new Error(error.error || 'Failed to get upload URL');
            }

            const { uploadUrl, fileKey } = await presignRes.json();

            // Step 2: Upload directly to R2 with progress
            await uploadWithProgress(uploadUrl, file, (progress) => {
                setUploads(prev => prev.map(u =>
                    u.fileName === file.name ? { ...u, progress } : u
                ));
            });

            // Step 3: Complete upload (save metadata)
            setUploads(prev => prev.map(u =>
                u.fileName === file.name ? { ...u, status: 'completing', progress: 100 } : u
            ));

            const completeRes = await fetch('/api/upload/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    fileKey,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || 'application/octet-stream',
                    fileType
                })
            });

            if (!completeRes.ok) {
                const errorData = await completeRes.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || 'Failed to complete upload');
            }

            const { attachment } = await completeRes.json();

            // Success
            setUploads(prev => prev.map(u =>
                u.fileName === file.name ? { ...u, status: 'done' } : u
            ));

            toast.success(`${file.name} uploaded successfully`);

            if (onUploadComplete) {
                onUploadComplete(attachment);
            }

            // Remove from list after delay
            setTimeout(() => {
                setUploads(prev => prev.filter(u => u.fileName !== file.name));
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            setUploads(prev => prev.map(u =>
                u.fileName === file.name ? { ...u, status: 'error' } : u
            ));
            toast.error(`Failed to upload ${file.name}`);
        }
    };

    const uploadWithProgress = (
        url: string,
        file: File,
        onProgress: (progress: number) => void
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('PUT', url);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.send(file);
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDragging ? 'bg-brand-100 dark:bg-brand-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <svg className={`w-6 h-6 ${isDragging ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Max file size: {maxSizeMB}MB • {fileType === 'proof' ? 'Artwork proofs' : fileType === 'print' ? 'Print files' : 'Customer files'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Progress */}
            {uploads.length > 0 && (
                <div className="space-y-2">
                    {uploads.map((upload) => (
                        <div
                            key={upload.fileName}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {upload.fileName}
                                    </span>
                                </div>
                                <span className={`text-xs font-medium ${upload.status === 'done'
                                    ? 'text-green-500'
                                    : upload.status === 'error'
                                        ? 'text-red-500'
                                        : 'text-brand-500'
                                    }`}>
                                    {upload.status === 'done' ? '✓ Done' :
                                        upload.status === 'error' ? '✕ Failed' :
                                            upload.status === 'completing' ? 'Saving...' :
                                                `${upload.progress}%`}
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-200 rounded-full ${upload.status === 'done'
                                        ? 'bg-green-500'
                                        : upload.status === 'error'
                                            ? 'bg-red-500'
                                            : 'bg-brand-500'
                                        }`}
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
