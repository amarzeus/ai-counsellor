import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Study Guide - AI Counsellor',
    description: 'Comprehensive guides for university applications.',
};

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-6">
            <div className="text-center max-w-2xl mx-auto space-y-6">
                <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium mb-4">
                    Content In Progress
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                    The Ultimate Study Guide
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    From SOP writing tips to visa interview preparation, we are compiling the most comprehensive resource for study abroad aspirants.
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
