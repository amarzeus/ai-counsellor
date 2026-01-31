import Link from 'next/link';

export function Footer() {
    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-8 mt-12">
            <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center md:items-start gap-2">
                    <p className="text-sm text-muted-foreground text-center md:text-left">
                        © {new Date().getFullYear()} AI Counsellor. All rights reserved.
                    </p>
                </div>
                <nav className="flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground hover:text-primary transition-colors" href="/faq">
                        FAQ
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground hover:text-primary transition-colors" href="/contact">
                        Contact Us
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground hover:text-primary transition-colors" href="/privacy-policy">
                        Privacy Policy
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground hover:text-primary transition-colors" href="/terms-of-service">
                        Terms of Service
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
