// Pages CMS Data Model

export type PageType = 'landing' | 'info' | 'store' | 'custom';
export type PageStatus = 'draft' | 'published';
export type BlockType = 'hero' | 'features' | 'testimonials' | 'richtext' | 'gallery' | 'cta' | 'faq';

// Block Style Options (customizable by user)
export interface BlockStyle {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

// Spacing presets (in pixels)
export const paddingPresets = {
    none: '0px',
    sm: '16px',
    md: '32px',
    lg: '48px',
    xl: '64px',
};

export const borderRadiusPresets = {
    none: '0px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
};

// Preset colors for quick selection
export const colorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f3f4f6' },
    { name: 'Dark', value: '#1f2937' },
    { name: 'Black', value: '#111827' },
    { name: 'Brand Blue', value: '#3b82f6' },
    { name: 'Brand Purple', value: '#8b5cf6' },
    { name: 'Brand Green', value: '#10b981' },
    { name: 'Brand Orange', value: '#f59e0b' },
    { name: 'Brand Pink', value: '#ec4899' },
    { name: 'Brand Teal', value: '#14b8a6' },
];

// Block content types
export interface HeroBlockContent {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
    alignment?: 'left' | 'center' | 'right';
}

export interface FeaturesBlockContent {
    title?: string;
    features: {
        icon?: string;
        title: string;
        description: string;
    }[];
    columns?: 2 | 3 | 4;
}

export interface TestimonialsBlockContent {
    title?: string;
    testimonials: {
        name: string;
        role?: string;
        company?: string;
        avatar?: string;
        quote: string;
        rating?: number;
    }[];
}

export interface RichTextBlockContent {
    html: string;
}

export interface GalleryBlockContent {
    title?: string;
    images: {
        url: string;
        alt?: string;
        caption?: string;
    }[];
    columns?: 2 | 3 | 4;
}

export interface CTABlockContent {
    title: string;
    description?: string;
    buttonText: string;
    buttonLink: string;
    backgroundColor?: string;
}



export interface FAQBlockContent {
    title?: string;
    items: {
        question: string;
        answer: string;
    }[];
}

export type BlockContent =
    | HeroBlockContent
    | FeaturesBlockContent
    | TestimonialsBlockContent
    | RichTextBlockContent
    | GalleryBlockContent
    | CTABlockContent
    | FAQBlockContent;

export interface PageBlock {
    id: string;
    type: BlockType;
    content: BlockContent;
    style?: BlockStyle;
    order: number;
}

export interface PageSEO {
    title: string;
    description: string;
    keywords: string[];
}

