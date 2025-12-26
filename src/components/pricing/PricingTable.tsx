"use client";

import { useState } from 'react';
import { usePlan } from "@/context/PlanContext";
import { Radio, RadioGroup } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import CheckoutModal from '@/components/billing/CheckoutModal';

const frequencies = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annually', label: 'Annually' },
];

const tiers = [
    {
        name: 'Free',
        id: 'free',
        href: '#',
        slug: 'free',
        featured: false,
        description: 'For hobbyists and testing.',
        price: { monthly: 'Free', annually: 'Free' },
        mainFeatures: ['1 user', '10 orders/month', '10 products', 'Community support'],
    },
    {
        name: 'Basic',
        id: 'basic',
        href: '#',
        slug: 'basic',
        featured: false,
        description: 'For small businesses just starting out.',
        price: { monthly: 'RM299', annually: 'RM2,990' },
        mainFeatures: ['Up to 5 users', '100 orders/month', '50 products', 'Standard support'],
    },
    {
        name: 'Pro',
        id: 'pro',
        href: '#',
        slug: 'pro',
        featured: true,
        description: 'For growing businesses with full needs.',
        price: { monthly: 'RM599', annually: 'RM5,990' },
        mainFeatures: [
            'Up to 10 users',
            '500 orders/month',
            '200 products',
            'Pricing Engine',
            'Agent Management',
            'Transactions & Payments',
        ],
    },
    {
        name: 'Enterprise',
        id: 'enterprise',
        href: '#',
        slug: 'enterprise',
        featured: false,
        description: 'For large operations requiring unlimited scale.',
        price: { monthly: 'Custom', annually: 'Custom' },
        mainFeatures: ['Unlimited users', 'Unlimited orders', 'Unlimited products', 'Dedicated support'],
    },
];

const sections = [
    {
        name: 'Core Features',
        features: [
            { name: 'Orders & Quotes', tiers: { Free: '10/mo', Basic: '100/mo', Pro: '500/mo', Enterprise: 'Unlimited' } },
            { name: 'Product Management', tiers: { Free: '10 products', Basic: '50 products', Pro: '200 products', Enterprise: 'Unlimited' } },
            { name: 'User Accounts', tiers: { Free: '1 user', Basic: '5 users', Pro: '10 users', Enterprise: 'Unlimited' } },
            { name: 'Storage', tiers: { Free: '500 MB', Basic: '1 GB', Pro: '5 GB', Enterprise: 'Unlimited' } },
        ],
    },
    {
        name: 'Advanced Tools',
        features: [
            { name: 'Operation Board', tiers: { Free: false, Basic: true, Pro: true, Enterprise: true } },
            { name: 'Pricing Engine', tiers: { Free: false, Basic: false, Pro: true, Enterprise: true } },
            { name: 'Agent Management', tiers: { Free: false, Basic: false, Pro: true, Enterprise: true } },
            { name: 'Transactions & Payments', tiers: { Free: false, Basic: false, Pro: true, Enterprise: true } },
            { name: 'Promotions & Packages', tiers: { Free: false, Basic: 'Via Add-on', Pro: 'Via Add-on', Enterprise: true } },
            { name: 'Analytics & Reporting', tiers: { Free: false, Basic: false, Pro: false, Enterprise: true } },
        ],
    },
    {
        name: 'Support & Service',
        features: [
            { name: 'Email Support', tiers: { Free: 'Community', Basic: 'Standard', Pro: 'Priority', Enterprise: 'Dedicated' } },
            { name: 'API Access', tiers: { Free: false, Basic: false, Pro: false, Enterprise: true } },
            { name: 'White Labeling', tiers: { Free: false, Basic: false, Pro: false, Enterprise: true } },
            { name: 'Custom Domain', tiers: { Free: false, Basic: false, Pro: false, Enterprise: true } },
        ],
    },
];

function classNames(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}

