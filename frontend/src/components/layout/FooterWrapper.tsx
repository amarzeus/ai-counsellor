"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export default function FooterWrapper() {
    const pathname = usePathname();

    // Don't show footer on full-screen chat page
    if (pathname === "/counsellor") {
        return null;
    }

    return <Footer />;
}
