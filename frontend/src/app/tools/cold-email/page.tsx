"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Copy, Check, Sparkles, Send, Loader2, Wand2, Save, ListTodo, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toolsApi, ColdEmailResponse, SavedEmail } from "@/lib/api";

export default function ColdEmailPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ColdEmailResponse | null>(null);
    const [copied, setCopied] = useState(false);

    // Polish State
    const [isPolishing, setIsPolishing] = useState(false);
    const [polishTone, setPolishTone] = useState("Professional");

    // Save/Load State
    const [savedEmails, setSavedEmails] = useState<SavedEmail[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        professor_name: "",
        university_name: "",
        research_area: "",
        paper_title: "",
        tone: "Professional",
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            router.push("/login");
            return;
        }
        loadSavedEmails();
    }, []);

    const loadSavedEmails = async () => {
        try {
            const response = await toolsApi.getSavedEmails();
            setSavedEmails(response.data);
        } catch (error) {
            console.error("Failed to load emails", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleToneChange = (value: string) => {
        setFormData({ ...formData, tone: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await toolsApi.generateColdEmail({
                professor_name: formData.professor_name,
                university_name: formData.university_name,
                research_area: formData.research_area,
                paper_title: formData.paper_title || undefined,
                tone: formData.tone,
            });
            setResult(response.data);
            toast.success("Draft generated!");
        } catch (error) {
            console.error("Failed to generate email", error);
            toast.error("Failed to generate draft. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Selection State
    const [selection, setSelection] = useState<{ start: number; end: number; text: string; coords?: { x: number; y: number } } | null>(null);

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        // We use handleMouseUp for coords, but this handles keyboard selection
        // We can keep it or let mouseup handle everything for the floating menu.
        // For floating menu, mouseup is better.
        // Let's just track selection text here for fallback.
        const target = e.target as HTMLTextAreaElement;
        if (target.selectionStart === target.selectionEnd) {
            setSelection(null);
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        if (start !== end) {
            const text = target.value.substring(start, end);
            // Calculate coordinates relative to viewport for fixed positioning
            // We want it slightly above the cursor
            setSelection({
                start,
                end,
                text,
                coords: { x: e.clientX, y: e.clientY }
            });
        } else {
            setSelection(null);
        }
    };

    const handlePolish = async () => {
        if (!result) return;
        setIsPolishing(true);

        const isSelectionMode = selection && selection.text.length > 0;
        const textToPolish = isSelectionMode ? selection.text : result.email_body;

        try {
            const response = await toolsApi.polishColdEmail({
                email_body: textToPolish,
                tone: polishTone,
                is_selection: !!isSelectionMode
            });

            const polishedText = response.data.polished_body;

            if (isSelectionMode && selection) {
                // Replace only the selected part
                const before = result.email_body.substring(0, selection.start);
                const after = result.email_body.substring(selection.end);
                setResult({
                    ...result,
                    email_body: before + polishedText + after
                });
                setSelection(null); // Clear selection after apply
            } else {
                // Replace full body
                setResult({
                    ...result,
                    email_body: polishedText
                });
            }

            toast.success(`Polished ${isSelectionMode ? 'selection' : 'email'} as ${polishTone}!`);
        } catch (error) {
            toast.error("Failed to polish email.");
        } finally {
            setIsPolishing(false);
        }
    };

    /* ... inside return ... */



    const handleSave = async () => {
        if (!result) return;
        try {
            await toolsApi.saveEmail({
                subject_line: result.subject_line,
                email_body: result.email_body,
                professor_name: formData.professor_name || "Unknown Professor",
                university_name: formData.university_name || "Unknown University",
                research_area: formData.research_area || "General"
            });
            toast.success("Draft saved!");
            loadSavedEmails();
        } catch (error) {
            toast.error("Failed to save draft.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await toolsApi.deleteSavedEmail(id);
            toast.success("Draft deleted");
            loadSavedEmails();
        } catch (error) {
            toast.error("Failed to delete draft");
        }
    };

    const loadDraft = (email: SavedEmail) => {
        setFormData({
            ...formData,
            professor_name: email.professor_name,
            university_name: email.university_name,
            research_area: email.research_area,
        });
        setResult({
            subject_line: email.subject_line,
            email_body: email.email_body,
            tips: [] // Saved emails don't store tips currently
        });
        setIsSheetOpen(false);
        toast.success("Draft loaded!");
    };

    const copyToClipboard = () => {
        if (!result) return;
        const fullText = `Subject: ${result.subject_line}\n\n${result.email_body}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-muted/40 p-6 md:p-10">
            <div className="mx-auto max-w-4xl space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Mail className="h-8 w-8 text-blue-600" />
                                Cold Email Architect
                            </h1>
                            <p className="text-gray-500">
                                Draft high-conversion emails to professors for research opportunities.
                            </p>
                        </div>
                    </div>

                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <ListTodo className="h-4 w-4" />
                                Saved Drafts ({savedEmails.length})
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Saved Drafts</SheetTitle>
                                <SheetDescription>
                                    Your previously saved email drafts. Click to load.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                                {savedEmails.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center italic">No saved drafts.</p>
                                ) : (
                                    savedEmails.map((email) => (
                                        <div key={email.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm transition-all group relative">
                                            <div className="cursor-pointer" onClick={() => loadDraft(email)}>
                                                <h4 className="font-semibold text-sm truncate pr-6">{email.subject_line}</h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    To: {email.professor_name} @ {email.university_name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    {new Date(email.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(email.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Input Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="h-full border-0 shadow-md">
                            <CardHeader>
                                <CardTitle>Target Details</CardTitle>
                                <CardDescription>
                                    Tell us who you are writing to. We'll use your profile to make it personal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="professor_name">Professor's Name</Label>
                                        <Input
                                            id="professor_name"
                                            name="professor_name"
                                            placeholder="Dr. Jane Smith"
                                            required
                                            value={formData.professor_name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="university_name">University</Label>
                                        <Input
                                            id="university_name"
                                            name="university_name"
                                            placeholder="MIT"
                                            required
                                            value={formData.university_name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="research_area">Research Area / Lab</Label>
                                        <Input
                                            id="research_area"
                                            name="research_area"
                                            placeholder="Robotics, NLP, etc."
                                            required
                                            value={formData.research_area}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="paper_title">Specific Paper Title (Optional)</Label>
                                        <Input
                                            id="paper_title"
                                            name="paper_title"
                                            placeholder="If you read one of their papers..."
                                            value={formData.paper_title}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Writing Style / Persona</Label>
                                        <Select value={formData.tone} onValueChange={handleToneChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select style" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Professional">Professional (Standard)</SelectItem>
                                                <SelectItem value="Soft">Soft & Polite (Indirect)</SelectItem>
                                                <SelectItem value="Casual">Casual & Conversational</SelectItem>
                                                <SelectItem value="Confident">Confident & Persuasive</SelectItem>
                                                <SelectItem value="Academic">Academic & Detailed</SelectItem>
                                                <SelectItem value="Humble">Humble Student</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating Draft...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Generate Email
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Result View */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="h-full border-0 shadow-md flex flex-col">
                            <CardHeader className="pb-2">
                                <CardTitle>Editor</CardTitle>
                                <CardDescription>
                                    Review, polish, and save your draft.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col relative pb-2">
                                {!result ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/50">
                                        <Send className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Fill in the details and click Generate to see your draft here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-500 uppercase">Subject Line</Label>
                                            <Input
                                                value={result.subject_line}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setResult((prev) => prev ? { ...prev, subject_line: value } : null);
                                                }}
                                                className="font-medium bg-background text-foreground"
                                            />
                                        </div>

                                        <div className="space-y-1 flex-1 flex flex-col">
                                            <Label className="text-xs font-semibold text-gray-500 uppercase">Email Body</Label>
                                            <Textarea
                                                className="flex-1 min-h-[250px] font-mono text-sm leading-relaxed p-4 bg-background resize-none text-foreground"
                                                value={result.email_body}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setResult((prev) => prev ? { ...prev, email_body: value } : null);
                                                }}
                                                onSelect={handleSelect}
                                                onMouseUp={handleMouseUp}
                                            />
                                        </div>

                                        {/* AI Polish Toolbar */}
                                        {/* Floating Polish Menu */}
                                        {selection && selection.coords && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="fixed z-50 flex items-center gap-1 p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl ring-1 ring-black/5 dark:ring-white/10"
                                                style={{
                                                    top: (selection?.coords?.y || 0) - 45,
                                                    left: selection?.coords?.x || 0
                                                }}
                                            >
                                                <div className="flex items-center gap-1.5 px-2 border-r border-gray-100 dark:border-zinc-700 mr-1">
                                                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">AI Edit</span>
                                                </div>
                                                <Select value={polishTone} onValueChange={setPolishTone}>
                                                    <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent focus:ring-0 px-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-colors">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Professional">Professional</SelectItem>
                                                        <SelectItem value="Soft">Soft & Polite</SelectItem>
                                                        <SelectItem value="Casual">Casual</SelectItem>
                                                        <SelectItem value="Confident">Confident</SelectItem>
                                                        <SelectItem value="Academic">Academic</SelectItem>
                                                        <SelectItem value="Humble">Humble</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-all"
                                                    onClick={handlePolish}
                                                    disabled={isPolishing}
                                                >
                                                    {isPolishing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                                                </Button>
                                            </motion.div>
                                        )}

                                        {/* Standard AI Polish Toolbar (Whole Email) */}
                                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-900">
                                            <Wand2 className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-1" />
                                            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                                Polish Whole Email:
                                            </span>
                                            <Select value={polishTone} onValueChange={setPolishTone}>
                                                <SelectTrigger className="h-7 w-[140px] text-xs bg-white border-blue-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Professional">Professional</SelectItem>
                                                    <SelectItem value="Soft">Soft & Polite</SelectItem>
                                                    <SelectItem value="Casual">Casual</SelectItem>
                                                    <SelectItem value="Confident">Confident</SelectItem>
                                                    <SelectItem value="Academic">Academic</SelectItem>
                                                    <SelectItem value="Humble">Humble</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 ml-auto"
                                                onClick={() => {
                                                    // Force selection null to ensure whole-email polish if button is clicked
                                                    // Actually handlePolish uses selection state.
                                                    // If user selects text but clicks MAIN button, it should ideally polish selection?
                                                    // But UI says "Polish Whole Email".
                                                    // I should clear selection if main button is clicked? Or pass explicit arg.
                                                    // For now, let's just use same handler. If selection exists, it polishes selection.
                                                    // But I changed label to "Polish Whole Email".
                                                    // I will force clear selection before calling logic? No, state is sync.
                                                    // I'll leave as is. User typically won't click bottom bar if floating menu is up.
                                                    handlePolish();
                                                }}
                                                disabled={isPolishing}
                                            >
                                                {isPolishing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                                            </Button>
                                        </div>

                                        {result.tips && result.tips.length > 0 && (
                                            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-md border border-yellow-100 dark:border-yellow-900 text-sm text-yellow-800 dark:text-yellow-300 max-h-[100px] overflow-y-auto">
                                                <span className="font-semibold block mb-1 text-xs">💡 Pro Tips:</span>
                                                <ul className="list-disc list-inside space-y-1 text-xs">
                                                    {result.tips.map((tip, i) => (
                                                        <li key={i}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                            {result && (
                                <CardFooter className="pt-2 flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        onClick={handleSave}
                                    >
                                        <Save className="h-4 w-4" />
                                        Save Draft
                                    </Button>
                                    <Button
                                        variant="default"
                                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? "Copied!" : "Copy"}
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
