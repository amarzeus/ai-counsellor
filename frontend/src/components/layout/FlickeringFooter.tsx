"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { ClassValue, clsx } from "clsx";
import * as Color from "color-bits";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

// --- Utility Functions ---

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getRGBA = (
    cssColor: React.CSSProperties["color"],
    fallback: string = "rgba(180, 180, 180)",
): string => {
    if (typeof window === "undefined") return fallback;
    if (!cssColor) return fallback;

    try {
        if (typeof cssColor === "string" && cssColor.startsWith("var(")) {
            const element = document.createElement("div");
            element.style.color = cssColor;
            document.body.appendChild(element);
            const computedColor = window.getComputedStyle(element).color;
            document.body.removeChild(element);
            return Color.formatRGBA(Color.parse(computedColor));
        }
        return Color.formatRGBA(Color.parse(cssColor));
    } catch (e) {
        console.error("Color parsing failed:", e);
        return fallback;
    }
};

export const colorWithOpacity = (color: string, opacity: number): string => {
    if (!color.startsWith("rgb")) return color;
    return Color.formatRGBA(Color.alpha(Color.parse(color), opacity));
};

// --- Icons ---

export const Icons = {
    // Using a GraduationCap-like icon or simple text as Logo fallback if needed, 
    // but we can use the project's existing branding if available. 
    // For now, using a simple placeholder generic to the "AI" theme or keeping the one from the snippet if it fits.
    // The snippet had a specific logo, let's replace it with a generic AI Counsellor one or keep it simple.
    logo: ({ className }: { className?: string }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("size-6", className)}
        >
            <path d="M22 10v6M2 10v6" />
            <path d="M20 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
            <path d="m15 22-2-6h-2l-2 6" />
            <path d="m8 22 2-6h4l2 6" />
        </svg>
    ),
    // Minimalist trust badges from the original snippet - keeping them as "Trust Signals"
    // If they are too specific (SOC2, etc), we might want to swap valid ones later.
    // For this tasks purpose, visual parity with the requested premium component is key.
    soc2: ({ className }: { className?: string }) => (
        // ... (Keeping original SVGs for visual fidelity as requested)
        <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-8 opacity-70 hover:opacity-100 transition-opacity", className)}>
            <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="#E5E7EB" fillOpacity="0.2" />
            <path d="M15 30C13 30 12 28 12 26C12 24 13 23 15 23C16 23 17 24 17 26L16 26C16 25 15.5 24 15 24C14 24 13 25 13 26C13 27 14 28 15 28C16 28 17 27 17 26" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 30C18 30 17 28 17 26C17 24 18 23 20 23C22 23 23 24 23 26C23 28 22 30 20 30ZM20 29C21 29 22 28 22 26C22 24 21 23 20 23C19 23 18 24 18 26C18 28 19 29 20 29Z" fill="currentColor" />
            <path d="M25 30C24 30 23 29 23 26C23 24 24 23 25 23C26 23 27 24 27 26L26 26C26 25 25.5 24 25 24C24 24 23 25 23 26C23 27 24 28 25 28C26 28 27 27 27 26" stroke="currentColor" strokeWidth="1.5" />
            <text x="30" y="29" fontSize="8" fill="currentColor" fontFamily="sans-serif">2</text>
        </svg>
    ),
    soc2Dark: ({ className }: { className?: string }) => (
        <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-8 opacity-70 hover:opacity-100 transition-opacity", className)}>
            <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="#333" fillOpacity="0.5" />
            <path d="M15 30C13 30 12 28 12 26C12 24 13 23 15 23C16 23 17 24 17 26L16 26C16 25 15.5 24 15 24C14 24 13 25 13 26C13 27 14 28 15 28C16 28 17 27 17 26" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 30C18 30 17 28 17 26C17 24 18 23 20 23C22 23 23 24 23 26C23 28 22 30 20 30ZM20 29C21 29 22 28 22 26C22 24 21 23 20 23C19 23 18 24 18 26C18 28 19 29 20 29Z" fill="currentColor" />
            <path d="M25 30C24 30 23 29 23 26C23 24 24 23 25 23C26 23 27 24 27 26L26 26C26 25 25.5 24 25 24C24 24 23 25 23 26C23 27 24 28 25 28C26 28 27 27 27 26" stroke="currentColor" strokeWidth="1.5" />
            <text x="30" y="29" fontSize="8" fill="currentColor" fontFamily="sans-serif">2</text>
        </svg>
    ),
    // Simplified placeholders for other icons to save space but keep layout
    hipaa: ({ className }: { className?: string }) => <div className={cn("size-8 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold opacity-70", className)}>HIPAA</div>,
    hipaaDark: ({ className }: { className?: string }) => <div className={cn("size-8 rounded-full bg-muted/20 flex items-center justify-center text-[8px] font-bold opacity-70", className)}>HIPAA</div>,
    gdpr: ({ className }: { className?: string }) => <div className={cn("size-8 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold opacity-70", className)}>GDPR</div>,
    gdprDark: ({ className }: { className?: string }) => <div className={cn("size-8 rounded-full bg-muted/20 flex items-center justify-center text-[8px] font-bold opacity-70", className)}>GDPR</div>,
};

