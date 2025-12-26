import React from "react";
import { Modal, ModalBody } from "./index"; // Import ModalBody
import Button from "@/components/ui/button/Button";

interface ActionConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger' | 'warning';
    showCancelButton?: boolean;
}

const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    icon,
    variant = 'default',
    showCancelButton = true,
}) => {
    const getStyling = () => {
        switch (variant) {
            case 'danger':
                return {
                    iconBg: 'bg-red-50 dark:bg-red-900/20',
                    iconColor: '#EF4444',
                    buttonClass: 'bg-red-600 hover:bg-red-700 text-white shadow-sm ring-1 ring-red-500/20',
                    defaultIcon: (
                        <svg className="w-8 h-8 text-error-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 9V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 17.01L12.01 16.9989" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                    )
                };
            case 'warning':
                return {
                    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
                    iconColor: '#F59E0B',
                    buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm ring-1 ring-orange-500/20',
                    defaultIcon: (
                        <svg className="w-8 h-8 text-warning-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 9V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 17.01L12.01 16.9989" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                    )
                };
            default:
                return {
                    iconBg: 'bg-green-50 dark:bg-green-900/20',
                    iconColor: '#10B981',
                    buttonClass: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm ring-1 ring-brand-500/20',
                    defaultIcon: (
                        <svg className="w-8 h-8 text-success-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.8 8.4L9.64286 15.6L7.2 13.1429" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                    )
                };
        }
    };

    const styles = getStyling();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[400px] overflow-visible" // Fixed width for nice alert feel
            showCloseButton={true}
        >
            <ModalBody className="p-8 text-center flex flex-col items-center">
                {/* Icon Wrapper */}
                <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full ${styles.iconBg} ring-4 ring-white dark:ring-gray-900 shadow-md transform -mt-12`}>
                    {/* -mt-12 allows icon to "float" above if we wanted, but here let's keep it simple or slightly overlapped? 
                        Let's keep inside but nice. Removed negative margin for now unless I want that effect. 
                        Let's stick to standard internal layout for now, no negative margin hack.
                    */}
                    {icon || styles.defaultIcon}
                </div>

                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h3>

                <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400 max-w-[280px]">
                    {description}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full">
                    {showCancelButton && (
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="w-full justify-center h-11"
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        className={`w-full justify-center h-11 ${styles.buttonClass} ${!showCancelButton ? 'col-span-2' : ''}`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default ActionConfirmationModal;
