"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export default function FooterWrapper() {
    const pathname = usePathname();

    // Don't show footer on full-screen chat page or onboarding
    if (pathname === "/counsellor" || pathname === "/onboarding") {
        return null;
    }

    return <Footer />;
}
