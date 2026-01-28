"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroScroll() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const totalFrames = 80;

    useEffect(() => {
        let loadedCount = 0;
        const imgArray: HTMLImageElement[] = [];

        const loadImages = async () => {
            for (let i = 0; i < totalFrames; i++) {
                const img = new Image();
                const strIndex = i.toString().padStart(3, '0');
                img.src = `/hero-assets/Cinematic_transition_the_1080p_202601272137_${strIndex}.jpg`;

                await new Promise((resolve) => {
                    img.onload = () => {
                        loadedCount++;
                        setLoadingProgress(Math.round((loadedCount / totalFrames) * 100));
                        resolve(true);
                    };
                    img.onerror = () => {
                        console.error(`Failed to load image ${i}`);
                        resolve(true); // Continue anyway
                    }
                });
                imgArray.push(img);
            }
            setImages(imgArray);
        };

        loadImages();
    }, []);

    useEffect(() => {
        if (images.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initial draw
        const drawImage = (index: number) => {
            if (index >= 0 && index < images.length) {
                const img = images[index];

                // Calculate aspect ratio to cover
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const imgRatio = img.width / img.height;
                const canvasRatio = canvasWidth / canvasHeight;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (imgRatio > canvasRatio) {
                    drawHeight = canvasHeight;
                    drawWidth = canvasHeight * imgRatio;
                    offsetX = (canvasWidth - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    drawWidth = canvasWidth;
                    drawHeight = canvasWidth / imgRatio;
                    offsetX = 0;
                    offsetY = (canvasHeight - drawHeight) / 2;
                }

                // Use high quality smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
        };

        // Helper to get progress
        const getScrollProgress = () => {
            if (!containerRef.current) return 0;
            const { top } = containerRef.current.getBoundingClientRect();
            // The container height - viewport height is the scrollable distance
            const maxScroll = containerRef.current.offsetHeight - window.innerHeight;
            const scrolled = -top;

            return Math.max(0, Math.min(1, scrolled / maxScroll));
        };

        // Handle resize
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Redraw current frame
            const scrollProgress = getScrollProgress();
            const frameIndex = Math.min(
                totalFrames - 1,
                Math.floor(scrollProgress * totalFrames)
            );
            drawImage(frameIndex);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleScroll = () => {
            const progress = getScrollProgress();
            const frameIndex = Math.min(
                totalFrames - 1,
                Math.floor(progress * totalFrames)
            );
            requestAnimationFrame(() => drawImage(frameIndex));
        };

        window.addEventListener('scroll', handleScroll);

        // Initial draw
        drawImage(0);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [images]);

    return (
        <div ref={containerRef} className="relative h-[500vh] bg-black">
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/30 pointer-events-none">
                    <div className="text-center px-4 max-w-4xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
                            Your Future, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                Intelligently Designed
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light max-w-2xl mx-auto drop-shadow-md">
                            Experience the next generation of study abroad counselling tailored specifically for you.
                        </p>
                        <div className="pointer-events-auto">
                            <Link
                                href="/signup"
                                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-semibold text-lg transition-transform hover:scale-105 active:scale-95"
                            >
                                Start Your Journey
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-sm animate-bounce">
                        Scroll to explore
                    </div>
                </div>
            </div>
        </div>
    );
}