export default function PricingTable() {
    const [frequency, setFrequency] = useState(frequencies[0]);
    const { planSlug } = usePlan();
    const [checkoutTier, setCheckoutTier] = useState<typeof tiers[0] | null>(null);

    // Default to 'free' if undefined
    const currentSlug = planSlug || 'free';

    const handleUpgrade = (tier: typeof tiers[0]) => {
        if (tier.slug === 'enterprise') {
            // For enterprise, redirect to contact
            window.location.href = 'mailto:sales@linkprintshop.com?subject=Enterprise Plan Inquiry';
            return;
        }
        setCheckoutTier(tier);
    };

    const closeCheckout = () => {
        setCheckoutTier(null);
    };

    return (
        <>
            <CheckoutModal
                isOpen={!!checkoutTier}
                onClose={closeCheckout}
                planSlug={checkoutTier?.slug || ''}
                planName={checkoutTier?.name || ''}
                price={frequency.value === 'annually' ? checkoutTier?.price.annually || '' : checkoutTier?.price.monthly || ''}
                billingCycle={frequency.value as 'monthly' | 'annually'}
            />
            <div className="bg-gray-50 dark:bg-gray-900 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-base font-semibold leading-7 text-blue-600">Pricing</h2>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                            Pricing plans for teams of&nbsp;all&nbsp;sizes
                        </p>
                    </div>
                    <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-300">
                        Distinctio et nulla eum soluta et neque labore quibusdam. Saepe et quasi iusto modi velit ut non voluptas
                        in. Explicabo id ut laborum.
                    </p>
                    <div className="mt-16 flex justify-center">
                        <fieldset aria-label="Payment frequency">
                            <RadioGroup
                                value={frequency}
                                onChange={setFrequency}
                                className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200 dark:ring-gray-700"
                            >
                                {frequencies.map((option) => (
                                    <Radio
                                        key={option.value}
                                        value={option}
                                        className={({ checked }) =>
                                            classNames(
                                                checked ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                                                'cursor-pointer rounded-full px-2.5 py-1',
                                            )
                                        }
                                    >
                                        {option.label}
                                    </Radio>
                                ))}
                            </RadioGroup>
                        </fieldset>
                    </div>
                    <div className="relative mx-auto mt-10 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
                        <div
                            aria-hidden="true"
                            className="hidden lg:absolute lg:inset-x-px lg:bottom-0 lg:top-4 lg:block lg:rounded-t-2xl lg:bg-gray-50 dark:lg:bg-gray-800/80 lg:ring-1 lg:ring-gray-200 dark:lg:ring-white/10"
                        />
                        {tiers.map((tier) => (
                            <div
                                key={tier.id}
                                className={classNames(
                                    tier.featured
                                        ? 'z-10 bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700'
                                        : 'bg-transparent ring-1 ring-gray-200 dark:ring-gray-700 lg:bg-transparent lg:pb-14 lg:ring-0',
                                    'relative rounded-2xl',
                                )}
                            >
                                <div className="p-8 lg:pt-12 xl:p-10 xl:pt-14">
                                    <h3
                                        id={tier.id}
                                        className={classNames(
                                            tier.featured ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white',
                                            'text-sm font-semibold leading-6',
                                        )}
                                    >
                                        {tier.name}
                                    </h3>
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-stretch">
                                        <div className="mt-2 flex items-center gap-x-4">
                                            <p
                                                className={classNames(
                                                    tier.featured ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white',
                                                    'text-4xl font-bold tracking-tight',
                                                )}
                                            >
                                                {frequency.value === 'annually' ? tier.price.annually : tier.price.monthly}
                                            </p>
                                            <div className="text-sm leading-5">
                                                <p className={tier.featured ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}>MYR</p>
                                                <p
                                                    className={tier.featured ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}
                                                >{`Billed ${frequency.value}`}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUpgrade(tier)}
                                            disabled={tier.slug === currentSlug}
                                            aria-describedby={tier.id}
                                            className={classNames(
                                                tier.slug === currentSlug
                                                    ? 'bg-green-600 hover:bg-green-500 text-white cursor-default'
                                                    : tier.featured
                                                        ? 'bg-blue-600 shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600 text-white'
                                                        : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 ring-1 ring-inset ring-gray-300 dark:ring-transparent',
                                                'rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
                                            )}
                                        >
                                            {tier.slug === currentSlug ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckIcon className="w-5 h-5" /> Current Plan
                                                </span>
                                            ) : tier.slug === 'enterprise' ? (
                                                "Contact Sales"
                                            ) : (
                                                "Upgrade"
                                            )}
                                        </button>
                                    </div>
                                    <div className="mt-8 flow-root sm:mt-10">
                                        <ul
                                            role="list"
                                            className={classNames(
                                                tier.featured
                                                    ? 'divide-gray-900/5 dark:divide-white/5 border-gray-900/5 dark:border-white/5 text-gray-600 dark:text-gray-300'
                                                    : 'divide-gray-900/5 dark:divide-white/5 border-gray-900/5 dark:border-white/5 text-gray-600 dark:text-gray-300',
                                                '-my-2 divide-y border-t text-sm leading-6 lg:border-t-0',
                                            )}
                                        >
                                            {tier.mainFeatures.map((mainFeature) => (
                                                <li key={mainFeature} className="flex gap-x-3 py-2">
                                                    <CheckIcon
                                                        aria-hidden="true"
                                                        className={classNames(
                                                            tier.featured ? 'text-blue-600' : 'text-blue-600',
                                                            'h-6 w-5 flex-none',
                                                        )}
                                                    />
                                                    {mainFeature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add-on Section */}
                    <div className="mx-auto mt-10 max-w-2xl rounded-3xl ring-1 ring-gray-200 dark:ring-gray-700 lg:mx-0 lg:flex lg:max-w-none">
                        <div className="p-8 sm:p-10 lg:flex-auto">
                            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Add-on: Storefront</h3>
                            <p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-300">
                                Launch your own branded e-commerce store. Fully integrated with your admin panel for seamless order management.
                            </p>
                            <div className="mt-10 flex items-center gap-x-4">
                                <h4 className="flex-none text-sm font-semibold leading-6 text-blue-600">What included</h4>
                                <div className="h-px flex-auto bg-gray-100 dark:bg-gray-700" />
                            </div>
                            <ul
                                role="list"
                                className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 dark:text-gray-300 sm:grid-cols-2 sm:gap-6"
                            >
                                {['Marketing Tools (Promotions, Packages)', 'Mobile Responsive Design', 'SEO Optimization', 'Integrated Checkout'].map((feature) => (
                                    <li key={feature} className="flex gap-x-3">
                                        <CheckIcon className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
                            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 py-10 text-center ring-1 ring-inset ring-gray-900/5 dark:ring-white/10 lg:flex lg:flex-col lg:justify-center lg:py-16 h-full">
                                <div className="mx-auto max-w-xs px-8">
                                    <p className="text-base font-semibold text-gray-600 dark:text-gray-400">One-time Setup Fee</p>
                                    <p className="mt-6 flex items-baseline justify-center gap-x-2">
                                        <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">RM1,500</span>
                                        <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600 dark:text-gray-400">MYR</span>
                                    </p>
                                    <a
                                        href="#"
                                        className="mt-10 block w-full rounded-md bg-white dark:bg-white/10 px-3 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-transparent hover:bg-gray-50 dark:hover:bg-white/20"
                                    >
                                        Contact to Add
                                    </a>
                                    <p className="mt-6 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                        Available for <span className="font-semibold text-gray-900 dark:text-white">Pro</span> plan and above only.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature comparison (up to lg) */}
                {/* Feature comparison (up to lg) */}
                <section aria-labelledby="mobile-comparison-heading" className="lg:hidden mt-16">
                    <h2 id="mobile-comparison-heading" className="sr-only">Feature comparison</h2>

                    <div className="mx-auto max-w-2xl space-y-16">
                        {tiers.map((tier) => (
                            <div key={tier.id} className="border-t border-gray-200 dark:border-gray-700">
                                <div className={classNames(tier.featured ? 'border-blue-600' : 'border-transparent', '-mt-px w-72 border-t-2 pt-10 md:w-80')}>
                                    <h3 className={classNames(tier.featured ? 'text-blue-600' : 'text-gray-900 dark:text-white', 'text-sm font-semibold leading-6')}>
                                        {tier.name}
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{tier.description}</p>
                                </div>

                                <div className="mt-10 space-y-10">
                                    {sections.map((section) => (
                                        <div key={section.name}>
                                            <h4 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">{section.name}</h4>
                                            <div className="relative mt-6">
                                                <div className={classNames(
                                                    tier.featured ? 'ring-2 ring-blue-600' : 'ring-1 ring-gray-900/10 dark:ring-white/10',
                                                    'relative rounded-lg bg-white dark:bg-gray-800 shadow-sm'
                                                )}>
                                                    <dl className="divide-y divide-gray-200 dark:divide-white/10 text-sm leading-6">
                                                        {section.features.map((feature) => (
                                                            <div key={feature.name} className="flex items-center justify-between px-4 py-3 sm:grid sm:grid-cols-2 sm:px-0">
                                                                <dt className="pr-4 text-gray-600 dark:text-gray-300 sm:pl-4">{feature.name}</dt>
                                                                <dd className="flex items-center justify-end sm:justify-center sm:px-4">
                                                                    {typeof feature.tiers[tier.name as keyof typeof feature.tiers] === 'string' ? (
                                                                        <span className={tier.featured ? 'font-semibold text-blue-600' : 'text-gray-900 dark:text-white'}>
                                                                            {feature.tiers[tier.name as keyof typeof feature.tiers]}
                                                                        </span>
                                                                    ) : (
                                                                        <>
                                                                            {feature.tiers[tier.name as keyof typeof feature.tiers] === true ? (
                                                                                <CheckIcon aria-hidden="true" className="mx-auto h-5 w-5 text-blue-600" />
                                                                            ) : (
                                                                                <XMarkIcon aria-hidden="true" className="mx-auto h-5 w-5 text-gray-400" />
                                                                            )}
                                                                            <span className="sr-only">
                                                                                {feature.tiers[tier.name as keyof typeof feature.tiers] === true ? 'Yes' : 'No'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Feature comparison (lg+) */}
                <section aria-labelledby="comparison-heading" className="hidden lg:block mt-24">
                    <h2 id="comparison-heading" className="sr-only">
                        Feature comparison
                    </h2>

                    <div className="grid grid-cols-5 gap-x-8 border-t border-gray-200 dark:border-gray-700 before:block">
                        <div aria-hidden="true" />
                        {tiers.map((tier) => (
                            <div key={tier.id} aria-hidden="true" className="-mt-px">
                                <div
                                    className={classNames(
                                        tier.featured ? 'border-blue-600' : 'border-transparent',
                                        'border-t-2 pt-10',
                                    )}
                                >
                                    <p
                                        className={classNames(
                                            tier.featured ? 'text-blue-600' : 'text-gray-900 dark:text-white',
                                            'text-sm font-semibold leading-6',
                                        )}
                                    >
                                        {tier.name}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{tier.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="-mt-6 space-y-16">
                        {sections.map((section) => (
                            <div key={section.name}>
                                <h3 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">{section.name}</h3>
                                <div className="relative -mx-8 mt-10">
                                    <table className="relative w-full border-separate border-spacing-x-8 border-spacing-y-0">
                                        <thead>
                                            <tr className="text-left">
                                                <th scope="col">
                                                    <span className="sr-only">Feature</span>
                                                </th>
                                                {tiers.map((tier) => (
                                                    <th key={tier.id} scope="col">
                                                        <span className="sr-only">{tier.name} tier</span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.features.map((feature, featureIdx) => (
                                                <tr key={feature.name}>
                                                    <th scope="row" className="w-1/5 py-3 pr-4 text-left text-sm font-normal leading-6 text-gray-900 dark:text-gray-300">
                                                        {feature.name}
                                                        {featureIdx !== section.features.length - 1 ? (
                                                            <div className="absolute inset-x-8 mt-3 h-px bg-gray-200 dark:bg-gray-700" />
                                                        ) : null}
                                                    </th>
                                                    {tiers.map((tier) => {
                                                        const isFirst = featureIdx === 0;
                                                        const isLast = featureIdx === section.features.length - 1;
                                                        return (
                                                            <td key={tier.id} className={classNames(
                                                                'relative w-1/5 px-4 py-0 text-center',
                                                                tier.featured ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800/50',
                                                                isFirst ? 'rounded-t-lg border-t border-x border-gray-200 dark:border-gray-700' : 'border-x border-gray-200 dark:border-gray-700',
                                                                isLast ? 'rounded-b-lg border-b border-x border-gray-200 dark:border-gray-700' : '',
                                                                !isFirst && !isLast ? 'border-x border-gray-200 dark:border-gray-700' : '',
                                                                tier.featured ? 'ring-1 ring-blue-600 border-blue-600' : ''
                                                                // Note: simple border usage here instead of confusing ring interactions
                                                            )}>
                                                                <span className="relative h-full w-full py-3 block">
                                                                    {typeof feature.tiers[tier.name as keyof typeof feature.tiers] === 'string' ? (
                                                                        <span className={classNames(tier.featured ? 'font-semibold text-blue-600' : 'text-gray-900 dark:text-white', 'text-sm leading-6')}>
                                                                            {feature.tiers[tier.name as keyof typeof feature.tiers]}
                                                                        </span>
                                                                    ) : (
                                                                        <>
                                                                            {feature.tiers[tier.name as keyof typeof feature.tiers] === true ? (
                                                                                <CheckIcon aria-hidden="true" className="mx-auto h-5 w-5 text-blue-600" />
                                                                            ) : (
                                                                                <XMarkIcon aria-hidden="true" className="mx-auto h-5 w-5 text-gray-400" />
                                                                            )}
                                                                            <span className="sr-only">
                                                                                {feature.tiers[tier.name as keyof typeof feature.tiers] === true ? 'Yes' : 'No'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
