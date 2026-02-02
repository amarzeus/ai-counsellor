"use client";

import { useEffect, useRef } from "react";

interface ParticleGlobeProps {
    isActive: boolean;
}

export function ParticleGlobe({ isActive }: ParticleGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        const particles: { x: number; y: number; z: number; size: number }[] = [];
        const particleCount = 600;
        const globeRadius = Math.min(width, height) * 0.35;

        // Initialize particles on a sphere
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos((Math.random() * 2) - 1);

            particles.push({
                x: globeRadius * Math.sin(phi) * Math.cos(theta),
                y: globeRadius * Math.sin(phi) * Math.sin(theta),
                z: globeRadius * Math.cos(phi),
                size: Math.random() * 1.5 + 0.5
            });
        }

        let animationFrameId: number;
        let angleY = 0;
        let angleX = 0;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Rotation speed
            const speed = isActive ? 0.02 : 0.005;
            angleY += speed;
            angleX += speed * 0.5;

            // Sort particles by Z for depth
            const projectedParticles = particles.map(p => {
                // Rotate Y
                let x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
                let z1 = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);

                // Rotate X
                let y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
                let z2 = z1 * Math.cos(angleX) + p.y * Math.sin(angleX);

                // Project
                const scale = 300 / (300 + z2);
                const x2d = x1 * scale + width / 2;
                const y2d = y2 * scale + height / 2;

                return { x: x2d, y: y2d, scale, z: z2, originalZ: p.z };
            }).sort((a, b) => b.z - a.z); // Draw back to front

            projectedParticles.forEach(p => {
                const alpha = (p.scale - 0.5) * 1.5; // Fade distant particles
                ctx.fillStyle = isActive
                    ? `rgba(96, 165, 250, ${Math.max(0.1, alpha)})` // Blue when active
                    : `rgba(148, 163, 184, ${Math.max(0.1, alpha)})`; // Slate when idle

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.scale * 1.5, 0, Math.PI * 2);
                ctx.fill();
            });

            // Pulse effect if active
            if (isActive) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
            } else {
                ctx.shadowBlur = 0;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [isActive]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
        />
    );
}
