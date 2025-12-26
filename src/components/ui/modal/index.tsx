"use client";
import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/icons/index"; // Assuming CloseIcon exists or I can use the SVG if not

// --- Subcomponents ---

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  description?: string;
  onClose?: () => void;
  actions?: React.ReactNode; // New prop for header actions
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = "", description, onClose, actions }) => {
  return (
    <div className={`px-6 py-5 border-b border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="text-lg font-semibold text-gray-900 dark:text-white leading-6">
            {children}
          </div>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-6 ${className}`}>
      {children}
    </div>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = "" }) => {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
};

// --- Main Modal Component ---

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // For animation state

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Animation on Open/Close
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      // Small delay to allow exit animation to play logic would go here if we were unmounting
      // But since we return null below on !isOpen, we need to handle delay-unmount.
      // For simplicity/robustness without heavy libs, we'll just toggle visibility immediately 
      // OR implement a delay. existing code returned null immediately. 
      // To add exit animations, we need to keep it mounted for a bit. 
      // For now, let's just animate IN. Animate OUT requires changing 'if (!isOpen) return null' logic.
      setIsVisible(false);
      const timer = setTimeout(() => {
        document.body.style.overflow = "unset";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);


  if (!mounted) return null;

  // We need to render if it's open OR if it's closing (handling with simple null for now to match interface, 
  // maybe improve later. Re-adding !isOpen return null for safety until complex animation logic added)
  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "fixed inset-0 w-full h-full bg-white dark:bg-gray-900 overflow-y-auto"
    : `relative w-full rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 ${className || 'max-w-lg'}`;

  const animationClasses = `transition-all duration-300 ease-out transform ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
    }`;

  const backdropClasses = `fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
    }`;

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto modal-container" style={{ zIndex: 999999 }}>
      {/* Backdrop */}
      <div
        className={backdropClasses}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Position Wrapper */}
      <div className={`flex min-h-full ${isFullscreen ? '' : 'items-center justify-center p-4'}`}>
        <div
          ref={modalRef}
          className={`${contentClasses} ${animationClasses}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Legacy Close Button (if showCloseButton is true and NOT using header close) */}
          {/* We'll keep this but position it absolutely. If using ModalHeader, you might want to disable this or rely on Header's close */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-50 p-2 text-gray-500 bg-white/80 dark:bg-black/80 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all shadow-sm backdrop-blur-sm"
              aria-label="Close modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