// --- Flickering Grid Component ---

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
    squareSize?: number;
    gridGap?: number;
    flickerChance?: number;
    color?: string;
    width?: number;
    height?: number;
    className?: string;
    maxOpacity?: number;
    text?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: number | string;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
    squareSize = 3,
    gridGap = 3,
    flickerChance = 0.2,
    color = "#B4B4B4",
    width,
    height,
    className,
    maxOpacity = 0.15,
    text = "",
    fontSize = 140,
    fontWeight = 600,
    ...props
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const memoizedColor = useMemo(() => {
        return getRGBA(color);
    }, [color]);

    const drawGrid = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            width: number,
            height: number,
            cols: number,
            rows: number,
            squares: Float32Array,
            dpr: number,
        ) => {
            ctx.clearRect(0, 0, width, height);

            const maskCanvas = document.createElement("canvas");
            maskCanvas.width = width;
            maskCanvas.height = height;
            const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
            if (!maskCtx) return;

            if (text) {
                maskCtx.save();
                maskCtx.scale(dpr, dpr);
                maskCtx.fillStyle = "white";
                // Using Inter or system fonts as fallback
                maskCtx.font = `${fontWeight} ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                maskCtx.textAlign = "center";
                maskCtx.textBaseline = "middle";
                maskCtx.fillText(text, width / (2 * dpr), height / (2 * dpr));
                maskCtx.restore();
            }

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * (squareSize + gridGap) * dpr;
                    const y = j * (squareSize + gridGap) * dpr;
                    const squareWidth = squareSize * dpr;
                    const squareHeight = squareSize * dpr;

                    const maskData = maskCtx.getImageData(
                        x,
                        y,
                        squareWidth,
                        squareHeight,
                    ).data;
                    const hasText = maskData.some(
                        (value, index) => index % 4 === 0 && value > 0,
                    );

                    const opacity = squares[i * rows + j];
                    const finalOpacity = hasText
                        ? Math.min(1, opacity * 3 + 0.4)
                        : opacity;

                    ctx.fillStyle = colorWithOpacity(memoizedColor, finalOpacity);
                    ctx.fillRect(x, y, squareWidth, squareHeight);
                }
            }
        },
        [memoizedColor, squareSize, gridGap, text, fontSize, fontWeight],
    );

    const setupCanvas = useCallback(
        (canvas: HTMLCanvasElement, width: number, height: number) => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const cols = Math.ceil(width / (squareSize + gridGap));
            const rows = Math.ceil(height / (squareSize + gridGap));

            const squares = new Float32Array(cols * rows);
            for (let i = 0; i < squares.length; i++) {
                squares[i] = Math.random() * maxOpacity;
            }

            return { cols, rows, squares, dpr };
        },
        [squareSize, gridGap, maxOpacity],
    );

    const updateSquares = useCallback(
        (squares: Float32Array, deltaTime: number) => {
            for (let i = 0; i < squares.length; i++) {
                if (Math.random() < flickerChance * deltaTime) {
                    squares[i] = Math.random() * maxOpacity;
                }
            }
        },
        [flickerChance, maxOpacity],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let gridParams: ReturnType<typeof setupCanvas>;

        const updateCanvasSize = () => {
            const newWidth = width || container.clientWidth;
            const newHeight = height || container.clientHeight;
            setCanvasSize({ width: newWidth, height: newHeight });
            gridParams = setupCanvas(canvas, newWidth, newHeight);
        };

        updateCanvasSize();

        let lastTime = 0;
        const animate = (time: number) => {
            if (!isInView) return;

            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            updateSquares(gridParams.squares, deltaTime);
            drawGrid(
                ctx,
                canvas.width,
                canvas.height,
                gridParams.cols,
                gridParams.rows,
                gridParams.squares,
                gridParams.dpr,
            );
            animationFrameId = requestAnimationFrame(animate);
        };

        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });

        resizeObserver.observe(container);

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0 },
        );

        intersectionObserver.observe(canvas);

        if (isInView) {
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
        };
    }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

    return (
        <div
            ref={containerRef}
            className={cn(`h-full w-full ${className}`)}
            {...props}
        >
            <canvas
                ref={canvasRef}
                className="pointer-events-none"
                style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                }}
            />
        </div>
    );
};

export function useMediaQuery(query: string) {
    const [value, setValue] = useState(false);

    useEffect(() => {
        function checkQuery() {
            const result = window.matchMedia(query);
            setValue(result.matches);
        }
        checkQuery();
        window.addEventListener("resize", checkQuery);
        const mediaQuery = window.matchMedia(query);
        mediaQuery.addEventListener("change", checkQuery);
        return () => {
            window.removeEventListener("resize", checkQuery);
            mediaQuery.removeEventListener("change", checkQuery);
        };
    }, [query]);

    return value;
}

// --- Configuration adapted for AI Counsellor ---

export const siteConfig = {
    hero: {
        description:
            "Your intelligent companion for study abroad decisions. Smart, calm, and executed with precision.",
    },
    footerLinks: [
        {
            title: "Company",
            links: [
                { id: 1, title: "About", url: "/about" },
                { id: 2, title: "Contact", url: "/contact" },
                { id: 3, title: "Privacy", url: "/privacy-policy" },
                { id: 4, title: "Terms", url: "/terms-of-service" },
            ],
        },
        {
            title: "Product",
            links: [
                { id: 5, title: "Counsellor", url: "/counsellor" },
                { id: 6, title: "Universities", url: "/universities" },
                { id: 7, title: "Pricing", url: "#" },
            ],
        },
        {
            title: "Resources",
            links: [
                { id: 9, title: "Blog", url: "#" },
                { id: 10, title: "Guide", url: "#" },
                { id: 11, title: "FAQ", url: "/faq" },
            ],
        },
    ],
};

// --- Main Flickering Footer Component ---

export const FlickeringFooter = () => {
    const tablet = useMediaQuery("(max-width: 1024px)");

    return (
        <footer id="footer" className="w-full pb-0 bg-background border-t border-border/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-10 max-w-6xl mx-auto">
                <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Icons.logo className="text-primary group-hover:text-primary/80 transition-colors" />
                        <p className="text-xl font-semibold text-foreground tracking-tight">AI Counsellor</p>
                    </Link>
                    <p className="tracking-tight text-muted-foreground font-medium text-sm leading-relaxed">
                        {siteConfig.hero.description}
                    </p>
                    <div className="flex items-center gap-2 dark:hidden">
                        <Icons.soc2 />
                        <Icons.hipaa />
                        <Icons.gdpr />
                    </div>
                    <div className="dark:flex items-center gap-2 hidden">
                        <Icons.soc2Dark />
                        <Icons.hipaaDark />
                        <Icons.gdprDark />
                    </div>
                </div>
                <div className="pt-10 md:pt-0 md:w-1/2">
                    <div className="flex flex-col items-start justify-start md:flex-row md:items-start md:justify-between gap-y-10 lg:pl-10">
                        {siteConfig.footerLinks.map((column, columnIndex) => (
                            <ul key={columnIndex} className="flex flex-col gap-y-3">
                                <li className="mb-2 text-sm font-semibold text-foreground">
                                    {column.title}
                                </li>
                                {column.links.map((link) => (
                                    <li
                                        key={link.id}
                                        className="group inline-flex cursor-pointer items-center justify-start gap-1 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Link href={link.url}>{link.title}</Link>
                                        <div className="flex size-3 items-center justify-center opacity-0 -translate-x-2 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                                            <ChevronRightIcon className="size-3" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-full h-48 md:h-64 relative mt-12 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-10" />
                <div className="absolute inset-x-0 bottom-0 top-0 mx-auto max-w-6xl">
                    <FlickeringGrid
                        text={tablet ? "AI Counsellor" : "Your Future, Decoded"}
                        fontSize={tablet ? 50 : 80}
                        className="h-full w-full"
                        squareSize={2}
                        gridGap={tablet ? 2 : 3}
                        color="#6B7280"
                        maxOpacity={0.2}
                        flickerChance={0.3}
                    />
                </div>
            </div>
        </footer>
    );
};
