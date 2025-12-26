"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RegistrationData {
    // Step 1: Account
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    userId?: string;
    // Step 2: Persona
    role: string;
    heardFrom: string;
    // Step 3: Identity
    shopName: string;
    shopSlug: string;
    organizationId?: string;
    // Step 4: Maturity
    teamSize: string;
    currentSystem: string;
    // Step 5: Setup
    mainFocus: string[];
}

// Custom Dropdown Component
function CustomDropdown({
    label,
    value,
    onChange,
    options,
    placeholder = "Select one..."
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
            >
                <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Step Indicator Component
function StepIndicator({ currentStep, setCurrentStep }: { currentStep: number; setCurrentStep: (step: number) => void }) {
    const steps = ["Account", "Persona", "Identity", "Maturity", "Setup"];
    return (
        <div className="mx-auto w-full max-w-lg pb-8 px-4 sm:px-0">
            <div className="relative">
                <div className="absolute left-0 top-2 h-0.5 w-full bg-gray-200" aria-hidden="true">
                    <div
                        className="absolute h-full bg-gray-900 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                    />
                </div>
                <ul className="relative flex w-full justify-between">
                    {[1, 2, 3, 4, 5].map((step) => (
                        <li key={step} className="text-center">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(step)}
                                className={`flex h-5 w-5 mx-auto items-center justify-center rounded-full text-xs font-semibold text-white transition-all cursor-pointer hover:scale-110
                                    ${currentStep === step ? 'bg-gray-900 ring-2 ring-gray-900 ring-offset-2' : ''}
                                    ${currentStep > step ? 'bg-gray-900' : ''}
                                    ${currentStep < step ? 'bg-gray-300' : ''}
                                `}
                            >
                                {step}
                            </button>
                            <span className={`block mt-2 text-xs font-medium ${currentStep >= step ? 'text-gray-900' : 'text-gray-400'}`}>
                                {steps[step - 1]}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// Loading Screen
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const messages = ["Creating your workspace...", "Setting up your shop...", "Configuring features...", "Almost ready..."];
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 500);
                    return 100;
                }
                return prev + 1;
            });
        }, 80);
        return () => clearInterval(interval);
    }, [onComplete]);

    useEffect(() => {
        setMessageIndex(Math.min(Math.floor(progress / 25), 3));
    }, [progress]);

    return (
        <div className="flex w-screen min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700">
            <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                <p className="text-xl font-medium mb-4">{messages[messageIndex]}</p>
                <div className="w-64 h-2 bg-white/20 rounded-full mx-auto">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoadingScreen, setShowLoadingScreen] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [checkingSlug, setCheckingSlug] = useState(false);

    const [data, setData] = useState<RegistrationData>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        role: "",
        heardFrom: "",
        shopName: "",
        shopSlug: "",
        teamSize: "",
        currentSystem: "",
        mainFocus: [],
    });

    const updateData = (updates: Partial<RegistrationData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    // Auto-generate slug from shop name
    useEffect(() => {
        if (currentStep === 3 && data.shopName) {
            const slug = data.shopName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .slice(0, 30);
            updateData({ shopSlug: slug });
        }
    }, [data.shopName, currentStep]);

    // Check slug availability
    useEffect(() => {
        if (!data.shopSlug || data.shopSlug.length < 3) {
            setSlugAvailable(null);
            return;
        }
        const checkSlug = setTimeout(async () => {
            setCheckingSlug(true);
            try {
                const res = await fetch(`/api/register/check-slug?slug=${data.shopSlug}`);
                const result = await res.json();
                setSlugAvailable(result.available);
            } catch {
                setSlugAvailable(null);
            } finally {
                setCheckingSlug(false);
            }
        }, 500);
        return () => clearTimeout(checkSlug);
    }, [data.shopSlug]);

    // Step 1: Create Account
    const handleStep1 = async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/register/step-1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: data.name, email: data.email, password: data.password, phone: data.phone }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            updateData({ userId: result.userId });
            setCurrentStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Persona (no API call, just move forward)
    const handleStep2 = () => {
        if (!data.role) return;
        setCurrentStep(3);
    };

    // Step 3: Identity (Create Organization)
    const handleStep3 = async () => {
        if (!slugAvailable) return;
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/register/step-2", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: data.userId,
                    shopName: data.shopName,
                    shopSlug: data.shopSlug,
                    currency: "MYR",
                }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            updateData({ organizationId: result.organizationId });
            setCurrentStep(4);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Maturity (no API call, just move forward)
    const handleStep4 = () => {
        if (!data.teamSize || !data.currentSystem) return;
        setCurrentStep(5);
    };

    // Step 5: Setup (Save all metadata and complete)
    const handleStep5 = async () => {
        setIsLoading(true);
        setError("");
        try {
            await fetch("/api/register/step-3", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId: data.organizationId,
                    teamSize: data.teamSize,
                    printTypes: data.mainFocus,
                    currentSystem: data.currentSystem,
                    role: data.role,
                    heardFrom: data.heardFrom,
                }),
            });
            setShowLoadingScreen(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFocus = (type: string) => {
        const current = data.mainFocus;
        if (current.includes(type)) {
            updateData({ mainFocus: current.filter((t) => t !== type) });
        } else {
            updateData({ mainFocus: [...current, type] });
        }
    };

    if (showLoadingScreen) {
        return <LoadingScreen onComplete={() => router.push("/")} />;
    }

    const stepTitles = ["Create your account", "Tell us about yourself", "Set up your identity", "Business maturity", "Configure your setup"];
    const stepDescriptions = ["Secure your login credentials", "Help us personalize your experience", "Create your unique shop URL", "Help us understand your business", "Choose your printing focus"];

    return (
        <div className="flex w-screen flex-wrap text-slate-800 min-h-screen">
            {/* Left Side - Form */}
            <div className="flex w-full flex-col md:w-1/2 bg-white overflow-y-auto">
                <div className="flex justify-center py-6 md:justify-start md:pl-12">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        LinkPrintShop
                    </Link>
                </div>

                <div className="my-auto mx-auto flex flex-col justify-center pt-2 md:justify-start lg:w-[42rem] px-6 pb-8">
                    <div className="flex w-full flex-col rounded-2xl bg-white px-2 sm:px-8">
                        <StepIndicator currentStep={currentStep} setCurrentStep={setCurrentStep} />

                        <h2 className="font-semibold text-2xl text-gray-800 mb-1">Create your account</h2>
                        <p className="text-gray-500 mb-6">Start your 14-day free trial</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Step 1: Account */}
                        {currentStep === 1 && (
                            <div className="space-y-4 pb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => updateData({ name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Jason Lee"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => updateData({ email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="boss@eastmy.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={data.password}
                                            onChange={(e) => updateData({ password: e.target.value })}
                                            className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Min. 8 characters"
                                            minLength={8}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={data.confirmPassword}
                                            onChange={(e) => updateData({ confirmPassword: e.target.value })}
                                            className={`w-full px-4 py-3 pr-16 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${data.confirmPassword && data.password !== data.confirmPassword
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-300'
                                                }`}
                                            placeholder="Confirm your password"
                                        />
                                        {data.confirmPassword && data.password !== data.confirmPassword && (
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-sm">✗</span>
                                        )}
                                        {data.confirmPassword && data.password === data.confirmPassword && data.password.length >= 8 && (
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
                                        )}
                                    </div>
                                    {data.confirmPassword && data.password !== data.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => updateData({ phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+6012-3456789"
                                    />
                                </div>
                                <button
                                    onClick={handleStep1}
                                    disabled={isLoading || !data.name || !data.email || !data.password || !data.confirmPassword || data.password !== data.confirmPassword || data.password.length < 8 || !data.phone}
                                    className="w-full flex items-center justify-center py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {isLoading ? "Creating..." : "Continue"}
                                </button>
                                <p className="text-center text-sm text-gray-500">
                                    Already have an account? <Link href="/signin" className="text-blue-600 font-medium">Sign in</Link>
                                </p>
                            </div>
                        )}

                        {/* Step 2: Persona */}
                        {currentStep === 2 && (
                            <div className="space-y-5 pb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">What is your role?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: "admin", label: "Business Owner" },
                                            { value: "manager", label: "Manager / Admin" },
                                            { value: "staff", label: "Designer / Production" },
                                            { value: "reseller", label: "Reseller / Agent" },
                                        ].map((r) => (
                                            <button
                                                key={r.value}
                                                type="button"
                                                onClick={() => updateData({ role: r.value })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${data.role === r.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <p className="font-semibold">{r.label}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <CustomDropdown
                                    label="Where did you hear about us?"
                                    value={data.heardFrom}
                                    onChange={(value) => updateData({ heardFrom: value })}
                                    options={[
                                        { value: "facebook", label: "Facebook / TikTok" },
                                        { value: "friend", label: "Friend Referral" },
                                        { value: "google", label: "Google Search" },
                                        { value: "other", label: "Other" },
                                    ]}
                                />

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setCurrentStep(1)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium">Back</button>
                                    <button
                                        onClick={handleStep2}
                                        disabled={!data.role}
                                        className="flex-[2] py-3 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-50"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Identity */}
                        {currentStep === 3 && (
                            <div className="space-y-4 pb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">What is your Shop Name?</label>
                                    <input
                                        type="text"
                                        value={data.shopName}
                                        onChange={(e) => updateData({ shopName: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="EastMy Printing"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your LinkPrint URL</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={data.shopSlug}
                                            onChange={(e) => updateData({ shopSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="eastmy"
                                        />
                                        <span className="inline-flex items-center px-4 bg-gray-100 border border-l-0 border-gray-300 rounded-r-xl text-gray-500 text-sm">.linkprint.com</span>
                                    </div>
                                    <div className="mt-1 text-xs">
                                        {checkingSlug && <span className="text-gray-500">Checking...</span>}
                                        {slugAvailable === true && <span className="text-green-600">Available</span>}
                                        {slugAvailable === false && <span className="text-red-600">Already taken</span>}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setCurrentStep(2)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium">Back</button>
                                    <button
                                        onClick={handleStep3}
                                        disabled={isLoading || !data.shopName || !slugAvailable}
                                        className="flex-[2] py-3 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-50"
                                    >
                                        {isLoading ? "Setting up..." : "Continue"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Maturity */}
                        {currentStep === 4 && (
                            <div className="space-y-5 pb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">How big is your team?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: "solo", label: "Just Me (Solo)" },
                                            { value: "small", label: "2 - 5 People" },
                                            { value: "growing", label: "6 - 20 People" },
                                            { value: "factory", label: "20+ People" },
                                        ].map((s) => (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => updateData({ teamSize: s.value })}
                                                className={`p-4 rounded-xl border-2 text-center transition-all ${data.teamSize === s.value ? "border-gray-900 bg-gray-50" : "border-gray-200"
                                                    }`}
                                            >
                                                <p className="font-medium">{s.label}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <CustomDropdown
                                    label="What are you using right now?"
                                    value={data.currentSystem}
                                    onChange={(value) => updateData({ currentSystem: value })}
                                    options={[
                                        { value: "excel", label: "Excel / Google Sheets" },
                                        { value: "paper", label: "Pen & Paper / Logbook" },
                                        { value: "accounting", label: "Accounting Software (SQL / AutoCount)" },
                                        { value: "other", label: "Other SaaS" },
                                    ]}
                                />

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setCurrentStep(3)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium">Back</button>
                                    <button
                                        onClick={handleStep4}
                                        disabled={!data.teamSize || !data.currentSystem}
                                        className="flex-[2] py-3 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-50"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Setup */}
                        {currentStep === 5 && (
                            <div className="space-y-5 pb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">What is your main printing focus? <span className="text-gray-400">(Select all that apply)</span></label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: "large_format", label: "Large Format", desc: "Banners, Billboards, Stickers" },
                                            { value: "apparel", label: "Apparel & Textile", desc: "T-Shirts, Uniforms, DTF" },
                                            { value: "digital", label: "Digital & Offset", desc: "Business Cards, Flyers, Booklets" },
                                            { value: "gifts", label: "Corporate Gifts", desc: "Mugs, Lanyards, Trophies" },
                                        ].map((f) => (
                                            <button
                                                key={f.value}
                                                type="button"
                                                onClick={() => toggleFocus(f.value)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${data.mainFocus.includes(f.value) ? "border-gray-900 bg-gray-50" : "border-gray-200"
                                                    }`}
                                            >
                                                <p className="font-semibold">{f.label}</p>
                                                <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setCurrentStep(4)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium">Back</button>
                                    <button
                                        onClick={handleStep5}
                                        disabled={isLoading || data.mainFocus.length === 0}
                                        className="flex-[2] py-3 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-50"
                                    >
                                        {isLoading ? "Completing..." : "Complete Setup"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side - Animated Showcase */}
            <div className="relative hidden h-screen select-none flex-col justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 md:flex md:w-1/2 overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -top-20 -right-20 animate-pulse" />
                    <div className="absolute w-64 h-64 bg-cyan-300 rounded-full blur-3xl bottom-20 left-10 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10 py-12 px-10 text-white">
                    <span className="inline-block rounded-full bg-white/20 backdrop-blur px-4 py-2 font-medium text-sm mb-6">Step {currentStep} of 5</span>

                    {currentStep === 1 && (
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Your print shop,<br />
                                <span className="text-cyan-300">powered by cloud.</span>
                            </h2>
                            <p className="text-xl text-blue-100 leading-relaxed">
                                Join 500+ Malaysian print shops already using LinkPrint.
                            </p>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Personalized for<br />
                                <span className="text-cyan-300">how you work.</span>
                            </h2>
                            <p className="text-xl text-blue-100 leading-relaxed">
                                We'll customize your dashboard based on your role.
                            </p>
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Your unique<br />
                                <span className="text-cyan-300">shop identity.</span>
                            </h2>
                            <p className="text-xl text-blue-100 leading-relaxed">
                                Create a memorable URL for your customers.
                            </p>
                        </div>
                    )}
                    {currentStep === 4 && (
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                We understand<br />
                                <span className="text-cyan-300">your business.</span>
                            </h2>
                            <p className="text-xl text-blue-100 leading-relaxed">
                                This helps us recommend the best plan for you.
                            </p>
                        </div>
                    )}
                    {currentStep === 5 && (
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Almost there!<br />
                                <span className="text-cyan-300">Final configuration.</span>
                            </h2>
                            <p className="text-xl text-blue-100 leading-relaxed">
                                Choose your printing focus to complete setup.
                            </p>
                        </div>
                    )}

                    {/* App Preview Images */}
                    <div className="mt-8 relative">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/20">
                            <img
                                src={currentStep <= 3 ? "/images/signup-preview-2.png" : "/images/signup-preview-1.png"}
                                alt="LinkPrintShop Dashboard Preview"
                                className="w-full h-auto transition-all duration-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
