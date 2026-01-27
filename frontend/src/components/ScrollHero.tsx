"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const TOTAL_FRAMES = 80;
const FRAME_PREFIX = "/hero-sequence/Cinematic_transition_the_1080p_202601272137_";

export default function ScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(3, "0");
      img.src = `${FRAME_PREFIX}${frameNum}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setImagesLoaded(true);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = containerRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollHeight));
      const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));
      
      setCurrentFrame(frameIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-black">
          {imagesLoaded && imagesRef.current[currentFrame] && (
            <img
              src={imagesRef.current[currentFrame].src}
              alt="Hero animation"
              className="w-full h-full object-cover"
            />
          )}
          {!imagesLoaded && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8">
          <h1 
            className="text-5xl md:text-7xl font-bold text-center mb-6 drop-shadow-2xl"
            style={{
              opacity: 1 - (currentFrame / TOTAL_FRAMES) * 0.5,
              transform: `translateY(${currentFrame * 0.5}px)`
            }}
          >
            Your Study Abroad Journey
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Starts Here
            </span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-gray-200 text-center max-w-2xl mb-8 drop-shadow-lg"
            style={{
              opacity: Math.max(0, 1 - (currentFrame / TOTAL_FRAMES) * 1.5),
            }}
          >
            From confusion to clarity. AI-guided university recommendations and application planning.
          </p>

          <Link
            href="/signup"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-full hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl hover:scale-105"
            style={{
              opacity: Math.max(0.3, 1 - (currentFrame / TOTAL_FRAMES)),
            }}
          >
            Start Your Journey
          </Link>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center animate-bounce">
          <span className="text-sm mb-2">Scroll to explore</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
