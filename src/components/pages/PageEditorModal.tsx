"use client";
import React, { useState } from "react";
import {
    Page,
    PageBlock,
    BlockType,
    BlockStyle,
    blockTypeLabels,
    pageTypeLabels,
    generateId,
    colorPresets,
    paddingPresets,
    borderRadiusPresets,
    HeroBlockContent,
    FeaturesBlockContent,
    RichTextBlockContent,
    CTABlockContent,
    FAQBlockContent,
    TestimonialsBlockContent,
    GalleryBlockContent
} from "@/data/pagesData";
import { Modal } from "@/components/ui/modal";

interface PageEditorModalProps {
    page: Page;
    isOpen: boolean;
    onClose: () => void;
    onSave: (page: Page) => void;
}

// Block icons for sidebar
const blockIcons: Record<BlockType, React.ReactNode> = {
    hero: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
            <line x1="7" y1="9" x2="17" y2="9" strokeWidth="2" strokeLinecap="round" />
            <line x1="9" y1="13" x2="15" y2="13" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    features: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5" />
        </svg>
    ),
    testimonials: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    richtext: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h10M4 18h6" />
        </svg>
    ),
    gallery: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 15l-5-5L5 21" />
        </svg>
    ),
    cta: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="4" y="8" width="16" height="8" rx="4" strokeWidth="1.5" />
            <path strokeLinecap="round" strokeWidth="1.5" d="M9 12h6" />
        </svg>
    ),
    faq: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

