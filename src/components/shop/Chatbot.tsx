"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MessageCircle, X, Send, Loader2, RefreshCcw, ArrowUpRight, RotateCcw, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerAuth } from "@/lib/customer-auth";
import { API } from "@/config/api";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

const PRESET_QUESTIONS = [
    "📦 Track My Order",
    "🌾 Millets for Diabetes",
    "🥣 How to Cook Millets",
    "🚚 Delivery & Shipping",
    "🔄 Return & Refund"
];

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { customer, isLoading: authLoading } = useCustomerAuth();

    // Auto scroll to latest message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isTyping]);

    // Initial greeting on open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            if (authLoading) return;

            const greeting = customer
                ? `Namaste ${customer.name || 'Friend'}! 🙏 Welcome to Millet Yard.\n\nI'm your AI superfood assistant. I can help you track your recent orders, recommend 100% unpolished millets for diabetes or gut health, and share authentic recipes. How can I help you today?`
                : "Namaste! 🙏 Welcome to Millet Yard.\n\nI'm your 24/7 AI Assistant. Ask me anything about our 100% unpolished millets, superfoods, cooking recipes, or type 'Track Order' with your phone number to check live delivery status! 📦";

            addBotMessage(greeting);
        }
    }, [isOpen, customer, authLoading, messages.length]);

    const addBotMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            text,
            sender: 'bot',
            timestamp: Date.now()
        }]);
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            text,
            sender: 'user',
            timestamp: Date.now()
        }]);
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        addUserMessage(text);
        setInputValue("");
        setIsTyping(true);

        try {
            const history = messages.map(m => ({
                role: m.sender,
                content: m.text
            }));

            const res = await fetch(API.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history })
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();
            addBotMessage(data.reply || "I am right here to help with your Millet Yard orders and nutrition queries.");
        } catch (error) {
            console.error(error);
            addBotMessage("Namaste! I'm temporarily having a connection hiccup. For instant order tracking or support, please share your 10-digit mobile number or write to support@milletyard.com.");
        } finally {
            setIsTyping(false);
        }
    };

    const handleResetChat = () => {
        setMessages([]);
    };

    // Helper to format text with Markdown bold (**text**), code highlights (`code`), Markdown links ([text](url)), and clickable emails
    const renderFormattedText = (text: string) => {
        // First split by markdown links [text](url) including mailto:
        const linkRegex = /\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:)[^\s)]+)\)/g;
        const segments: React.ReactNode[] = [];
        let lastIdx = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            if (match.index > lastIdx) {
                segments.push(parseInlineTokens(text.substring(lastIdx, match.index)));
            }
            const linkTitle = match[1];
            const linkHref = match[2];
            const isExternal = linkHref.startsWith('http');
            segments.push(
                <a
                    key={`link-${match.index}`}
                    href={linkHref}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-0.5 font-bold text-emerald-800 dark:text-emerald-300 underline underline-offset-2 hover:text-emerald-950 dark:hover:text-emerald-100 break-words bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded transition-colors"
                >
                    {linkTitle} {isExternal && <ArrowUpRight className="w-3 h-3 inline shrink-0" />}
                </a>
            );
            lastIdx = linkRegex.lastIndex;
        }

        if (lastIdx < text.length) {
            segments.push(parseInlineTokens(text.substring(lastIdx)));
        }

        return segments;
    };

    // Sub-helper for bold (**text**), code/badge (`code`), and quoted terms ('term')
    const parseInlineTokens = (subtext: string): React.ReactNode => {
        const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|'[^']+')/g;
        const parts = subtext.split(tokenRegex);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={i} className="font-bold text-slate-900 dark:text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code
                        key={i}
                        className="px-1.5 py-0.5 mx-0.5 rounded-md bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-mono text-[11px] sm:text-xs font-bold border border-emerald-300/60 dark:border-emerald-700/60 shadow-2xs"
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }
            if (part.startsWith("'") && part.endsWith("'") && part.length > 2 && /^\d+$/.test(part.slice(1, -1))) {
                return (
                    <span
                        key={i}
                        className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-100/90 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 font-mono text-[11px] sm:text-xs font-bold border border-amber-300/60 dark:border-amber-700/60"
                    >
                        {part.slice(1, -1)}
                    </span>
                );
            }
            return part;
        });
    };

    const renderMessageContent = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, idx) => (
            <div key={idx} className={line.trim() === '' ? 'h-2' : ''}>
                {renderFormattedText(line)}
            </div>
        ));
    };

    return (
        <>
            {/* Floating Launcher Button */}
            <div className="fixed bottom-20 right-4 sm:bottom-10 sm:right-6 md:bottom-16 md:right-8 lg:bottom-20 lg:right-8 z-50 flex items-center gap-2 group">
                {!isOpen && (
                    <div
                        className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-emerald-600/30 shadow-lg text-xs font-semibold text-emerald-950 dark:text-emerald-200 cursor-pointer hover:border-emerald-500 opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-300 ease-out"
                        onClick={() => setIsOpen(true)}
                    >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>Live Help & Track Order</span>
                    </div>
                )}
                <Button
                    className={cn(
                        "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-xl sm:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white border-2 border-emerald-400/50 shadow-emerald-950/40 relative opacity-90 hover:opacity-100 sm:opacity-100 flex items-center justify-center",
                        isOpen ? "rotate-90 scale-0 opacity-0 pointer-events-none" : "scale-100"
                    )}
                    onClick={() => setIsOpen(true)}
                    aria-label="Open Millet Yard AI Assistant"
                >
                    <Headset className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
                </Button>
            </div>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-20 right-3 sm:bottom-10 sm:right-6 md:bottom-16 md:right-8 lg:bottom-20 lg:right-8 w-[94vw] sm:w-[410px] bg-background border rounded-3xl shadow-2xl z-50 flex flex-col transition-all duration-300 origin-bottom-right overflow-hidden font-body border-emerald-900/20 max-h-[78vh] sm:max-h-[600px]",
                    isOpen ? "translate-y-0 opacity-100 scale-100 h-[530px] sm:h-[570px]" : "translate-y-10 opacity-0 scale-95 h-0 pointer-events-none"
                )}
            >
                {/* Header with White Logo Background (No green dot) */}
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 px-4 py-3 flex items-center justify-between text-white shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <div className="h-10 w-10 rounded-full bg-white shadow-sm border border-emerald-300/40 flex items-center justify-center p-1.5 overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="Millet Yard"
                                    width={34}
                                    height={34}
                                    className="object-contain w-full h-full"
                                    priority
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm leading-tight text-white">Millet Yard AI</h3>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-200 font-medium border border-emerald-500/30">
                                    Online
                                </span>
                            </div>
                            <p className="text-[11px] text-emerald-100/80">Live Order Tracking & Nutrition Guide</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/20 text-white rounded-full transition-colors"
                            onClick={handleResetChat}
                            title="Reset Chat"
                            aria-label="Reset Chat"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/20 text-white rounded-full transition-colors"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close Assistant"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50 dark:bg-stone-900/60" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                                msg.sender === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[88%] p-3.5 text-xs sm:text-sm shadow-sm leading-relaxed",
                                    msg.sender === 'user'
                                        ? "bg-emerald-800 text-white rounded-2xl rounded-br-xs"
                                        : "bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-stone-700 text-foreground rounded-2xl rounded-bl-xs"
                                )}
                            >
                                <div className="space-y-0.5 text-xs sm:text-sm leading-relaxed">
                                    {renderMessageContent(msg.text)}
                                </div>
                                <div
                                    className={cn(
                                        "text-[9px] mt-1 text-right opacity-70",
                                        msg.sender === 'user' ? "text-emerald-100" : "text-muted-foreground"
                                    )}
                                >
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-stone-700 p-3 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Preset Chips & Input Footer */}
                <div className="p-3 bg-background border-t border-stone-200/80 dark:border-stone-800">
                    {/* Horizontal scrollbar completely hidden via standard + vendor classes */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {PRESET_QUESTIONS.map(q => (
                            <button
                                key={q}
                                className="whitespace-nowrap rounded-full text-[11px] sm:text-xs h-7 px-2.5 sm:px-3 flex-shrink-0 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors dark:bg-slate-800 dark:text-emerald-300 dark:border-emerald-900/40"
                                onClick={() => handleSendMessage(q)}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(inputValue);
                        }}
                        className="flex gap-2 items-center relative"
                    >
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a query or phone number to track..."
                            className="flex-1 rounded-full bg-stone-100 dark:bg-slate-800 border-0 focus-visible:ring-2 focus-visible:ring-emerald-600 pl-4 py-5 pr-11 text-xs sm:text-sm shadow-inner"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className={cn(
                                "absolute right-1.5 h-8 w-8 rounded-full transition-all duration-200",
                                inputValue.trim() ? "bg-emerald-700 hover:bg-emerald-800 scale-100 text-white" : "bg-stone-300 dark:bg-slate-700 scale-90 pointer-events-none"
                            )}
                            disabled={!inputValue.trim()}
                        >
                            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                    <div className="text-[10px] text-center text-muted-foreground mt-2 flex flex-col justify-center items-center gap-0.5">
                        <span className="flex items-center gap-1 opacity-80">
                            <RefreshCcw className="h-2.5 w-2.5" /> Direct Shiprocket tracking & pure millet nutrition expertise
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
