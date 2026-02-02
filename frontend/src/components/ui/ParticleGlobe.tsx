"use client";

import { useEffect, useRef } from "react";

export type GlobeState = "IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING";

interface ParticleGlobeProps {
    state: GlobeState;
}

export function ParticleGlobe({ state }: ParticleGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        const particles: { x: number; y: number; z: number; size: number; phi: number; theta: number }[] = [];
        const particleCount = 700;
        const globeRadius = Math.min(width, height) * 0.35;

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos((Math.random() * 2) - 1);
            particles.push({
                x: 0, y: 0, z: 0,
                phi, theta,
                size: Math.random() * 1.5 + 0.5
            });
        }

        let animationFrameId: number;
        let angleY = 0;
        let angleX = 0;
        let pulsePhase = 0;

        // Config based on state
        const getConfig = () => {
            switch (state) {
                case "LISTENING": return { color: "96, 165, 250", speed: 0.02, scaleMod: 0.1 }; // Blue, fast
                case "PROCESSING": return { color: "192, 132, 252", speed: 0.05, scaleMod: 0.2 }; // Purple, very fast
                case "SPEAKING": return { color: "74, 222, 128", speed: 0.015, scaleMod: 0.3 }; // Green, pulsing
                default: return { color: "148, 163, 184", speed: 0.002, scaleMod: 0.0 }; // Slate, slow
            }
        };

        const render = () => {
            const config = getConfig();
            ctx.clearRect(0, 0, width, height);

            angleY += config.speed;
            angleX += config.speed * 0.5;
            pulsePhase += 0.1;

            // Breathing effect for globe radius
            const currentRadius = globeRadius + (Math.sin(pulsePhase) * 5 * (state === "SPEAKING" ? 2 : 0.5));

            const projectedParticles = particles.map(p => {
                // Recalculate 3D position based on pulse
                const px = currentRadius * Math.sin(p.phi) * Math.cos(p.theta);
                const py = currentRadius * Math.sin(p.phi) * Math.sin(p.theta);
                const pz = currentRadius * Math.cos(p.phi);

                // Rotate Y
                let x1 = px * Math.cos(angleY) - pz * Math.sin(angleY);
                let z1 = pz * Math.cos(angleY) + px * Math.sin(angleY);

                // Rotate X
                let y2 = py * Math.cos(angleX) - z1 * Math.sin(angleX);
                let z2 = z1 * Math.cos(angleX) + py * Math.sin(angleX);

                // Project
                const scale = 300 / (300 + z2);
                return {
                    x: x1 * scale + width / 2,
                    y: y2 * scale + height / 2,
                    scale,
                    z: z2
                };
            }).sort((a, b) => b.z - a.z);

            projectedParticles.forEach(p => {
                const alpha = (p.scale - 0.5) * 1.5;
                ctx.fillStyle = `rgba(${config.color}, ${Math.max(0.05, alpha)})`;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.scale * 1.5, 0, Math.PI * 2);
                ctx.fill();
            });

            // Glow
            if (state !== "IDLE") {
                const glowSize = 20 + Math.sin(pulsePhase) * 5;
                const gradient = ctx.createRadialGradient(width / 2, height / 2, globeRadius * 0.8, width / 2, height / 2, globeRadius * 1.5);
                gradient.addColorStop(0, `rgba(${config.color}, 0.0)`);
                gradient.addColorStop(1, `rgba(${config.color}, 0.0)`);
                // Canvas shadow is better for glow
                ctx.shadowBlur = glowSize;
                ctx.shadowColor = `rgba(${config.color}, 0.4)`;
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
    }, [state]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
}