export default function PageEditorModal({ page, isOpen, onClose, onSave }: PageEditorModalProps) {
    const [editedPage, setEditedPage] = useState<Page>(page);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [draggedBlockType, setDraggedBlockType] = useState<BlockType | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleAddBlock = (type: BlockType, atIndex?: number) => {
        const defaultContent = getDefaultBlockContent(type);
        const newBlock: PageBlock = {
            id: `blk-${generateId()}`,
            type,
            content: defaultContent,
            order: atIndex ?? editedPage.blocks.length,
        };

        const newBlocks = [...editedPage.blocks];
        if (atIndex !== undefined) {
            newBlocks.splice(atIndex, 0, newBlock);
        } else {
            newBlocks.push(newBlock);
        }

        setEditedPage(prev => ({
            ...prev,
            blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
            updatedAt: new Date().toISOString()
        }));
        setSelectedBlockId(newBlock.id);
    };

    const handleRemoveBlock = (blockId: string) => {
        setEditedPage(prev => ({
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i })),
            updatedAt: new Date().toISOString()
        }));
        if (selectedBlockId === blockId) setSelectedBlockId(null);
    };

    const handleBlockContentChange = (blockId: string, content: any) => {
        setEditedPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? { ...b, content } : b),
            updatedAt: new Date().toISOString()
        }));
    };

    const handleBlockStyleChange = (blockId: string, style: BlockStyle) => {
        setEditedPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? { ...b, style } : b),
            updatedAt: new Date().toISOString()
        }));
    };

    const handleMoveBlock = (fromIndex: number, toIndex: number) => {
        const newBlocks = [...editedPage.blocks];
        const [removed] = newBlocks.splice(fromIndex, 1);
        newBlocks.splice(toIndex, 0, removed);

        setEditedPage(prev => ({
            ...prev,
            blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
            updatedAt: new Date().toISOString()
        }));
    };

    const handleDragStart = (e: React.DragEvent, type: BlockType) => {
        setDraggedBlockType(type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedBlockType) {
            handleAddBlock(draggedBlockType, index);
        }
        setDraggedBlockType(null);
        setDragOverIndex(null);
    };

    const handleSave = () => {
        onSave(editedPage);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="!max-w-none !rounded-none ml-auto">
            <div className="fixed inset-y-0 right-0 w-[calc(100%-280px)] flex bg-gray-100 dark:bg-gray-900 shadow-2xl">
                {/* Left: Block Palette */}
                <div className="w-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-full">
                            <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        <p className="text-[10px] font-medium text-gray-400 uppercase text-center mb-2">Blocks</p>
                        {(Object.keys(blockIcons) as BlockType[]).map(type => (
                            <div
                                key={type}
                                draggable
                                onDragStart={(e) => handleDragStart(e, type)}
                                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 transition-colors flex flex-col items-center gap-1"
                                title={blockTypeLabels[type]}
                            >
                                <div className="text-gray-500 dark:text-gray-400">
                                    {blockIcons[type]}
                                </div>
                                <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center">
                                    {blockTypeLabels[type].split(' ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center: Live Preview */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={editedPage.title}
                                onChange={(e) => setEditedPage(prev => ({ ...prev, title: e.target.value }))}
                                className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 -ml-2 text-gray-900 dark:text-white"
                                placeholder="Page Title"
                            />
                            <span className={`px-2 py-0.5 rounded-full text-xs ${editedPage.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {editedPage.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setEditedPage(prev => ({ ...prev, status: prev.status === 'published' ? 'draft' : 'published' }))}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${editedPage.status === 'published'
                                    ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                                    : 'bg-green-500 text-white hover:bg-green-600'}`}
                            >
                                {editedPage.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-[600px]">
                            {editedPage.blocks.length === 0 ? (
                                <div
                                    className={`h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors ${dragOverIndex !== null ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                                    onDragOver={(e) => handleDragOver(e, 0)}
                                    onDragLeave={() => setDragOverIndex(null)}
                                    onDrop={(e) => handleDrop(e, 0)}
                                >
                                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">Drag blocks here to build your page</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {editedPage.blocks.map((block, index) => (
                                        <React.Fragment key={block.id}>
                                            {/* Drop Zone Above */}
                                            <div
                                                className={`h-2 transition-all ${dragOverIndex === index ? 'h-16 bg-brand-100 dark:bg-brand-900/30 border-2 border-dashed border-brand-400 rounded-lg mx-4 my-2' : ''}`}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragLeave={() => setDragOverIndex(null)}
                                                onDrop={(e) => handleDrop(e, index)}
                                            />

                                            {/* Block Preview */}
                                            <BlockPreview
                                                block={block}
                                                isSelected={selectedBlockId === block.id}
                                                onClick={() => setSelectedBlockId(block.id)}
                                                onRemove={() => handleRemoveBlock(block.id)}
                                                onChange={(content) => handleBlockContentChange(block.id, content)}
                                            />
                                        </React.Fragment>
                                    ))}
                                    {/* Drop Zone at End */}
                                    <div
                                        className={`h-8 transition-all ${dragOverIndex === editedPage.blocks.length ? 'h-16 bg-brand-100 dark:bg-brand-900/30 border-2 border-dashed border-brand-400 rounded-lg mx-4 my-2' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, editedPage.blocks.length)}
                                        onDragLeave={() => setDragOverIndex(null)}
                                        onDrop={(e) => handleDrop(e, editedPage.blocks.length)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Settings Panel */}
                {selectedBlockId && (
                    <SettingsPanel
                        block={editedPage.blocks.find(b => b.id === selectedBlockId)!}
                        onContentChange={(content) => handleBlockContentChange(selectedBlockId, content)}
                        onStyleChange={(style) => handleBlockStyleChange(selectedBlockId, style)}
                    />
                )}
            </div>
        </Modal>
    );
}

// Visual Block Preview Component
function BlockPreview({ block, isSelected, onClick, onRemove, onChange }: {
    block: PageBlock;
    isSelected: boolean;
    onClick: () => void;
    onRemove: () => void;
    onChange: (content: any) => void;
}) {
    const content = block.content;
    const style = block.style || {};

    // Convert style settings to inline CSS
    const getBlockStyles = (): React.CSSProperties => ({
        backgroundColor: style.backgroundColor || undefined,
        color: style.textColor || undefined,
        paddingTop: style.paddingTop ? paddingPresets[style.paddingTop] : undefined,
        paddingBottom: style.paddingBottom ? paddingPresets[style.paddingBottom] : undefined,
        borderRadius: style.borderRadius ? borderRadiusPresets[style.borderRadius] : undefined,
        textAlign: style.textAlign || undefined,
    });

    const blockStyles = getBlockStyles();
    const accentColor = style.accentColor || '#3b82f6';

    const wrapperClass = `relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'}`;

    switch (block.type) {
        case 'hero':
            const hero = content as HeroBlockContent;
            const heroDefaultBg = !style.backgroundColor ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : undefined;
            return (
                <div className={wrapperClass} onClick={onClick}>
                    <div
                        className="px-8 py-16"
                        style={{
                            ...blockStyles,
                            background: style.backgroundColor || heroDefaultBg,
                            color: style.textColor || '#ffffff',
                            textAlign: style.textAlign || 'center',
                        }}
                    >
                        <h1
                            className="text-3xl font-bold mb-3 outline-none"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onChange({ ...content, title: e.currentTarget.textContent })}
                        >
                            {hero.title || 'Hero Title'}
                        </h1>
                        {hero.subtitle && (
                            <p
                                className="text-lg opacity-90 mb-6 outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => onChange({ ...content, subtitle: e.currentTarget.textContent })}
                            >
                                {hero.subtitle}
                            </p>
                        )}
                        {hero.ctaText && (
                            <button
                                className="px-6 py-3 rounded-lg font-medium"
                                style={{ backgroundColor: accentColor, color: '#ffffff' }}
                            >
                                {hero.ctaText}
                            </button>
                        )}
                    </div>
                    <RemoveButton onRemove={onRemove} />
                </div>
            );

        case 'features':
            const features = content as FeaturesBlockContent;
            return (
                <div className={wrapperClass} onClick={onClick}>
                    <div className="px-8 py-12">
                        {features.title && <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">{features.title}</h2>}
                        <div className={`grid gap-6 ${features.columns === 2 ? 'grid-cols-2' : features.columns === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                            {(features.features?.length > 0 ? features.features : [
                                { title: 'Feature 1', description: 'Description here' },
                                { title: 'Feature 2', description: 'Description here' },
                                { title: 'Feature 3', description: 'Description here' },
                            ]).map((f, i) => (
                                <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg mx-auto mb-3 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">{f.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <RemoveButton onRemove={onRemove} />
                </div>
            );

        case 'richtext':
            const richtext = content as RichTextBlockContent;
            return (
                <div className={wrapperClass} onClick={onClick}>
                    <div
                        className="px-8 py-8 prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: richtext.html || '<p>Click to edit text...</p>' }}
                    />
                    <RemoveButton onRemove={onRemove} />
                </div>
            );

        case 'cta':
            const cta = content as CTABlockContent;
            return (
                <div className={wrapperClass} onClick={onClick}>
                    <div className="bg-gray-900 dark:bg-gray-950 text-white px-8 py-12 text-center">
                        <h2 className="text-2xl font-bold mb-2">{cta.title || 'Call to Action'}</h2>
                        {cta.description && <p className="text-gray-300 mb-6">{cta.description}</p>}
                        <button className="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600">
                            {cta.buttonText || 'Click Here'}
                        </button>
                    </div>
                    <RemoveButton onRemove={onRemove} />
                </div>
            );

        case 'faq':
            const faq = content as FAQBlockContent;
            return (
                <div className={wrapperClass} onClick={onClick}>
                    <div className="px-8 py-12">
                        {faq.title && <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">{faq.title}</h2>}
                        <div className="max-w-2xl mx-auto space-y-4">
                            {(faq.items?.length > 0 ? faq.items : [
                                { question: 'Sample Question 1?', answer: 'Sample answer here...' },
                                { question: 'Sample Question 2?', answer: 'Sample answer here...' },
                            ]).map((item, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 dark:text-white">{item.question}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <RemoveButton onRemove={onRemove} />
                </div>
            );

        default:
            return (
                <div className={wrapperClass} onClick={onClick}>
                    <div className="px-8 py-12 text-center text-gray-400">
                        <p className="font-medium">{blockTypeLabels[block.type]}</p>
                        <p className="text-sm">Click to configure</p>
                    </div>
                    <RemoveButton onRemove={onRemove} />
                </div>
            );
    }
}

// Remove button overlay
function RemoveButton({ onRemove }: { onRemove: () => void }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    );
}

// Block Settings Panel
function BlockSettings({ block, onChange }: { block: PageBlock; onChange: (content: any) => void }) {
    const content = block.content;

    switch (block.type) {
        case 'hero':
            const hero = content as HeroBlockContent;
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={hero.title || ''}
                            onChange={(e) => onChange({ ...content, title: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle</label>
                        <input
                            type="text"
                            value={hero.subtitle || ''}
                            onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Text</label>
                        <input
                            type="text"
                            value={hero.ctaText || ''}
                            onChange={(e) => onChange({ ...content, ctaText: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Link</label>
                        <input
                            type="text"
                            value={hero.ctaLink || ''}
                            onChange={(e) => onChange({ ...content, ctaLink: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            );

        case 'richtext':
            const richtext = content as RichTextBlockContent;
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea
                            value={richtext.html || ''}
                            onChange={(e) => onChange({ ...content, html: e.target.value })}
                            rows={8}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="<p>Your content here...</p>"
                        />
                    </div>
                </div>
            );

        case 'cta':
            const cta = content as CTABlockContent;
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={cta.title || ''}
                            onChange={(e) => onChange({ ...content, title: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={cta.description || ''}
                            onChange={(e) => onChange({ ...content, description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Text</label>
                        <input
                            type="text"
                            value={cta.buttonText || ''}
                            onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Link</label>
                        <input
                            type="text"
                            value={cta.buttonLink || ''}
                            onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            );

        default:
            return (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Settings for {blockTypeLabels[block.type]} coming soon...
                </div>
            );
    }
}

// Helper to get default content for a block type
function getDefaultBlockContent(type: BlockType): any {
    switch (type) {
        case 'hero': return { title: 'Your Headline Here', subtitle: 'A compelling subtitle that explains your value proposition', ctaText: 'Get Started', ctaLink: '/', alignment: 'center' } as HeroBlockContent;
        case 'features': return { title: 'Features', features: [{ title: 'Feature 1', description: 'Description' }, { title: 'Feature 2', description: 'Description' }, { title: 'Feature 3', description: 'Description' }], columns: 3 } as FeaturesBlockContent;
        case 'testimonials': return { title: 'What Our Customers Say', testimonials: [] } as TestimonialsBlockContent;
        case 'richtext': return { html: '<p>Click to edit this text block. You can add any content here.</p>' } as RichTextBlockContent;
        case 'gallery': return { images: [], columns: 3 } as GalleryBlockContent;
        case 'cta': return { title: 'Ready to Get Started?', description: 'Join thousands of happy customers today.', buttonText: 'Get Started', buttonLink: '/contact' } as CTABlockContent;
        case 'faq': return { title: 'Frequently Asked Questions', items: [{ question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee.' }] } as FAQBlockContent;
        default: return {};
    }
}

// Settings Panel with Content/Style tabs
function SettingsPanel({ block, onContentChange, onStyleChange }: {
    block: PageBlock;
    onContentChange: (content: any) => void;
    onStyleChange: (style: BlockStyle) => void;
}) {
    const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');

    return (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'content'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Content
                </button>
                <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'style'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Style
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'content' ? (
                    <BlockSettings block={block} onChange={onContentChange} />
                ) : (
                    <StyleEditor style={block.style || {}} onChange={onStyleChange} />
                )}
            </div>
        </div>
    );
}

// Style Editor Component
function StyleEditor({ style, onChange }: { style: BlockStyle; onChange: (style: BlockStyle) => void }) {
    const handleChange = (key: keyof BlockStyle, value: any) => {
        onChange({ ...style, [key]: value });
    };

    return (
        <div className="space-y-5">
            {/* Background Color */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                    {colorPresets.map(color => (
                        <button
                            key={color.value}
                            onClick={() => handleChange('backgroundColor', color.value)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${style.backgroundColor === color.value ? 'border-brand-500 scale-110' : 'border-gray-200 dark:border-gray-600'}`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                        />
                    ))}
                </div>
                <input
                    type="color"
                    value={style.backgroundColor || '#ffffff'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                />
            </div>

            {/* Text Color */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                    {colorPresets.slice(0, 5).map(color => (
                        <button
                            key={color.value}
                            onClick={() => handleChange('textColor', color.value)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${style.textColor === color.value ? 'border-brand-500 scale-110' : 'border-gray-200 dark:border-gray-600'}`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                        />
                    ))}
                </div>
                <input
                    type="color"
                    value={style.textColor || '#111827'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                />
            </div>

            {/* Accent Color (for buttons) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accent Color</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                    {colorPresets.slice(4).map(color => (
                        <button
                            key={color.value}
                            onClick={() => handleChange('accentColor', color.value)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${style.accentColor === color.value ? 'border-brand-500 scale-110' : 'border-gray-200 dark:border-gray-600'}`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                        />
                    ))}
                </div>
            </div>

            {/* Spacing */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Padding Top</label>
                <div className="flex gap-1">
                    {(['none', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
                        <button
                            key={size}
                            onClick={() => handleChange('paddingTop', size)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${style.paddingTop === size
                                ? 'bg-brand-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                        >
                            {size.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Padding Bottom</label>
                <div className="flex gap-1">
                    {(['none', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
                        <button
                            key={size}
                            onClick={() => handleChange('paddingBottom', size)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${style.paddingBottom === size
                                ? 'bg-brand-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                        >
                            {size.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Text Alignment */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Align</label>
                <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(align => (
                        <button
                            key={align}
                            onClick={() => handleChange('textAlign', align)}
                            className={`flex-1 py-2 text-xs font-medium rounded transition-colors flex items-center justify-center ${style.textAlign === align
                                ? 'bg-brand-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                        >
                            {align === 'left' && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                                </svg>
                            )}
                            {align === 'center' && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                                </svg>
                            )}
                            {align === 'right' && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Border Radius */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Corners</label>
                <div className="flex gap-1">
                    {(['none', 'sm', 'md', 'lg'] as const).map(radius => (
                        <button
                            key={radius}
                            onClick={() => handleChange('borderRadius', radius)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${style.borderRadius === radius
                                ? 'bg-brand-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                        >
                            {radius === 'none' ? 'Sharp' : radius.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

