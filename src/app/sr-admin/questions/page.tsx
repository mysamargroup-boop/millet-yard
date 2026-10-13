"use client";

import { useEffect, useState } from 'react';
import { getQuestionsAdmin, updateQuestionStatus, answerQuestion, deleteQuestion } from '@/lib/actions';
import type { ProductQuestion } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, MessageCircleQuestion, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function QuestionsAdminPage() {
    const [questions, setQuestions] = useState<ProductQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const { toast } = useToast();

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const data = await getQuestionsAdmin();
            setQuestions(data);
            // Initialize reply text state with existing answers
            const initialReplies: { [key: string]: string } = {};
            data.forEach(q => {
                if (q.answer) {
                    initialReplies[q.id] = q.answer;
                }
            });
            setReplyText(initialReplies);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            toast({
                title: "Error",
                description: "Failed to load questions",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
        try {
            const result = await updateQuestionStatus(id, newStatus);
            if (result.success) {
                setQuestions(questions.map(q =>
                    q.id === id ? { ...q, status: newStatus } : q
                ));
                toast({
                    title: "Success",
                    description: `Question ${newStatus}`,
                });
            } else {
                throw new Error(result.message || 'Failed to update status');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const result = await deleteQuestion(id);
            if (result.success) {
                setQuestions(questions.filter(q => q.id !== id));
                toast({
                    title: "Success",
                    description: "Question deleted successfully",
                });
            } else {
                throw new Error(result.message || 'Failed to delete question');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleReplySubmit = async (id: string) => {
        try {
            const answer = replyText[id] || '';
            const result = await answerQuestion(id, answer);
            if (result.success) {
                setQuestions(questions.map(q =>
                    q.id === id ? { ...q, answer } : q
                ));
                toast({
                    title: "Success",
                    description: "Reply saved",
                });
            } else {
                throw new Error(result.message || 'Failed to save reply');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Q&A Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage customer questions and provide answers
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-medium">
                    <MessageCircleQuestion className="w-5 h-5" />
                    <span>{questions.length} Total Questions</span>
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden border">
                {questions.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <MessageCircleQuestion className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No questions found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto admin-scrollbar">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[150px]">Customer</TableHead>
                                    <TableHead className="w-[150px]">Product ID</TableHead>
                                    <TableHead className="min-w-[300px]">Question & Answer</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.map((question) => (
                                    <TableRow key={question.id} className="group transition-colors">
                                        <TableCell>
                                            <div>
                                                <span className="font-medium text-foreground">{question.customer_name}</span>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {new Date(question.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded truncate block max-w-[150px]">
                                                {question.product_id}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-3 py-2">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">Q</div>
                                                    <p className="text-sm font-medium">{question.question}</p>
                                                </div>
                                                <div className="flex items-start gap-2 pl-4 border-l-2 border-muted ml-3">
                                                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-1">A</div>
                                                    <div className="flex-1 space-y-2">
                                                        <textarea
                                                            value={replyText[question.id] || ''}
                                                            onChange={(e) => setReplyText({ ...replyText, [question.id]: e.target.value })}
                                                            placeholder="Write an answer..."
                                                            className="w-full text-sm min-h-[60px] p-2 rounded-md border bg-background resize-none focus:ring-1 focus:ring-primary outline-none transition-all"
                                                        />
                                                        <div className="flex justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant={question.answer && question.answer === replyText[question.id] ? "outline" : "default"}
                                                                onClick={() => handleReplySubmit(question.id)}
                                                                className="h-8 text-xs"
                                                            >
                                                                {question.answer ? 'Update Answer' : 'Submit Answer'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit",
                                                    question.status === 'approved' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                                                        question.status === 'rejected' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                                                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                                )}>
                                                    {question.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                                    {question.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                                    {question.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                                                    {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                                                </span>

                                                <div className="flex sm:flex-col gap-1 mt-1">
                                                    {question.status !== 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[10px] px-2 bg-green-50/50 hover:bg-green-100 text-green-600 border-green-200"
                                                            onClick={() => handleStatusChange(question.id, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {question.status !== 'rejected' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[10px] px-2 bg-red-50/50 hover:bg-red-100 text-red-600 border-red-200"
                                                            onClick={() => handleStatusChange(question.id, 'rejected')}
                                                        >
                                                            Reject
                                                        </Button>
                                                    )}
                                                    {question.status !== 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 text-[10px] px-2 text-muted-foreground"
                                                            onClick={() => handleStatusChange(question.id, 'pending')}
                                                        >
                                                            Mark Pending
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(question.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
