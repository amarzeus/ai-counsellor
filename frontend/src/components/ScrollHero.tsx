"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowDown } from "lucide-react";

const TOTAL_FRAMES = 80;
const FRAME_PREFIX = "/hero-sequence/Cinematic_transition_the_1080p_202601272137_";

export default function ScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
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
        setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
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

  const scrollProgress = currentFrame / TOTAL_FRAMES;

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-black">
          {imagesLoaded && imagesRef.current[currentFrame] && (
            <img
              src={imagesRef.current[currentFrame].src}
              alt="Hero animation"
              className="w-full h-full object-cover transition-opacity duration-100"
              style={{ opacity: 1 }}
            />
          )}
          
          {!imagesLoaded && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-white/10 rounded-full" />
                <div 
                  className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"
                />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white/60" />
              </div>
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <span className="mt-3 text-white/50 text-sm font-medium tracking-wide">
                Loading experience... {loadProgress}%
              </span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 3),
              transform: `translateY(${scrollProgress * 30}px)`,
            }}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white/80">AI-Powered Study Abroad Guidance</span>
          </div>

          <h1 
            className="text-center mb-8"
            style={{
              opacity: Math.max(0.2, 1 - scrollProgress * 0.8),
              transform: `translateY(${scrollProgress * 50}px) scale(${1 - scrollProgress * 0.1})`,
            }}
          >
            <span className="block text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-2 drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
              Your Study Abroad
            </span>
            <span className="block text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              Journey{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Starts Here
                </span>
                <span className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl -z-10" />
              </span>
            </span>
          </h1>
          
          <p 
            className="text-lg md:text-xl lg:text-2xl text-gray-300 text-center max-w-3xl mb-10 leading-relaxed font-light"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 2),
              transform: `translateY(${scrollProgress * 40}px)`,
            }}
          >
            From confusion to clarity. Our AI counsellor guides you through 
            <span className="text-white font-medium"> university discovery</span>, 
            <span className="text-white font-medium"> smart shortlisting</span>, and 
            <span className="text-white font-medium"> application preparation</span>.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4"
            style={{
              opacity: Math.max(0.2, 1 - scrollProgress * 1.5),
              transform: `translateY(${scrollProgress * 30}px)`,
            }}
          >
            <Link
              href="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] text-white text-lg font-semibold rounded-full hover:bg-[position:100%_0] transition-all duration-500 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Journey
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            
            <Link
              href="/login"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-lg font-medium rounded-full hover:bg-white/20 transition-all hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{
            opacity: Math.max(0, 1 - scrollProgress * 4),
          }}
        >
          <span className="text-white/50 text-sm font-medium tracking-widest uppercase mb-3">
            Scroll to explore
          </span>
          <div className="relative">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-white/60 rounded-full animate-[bounce_1.5s_infinite]" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
