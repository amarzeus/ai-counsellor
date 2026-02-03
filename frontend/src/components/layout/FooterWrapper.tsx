"use client";

import { usePathname } from "next/navigation";
import { FlickeringFooter } from "./FlickeringFooter";

export default function FooterWrapper() {
    const pathname = usePathname();

    // Don't show footer on full-screen chat page or onboarding
    if (pathname === "/counsellor" || pathname === "/onboarding") {
        return null;
    }

    return <FlickeringFooter />;
}