export interface Page {
    id: string;
    title: string;
    slug: string;
    type: PageType;
    status: PageStatus;
    template?: string;
    blocks: PageBlock[];
    seo: PageSEO;
    navOrder?: number;
    showInNav: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PageTemplate {
    id: string;
    name: string;
    description: string;
    type: PageType;
    defaultBlocks: Omit<PageBlock, 'id'>[];
}

// Helper to generate unique IDs
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default templates
export const pageTemplates: PageTemplate[] = [
    {
        id: 'tpl-home',
        name: 'Home Page',
        description: 'Landing page with hero, features, testimonials, and CTA',
        type: 'landing',
        defaultBlocks: [
            { type: 'hero', content: { title: 'Welcome', subtitle: 'Your tagline here', alignment: 'center' } as HeroBlockContent, order: 0 },
            { type: 'features', content: { title: 'Our Features', features: [], columns: 3 } as FeaturesBlockContent, order: 1 },
            { type: 'testimonials', content: { title: 'What Our Customers Say', testimonials: [] } as TestimonialsBlockContent, order: 2 },
            { type: 'cta', content: { title: 'Ready to Get Started?', buttonText: 'Contact Us', buttonLink: '/contact' } as CTABlockContent, order: 3 },
        ]
    },
    {
        id: 'tpl-about',
        name: 'About Page',
        description: 'Info page with hero and rich text content',
        type: 'info',
        defaultBlocks: [
            { type: 'hero', content: { title: 'About Us', alignment: 'center' } as HeroBlockContent, order: 0 },
            { type: 'richtext', content: { html: '<p>Tell your story here...</p>' } as RichTextBlockContent, order: 1 },
        ]
    },
    {
        id: 'tpl-contact',
        name: 'Contact Page',
        description: 'Contact information with CTA',
        type: 'info',
        defaultBlocks: [
            { type: 'richtext', content: { html: '<h2>Get in Touch</h2><p>Contact information here...</p>' } as RichTextBlockContent, order: 0 },
            { type: 'cta', content: { title: 'Send us a message', buttonText: 'Email Us', buttonLink: 'mailto:info@example.com' } as CTABlockContent, order: 1 },
        ]
    },
    {
        id: 'tpl-faq',
        name: 'FAQ Page',
        description: 'Frequently asked questions',
        type: 'info',
        defaultBlocks: [
            { type: 'hero', content: { title: 'Frequently Asked Questions', alignment: 'center' } as HeroBlockContent, order: 0 },
            { type: 'faq', content: { items: [] } as FAQBlockContent, order: 1 },
        ]
    },

    {
        id: 'tpl-custom',
        name: 'Blank Page',
        description: 'Start from scratch with an empty page',
        type: 'custom',
        defaultBlocks: []
    }
];

// Sample pages
export const samplePages: Page[] = [
    {
        id: 'page-home',
        title: 'Home',
        slug: '',
        type: 'landing',
        status: 'published',
        template: 'tpl-home',
        blocks: [
            {
                id: 'blk-1',
                type: 'hero',
                content: {
                    title: 'Welcome to Our Store',
                    subtitle: 'Quality printing services for your business',
                    ctaText: 'Browse Products',
                    ctaLink: '/products',
                    alignment: 'center'
                } as HeroBlockContent,
                order: 0
            },
            {
                id: 'blk-2',
                type: 'features',
                content: {
                    title: 'Why Choose Us',
                    features: [
                        { title: 'Fast Turnaround', description: 'Get your orders delivered quickly' },
                        { title: 'Quality Products', description: 'Premium materials and printing' },
                        { title: 'Great Prices', description: 'Competitive pricing for all budgets' },
                    ],
                    columns: 3
                } as FeaturesBlockContent,
                order: 1
            },
            {
                id: 'blk-3',
                type: 'cta',
                content: {
                    title: 'Ready to Order?',
                    description: 'Contact us today for a quote',
                    buttonText: 'Get Started',
                    buttonLink: '/contact'
                } as CTABlockContent,
                order: 2
            },
        ],
        seo: { title: 'Home | Print Shop', description: 'Quality printing services', keywords: ['printing', 'shop'] },
        navOrder: 0,
        showInNav: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'page-about',
        title: 'About Us',
        slug: 'about',
        type: 'info',
        status: 'published',
        template: 'tpl-about',
        blocks: [
            {
                id: 'blk-4',
                type: 'hero',
                content: { title: 'About Us', alignment: 'center' } as HeroBlockContent,
                order: 0
            },
            {
                id: 'blk-5',
                type: 'richtext',
                content: { html: '<p>We are a leading print shop with years of experience...</p>' } as RichTextBlockContent,
                order: 1
            },
        ],
        seo: { title: 'About Us | Print Shop', description: 'Learn about our company', keywords: ['about', 'company'] },
        navOrder: 1,
        showInNav: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'page-contact',
        title: 'Contact',
        slug: 'contact',
        type: 'info',
        status: 'published',
        template: 'tpl-contact',
        blocks: [
            {
                id: 'blk-8',
                type: 'richtext',
                content: { html: '<h2>Contact Us</h2><p>Email: info@printshop.com</p><p>Phone: +60 123 456 789</p>' } as RichTextBlockContent,
                order: 0
            },
        ],
        seo: { title: 'Contact | Print Shop', description: 'Get in touch', keywords: ['contact'] },
        navOrder: 3,
        showInNav: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'page-faq',
        title: 'FAQ',
        slug: 'faq',
        type: 'info',
        status: 'draft',
        template: 'tpl-faq',
        blocks: [
            {
                id: 'blk-9',
                type: 'hero',
                content: { title: 'Frequently Asked Questions', alignment: 'center' } as HeroBlockContent,
                order: 0
            },
            {
                id: 'blk-10',
                type: 'faq',
                content: {
                    items: [
                        { question: 'How long is delivery?', answer: 'Standard delivery is 3-5 business days.' },
                        { question: 'Do you offer rush orders?', answer: 'Yes, rush orders are available for an additional fee.' },
                    ]
                } as FAQBlockContent,
                order: 1
            },
        ],
        seo: { title: 'FAQ | Print Shop', description: 'Common questions answered', keywords: ['faq', 'help'] },
        navOrder: 6,
        showInNav: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'page-services',
        title: 'Services',
        slug: 'services',
        type: 'landing',
        status: 'published',
        template: 'tpl-landing',
        blocks: [
            {
                id: 'blk-srv-1',
                type: 'hero',
                content: {
                    title: 'Our Services',
                    subtitle: 'Professional printing solutions for all your business needs',
                    ctaText: 'Get a Quote',
                    alignment: 'center'
                } as HeroBlockContent,
                order: 0
            },
            {
                id: 'blk-srv-2',
                type: 'features',
                content: {
                    title: 'What We Offer',
                    columns: 3,
                    features: [
                        { title: 'Business Cards', description: 'Premium quality cards with various finishes including matte, gloss, and spot UV.' },
                        { title: 'Flyers & Brochures', description: 'Eye-catching promotional materials printed on high-quality paper stock.' },
                        { title: 'Banners & Signage', description: 'Large format printing for indoor and outdoor displays.' },
                        { title: 'Stickers & Labels', description: 'Custom stickers and product labels in any shape and size.' },
                        { title: 'Apparel Printing', description: 'T-shirts, jerseys, and uniforms with DTF or sublimation printing.' },
                        { title: 'Packaging', description: 'Custom boxes, bags, and packaging solutions for your products.' },
                    ]
                } as FeaturesBlockContent,
                order: 1
            },
            {
                id: 'blk-srv-3',
                type: 'cta',
                content: {
                    title: 'Ready to Start Your Project?',
                    description: 'Contact us today for a free consultation and quote.',
                    buttonText: 'Contact Us',
                    buttonLink: '/contact'
                } as CTABlockContent,
                order: 2
            },
        ],
        seo: { title: 'Services | Print Shop', description: 'Our printing services', keywords: ['services', 'printing'] },
        navOrder: 2,
        showInNav: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'page-terms',
        title: 'Terms & Conditions',
        slug: 'terms',
        type: 'info',
        status: 'published',
        template: 'tpl-blank',
        blocks: [
            {
                id: 'blk-terms-1',
                type: 'hero',
                content: {
                    title: 'Terms & Conditions',
                    subtitle: 'Please read these terms carefully before using our services',
                    alignment: 'center'
                } as HeroBlockContent,
                order: 0,
                style: { backgroundColor: '#1f2937', textColor: '#ffffff' }
            },
            {
                id: 'blk-terms-2',
                type: 'richtext',
                content: {
                    html: `
                        <h2>1. Acceptance of Terms</h2>
                        <p>By accessing and using our services, you accept and agree to be bound by these Terms and Conditions.</p>
                        
                        <h2>2. Services</h2>
                        <p>We provide professional printing services including but not limited to business cards, flyers, banners, stickers, and apparel printing.</p>
                        
                        <h2>3. Orders & Payment</h2>
                        <p>All orders must be paid in full before production begins. We accept various payment methods including online banking, credit cards, and e-wallets.</p>
                        
                        <h2>4. Artwork Requirements</h2>
                        <p>Customers are responsible for providing print-ready artwork. We are not responsible for errors in customer-supplied files.</p>
                        
                        <h2>5. Delivery</h2>
                        <p>Standard delivery is 3-5 business days after artwork approval. Rush orders are available for an additional fee.</p>
                        
                        <h2>6. Returns & Refunds</h2>
                        <p>Due to the custom nature of our products, we do not accept returns. Refunds are only issued for manufacturing defects.</p>
                        
                        <h2>7. Limitation of Liability</h2>
                        <p>Our liability is limited to the cost of the order. We are not responsible for consequential damages.</p>
                    `
                } as RichTextBlockContent,
                order: 1
            },
        ],
        seo: { title: 'Terms & Conditions | Print Shop', description: 'Our terms and conditions', keywords: ['terms', 'conditions', 'legal'] },
        navOrder: 7,
        showInNav: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'page-privacy',
        title: 'Privacy Policy',
        slug: 'privacy',
        type: 'info',
        status: 'published',
        template: 'tpl-blank',
        blocks: [
            {
                id: 'blk-priv-1',
                type: 'hero',
                content: {
                    title: 'Privacy Policy',
                    subtitle: 'How we collect, use, and protect your information',
                    alignment: 'center'
                } as HeroBlockContent,
                order: 0,
                style: { backgroundColor: '#1f2937', textColor: '#ffffff' }
            },
            {
                id: 'blk-priv-2',
                type: 'richtext',
                content: {
                    html: `
                        <h2>Information We Collect</h2>
                        <p>We collect information you provide directly to us, including name, email, phone number, shipping address, and payment information when you place an order.</p>
                        
                        <h2>How We Use Your Information</h2>
                        <p>We use your information to:</p>
                        <ul>
                            <li>Process and fulfill your orders</li>
                            <li>Communicate with you about your orders</li>
                            <li>Send promotional communications (with your consent)</li>
                            <li>Improve our services</li>
                        </ul>
                        
                        <h2>Data Security</h2>
                        <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or destruction.</p>
                        
                        <h2>Third-Party Services</h2>
                        <p>We may share your information with trusted third-party service providers who assist us in operating our business, such as payment processors and shipping carriers.</p>
                        
                        <h2>Your Rights</h2>
                        <p>You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.</p>
                        
                        <h2>Contact Us</h2>
                        <p>If you have questions about this Privacy Policy, please contact us at privacy@printshop.com</p>
                    `
                } as RichTextBlockContent,
                order: 1
            },
        ],
        seo: { title: 'Privacy Policy | Print Shop', description: 'Our privacy policy', keywords: ['privacy', 'policy', 'data'] },
        navOrder: 8,
        showInNav: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
];

// Block type labels
export const blockTypeLabels: Record<BlockType, string> = {
    hero: 'Hero Banner',
    features: 'Features Grid',
    testimonials: 'Testimonials',
    richtext: 'Rich Text',
    gallery: 'Image Gallery',
    cta: 'Call to Action',

    faq: 'FAQ Accordion',
};

// Page type labels
export const pageTypeLabels: Record<PageType, string> = {
    landing: 'Landing Page',
    info: 'Info Page',
    store: 'Store Page',
    custom: 'Custom Page',
};

// Status colors
export const pageStatusColors: Record<PageStatus, { bg: string; text: string }> = {
    published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};
