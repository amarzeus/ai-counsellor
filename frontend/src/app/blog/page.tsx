import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Blog - AI Counsellor',
    description: 'Insights, tips, and guides for your study abroad journey.',
};

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-6">
            <div className="text-center max-w-2xl mx-auto space-y-6">
                <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4">
                    Coming Soon
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Study Abroad Insights
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    We are crafting expert articles, success stories, and step-by-step guides to help you navigate your international education journey. Stay tuned!
                </p>
                <div className="pt-8">
                    <Link href="/">
                        <Button variant="outline" size="lg">Return Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
