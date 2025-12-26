"use client";
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import Spinner from '@/components/ui/spinner/Spinner';
import { UserRole } from '@/lib/permissions';

interface CommentUser {
    id: string;
    name: string;
    workflowRole?: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: CommentUser;
}

interface OrderCommentsProps {
    orderId: string;
}

export const OrderComments: React.FC<OrderCommentsProps> = ({ orderId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState("");

    // To scroll to bottom
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/orders/${orderId}/comments`);
            const data = await res.json();
            if (data.success) {
                setComments(data.comments);
                // Scroll to bottom after load
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Failed to load comments:", error);
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [orderId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });
            const data = await res.json();

            if (data.success) {
                setComments([...comments, data.comment]);
                setNewComment("");
                setTimeout(scrollToBottom, 50);
            } else {
                toast.error(data.error || "Failed to post comment");
            }
        } catch (error) {
            console.error("Post comment error:", error);
            toast.error("Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    // Format date nicely
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Group comments by date? For now, just simple list.

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Order Comments
                </h3>
                <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {comments.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spinner size="sm" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-gray-400 my-10 text-sm">
                        <p>No comments yet.</p>
                        <p>Start the conversation!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center text-brand-600 text-xs font-bold ring-2 ring-white dark:ring-gray-800">
                                {comment.user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                        {comment.user?.name}
                                    </span>
                                    {comment.user?.workflowRole && (
                                        <span className="text-[10px] uppercase font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">
                                            {comment.user.workflowRole}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-gray-400 ml-auto">
                                        {formatDate(comment.createdAt)} • {formatTime(comment.createdAt)}
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-tr-lg rounded-bl-lg rounded-br-lg p-3 shadow-sm text-sm text-gray-700 dark:text-gray-300">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type a comment..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-shadow text-sm"
                        disabled={submitting}
                    />
                    <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
