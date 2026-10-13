'use client';

import { useState, useEffect } from 'react';
import { getApprovedQuestions, submitQuestion } from '@/lib/actions';
import type { ProductQuestion } from '@/lib/types';
import { MessageCircleQuestion, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// ============================================================
// ❓ ASK A QUESTION (PUBLIC Q&A) CONFIGURATION
// ============================================================
//
// HOW TO HIDE/SHOW:
//   → Set SHOW_QA_SECTION = false to hide this section entirely
//
// NOTE: Currently uses local state (questions disappear on refresh).
// To persist questions, integrate with Supabase:
//   1. Create a `product_questions` table
//   2. Fetch questions by product_id on mount
//   3. Insert new questions on submit
//
// ============================================================

const SHOW_QA_SECTION = true;   // ← Set false to hide the Q&A section

interface ProductQAProps {
    productName: string;
    productId: string;
}

export default function ProductQA({ productName, productId }: ProductQAProps) {
    const [questions, setQuestions] = useState<ProductQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const data = await getApprovedQuestions(productId);
                setQuestions(data);
            } catch (error) {
                console.error("Failed to fetch questions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (productId) fetchQuestions();
    }, [productId]);

    if (!SHOW_QA_SECTION) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newQuestion.trim()) return;

        setIsSubmitting(true);

        const result = await submitQuestion(productId, newName.trim(), newQuestion.trim());

        if (result.success) {
            setNewName('');
            setNewQuestion('');
            setShowForm(false);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 5000);
        } else {
            console.error(result.message);
            alert('Failed to submit question. Please try again.');
        }

        setIsSubmitting(false);
    };

    const visibleQuestions = isExpanded ? questions : questions.slice(0, 2);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Questions & Answers</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {questions.length}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-full"
                    onClick={() => setShowForm(!showForm)}
                >
                    Ask a Question
                </Button>
            </div>

            {/* Submit Question Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl border bg-muted/30">
                    <Input
                        placeholder="Your name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-background"
                        required
                    />
                    <Textarea
                        placeholder={`Ask a question about ${productName}...`}
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="bg-background min-h-[80px]"
                        required
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isSubmitting} className="rounded-full">
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            {isSubmitting ? 'Submitting...' : 'Submit Question'}
                        </Button>
                    </div>
                </form>
            )}

            {/* Success Message */}
            {submitted && (
                <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 font-medium flex items-center gap-2">
                    <span className="text-lg">⏳</span>
                    Your question has been submitted and is pending admin approval. It will appear here once approved.
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="py-4 text-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : visibleQuestions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        No questions yet. Be the first to ask!
                    </div>
                ) : visibleQuestions.map(q => (
                    <div key={q.id} className="p-4 rounded-xl border bg-background hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                                {q.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">{q.customer_name}</span>
                                    <span className="text-[11px] text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-foreground font-medium">Q: {q.question}</p>
                                {q.answer && (
                                    <div className="mt-2 pl-3 border-l-2 border-primary/30">
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-primary">A:</span> {q.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More/Less */}
            {questions.length > 2 && (
                <Button
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? (
                        <><ChevronUp className="h-4 w-4 mr-1" /> Show Less</>
                    ) : (
                        <><ChevronDown className="h-4 w-4 mr-1" /> View All {questions.length} Questions</>
                    )}
                </Button>
            )}
        </div>
    );
}
