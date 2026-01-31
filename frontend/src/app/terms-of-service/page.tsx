import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground">
                        By accessing and using AI Counsellor, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                        If you do not agree with any of these terms, you are prohibited from using or accessing this site and our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                    <p className="text-muted-foreground mb-4">
                        Permission is granted to temporarily download one copy of the materials (information or software) on AI Counsellor&apos;s website for personal,
                        non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li>Modify or copy the materials;</li>
                        <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                        <li>Attempt to decompile or reverse engineer any software contained on AI Counsellor&apos;s website;</li>
                        <li>Remove any copyright or other proprietary notations from the materials; or</li>
                        <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
                    <p className="text-muted-foreground">
                        The materials on AI Counsellor&apos;s website are provided on an &apos;as is&apos; basis. AI Counsellor makes no warranties, expressed or implied,
                        and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability,
                        fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
                    <p className="text-muted-foreground">
                        In no event shall AI Counsellor or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit,
                        or due to business interruption) arising out of the use or inability to use the materials on AI Counsellor&apos;s website, even if AI Counsellor
                        or an AI Counsellor authorized representative has been notified orally or in writing of the possibility of such damage.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Revisions and Errata</h2>
                    <p className="text-muted-foreground">
                        The materials appearing on AI Counsellor&apos;s website could include technical, typographical, or photographic errors.
                        AI Counsellor does not warrant that any of the materials on its website are accurate, complete, or current.
                        AI Counsellor may make changes to the materials contained on its website at any time without notice.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                    <p className="text-muted-foreground">
                        If you have any questions about these Terms of Service, please contact us at amarmahakal92@gmail.com.
                    </p>
                </section>

                <p className="text-sm text-muted-foreground mt-8">
                    Last updated: {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}
