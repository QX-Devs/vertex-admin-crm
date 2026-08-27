'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  color: string;
  alpha: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  // 3D Floating Elements refs
  const instaRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const messengerRef = useRef<HTMLDivElement>(null);
  const crystalRef = useRef<HTMLDivElement>(null);
  const sphere1Ref = useRef<HTMLDivElement>(null);
  const sphere2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let smoothedMouseX = mouseX;
    let smoothedMouseY = mouseY;
    let isMouseActive = false;
    let mouseTimeout: any;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseActive = true;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        isMouseActive = false;
      }, 3000);
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
    };

    const colors = [
      'rgba(16, 185, 129, ',
      'rgba(6, 182, 212, ',
      'rgba(99, 102, 241, ',
      'rgba(52, 211, 153, '
    ];

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = Math.min(45, Math.floor((width * height) / 28000));

      for (let i = 0; i < count; i++) {
        const baseRadius = Math.random() * 2 + 1.2;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          baseRadius,
          radius: baseRadius,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.4 + 0.15
        });
      }
    };

    initParticles();

    const render = () => {
      smoothedMouseX += (mouseX - smoothedMouseX) * 0.08;
      smoothedMouseY += (mouseY - smoothedMouseY) * 0.08;

      const normX = (smoothedMouseX - width / 2) / (width / 2);
      const normY = (smoothedMouseY - height / 2) / (height / 2);

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${smoothedMouseX}px, ${smoothedMouseY}px, 0)`;
      }
      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${smoothedMouseX}px, ${smoothedMouseY}px, 0)`;
      }

      // 3D Parallax and rotation on shapes
      if (instaRef.current) {
        const tiltX = -normY * 25;
        const tiltY = normX * 25;
        const posX = normX * -35;
        const posY = normY * -35;
        instaRef.current.style.transform = `translate3d(${posX}px, ${posY}px, 60px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(12deg)`;
      }

      if (whatsappRef.current) {
        const tiltX = -normY * 20;
        const tiltY = normX * 20;
        const posX = normX * 40;
        const posY = normY * 40;
        whatsappRef.current.style.transform = `translate3d(${posX}px, ${posY}px, 50px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(-10deg)`;
      }

      if (messengerRef.current) {
        const tiltX = -normY * 22;
        const tiltY = normX * 22;
        const posX = normX * -25;
        const posY = normY * 30;
        messengerRef.current.style.transform = `translate3d(${posX}px, ${posY}px, 45px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(8deg)`;
      }

      if (crystalRef.current) {
        const tiltX = normY * 30;
        const tiltY = -normX * 30;
        const posX = normX * 35;
        const posY = normY * -30;
        crystalRef.current.style.transform = `translate3d(${posX}px, ${posY}px, 40px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(-15deg)`;
      }

      if (sphere1Ref.current) {
        sphere1Ref.current.style.transform = `translate3d(${normX * -50}px, ${normY * -50}px, 30px)`;
      }
      if (sphere2Ref.current) {
        sphere2Ref.current.style.transform = `translate3d(${normX * 45}px, ${normY * -40}px, 35px)`;
      }

      ctx.clearRect(0, 0, width, height);

      const mouseRadius = 180;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = smoothedMouseX - p.x;
        const dy = smoothedMouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && isMouseActive) {
          const force = (1 - dist / mouseRadius) * 2.5;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force;
          p.y -= Math.sin(angle) * force;
          p.radius = p.baseRadius + force * 1.5;

          const lineAlpha = (1 - dist / mouseRadius) * 0.35;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(smoothedMouseX, smoothedMouseY);
          ctx.strokeStyle = `rgba(16, 185, 129, ${lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          p.radius += (p.baseRadius - p.radius) * 0.05;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distP = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          const maxDist = 120;

          if (distP < maxDist) {
            const alpha = (1 - distP / maxDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(mouseTimeout);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="animated-bg-root fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Interactive Mouse Follow Spotlight */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[700px] h-[700px] -mt-[350px] -ml-[350px] rounded-full blur-3xl pointer-events-none opacity-40 will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.12) 40%, transparent 70%)',
        }}
      />

      {/* Interactive Core Glow */}
      <div
        ref={coreRef}
        className="absolute top-0 left-0 w-[240px] h-[240px] -mt-[120px] -ml-[120px] rounded-full blur-2xl pointer-events-none opacity-30 will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.35) 0%, transparent 70%)',
        }}
      />

      {/* Floating Ambient Glowing Mesh Orbs */}
      <div className="mesh-glow-emerald animate-blob-1" />
      <div className="mesh-glow-cyan animate-blob-2" />
      <div className="mesh-glow-indigo animate-blob-3" />

      {/* Subtle Base Grid Pattern */}
      <div className="subtle-grid-pattern" />

      {/* ========================================================================= */}
      {/* 3D FLOATING ICONS & SHAPES LAYER                                          */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* 1. 3D GLOSSY INSTAGRAM LOGO */}
        <div
          ref={instaRef}
          className="absolute top-[12%] end-[8%] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl p-0.5 shadow-2xl transition-transform duration-300 ease-out will-change-transform animate-float-1"
          style={{
            background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
            boxShadow: '0 20px 40px -10px rgba(225, 48, 108, 0.35), 0 0 25px rgba(253, 29, 29, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.25)',
            transformStyle: 'preserve-3d',
            opacity: 0.85
          }}
        >
          <div className="w-full h-full rounded-2xl sm:rounded-3xl relative overflow-hidden flex items-center justify-center border border-white/30 backdrop-blur-xs">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-2xl pointer-events-none" />
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-xl border-[2.5px] border-white flex items-center justify-center relative shadow-sm">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[2.5px] border-white shadow-inner" />
              <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 end-1 shadow-sm" />
            </div>
          </div>
        </div>

        {/* 2. 3D GLOSSY WHATSAPP LOGO */}
        <div
          ref={whatsappRef}
          className="absolute bottom-[16%] start-[6%] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl p-0.5 shadow-2xl transition-transform duration-300 ease-out will-change-transform animate-float-2"
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 70%, #075E54 100%)',
            boxShadow: '0 20px 40px -10px rgba(37, 211, 102, 0.35), 0 0 25px rgba(18, 140, 126, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.45), inset 0 -3px 6px rgba(0, 0, 0, 0.25)',
            transformStyle: 'preserve-3d',
            opacity: 0.85
          }}
        >
          <div className="w-full h-full rounded-2xl sm:rounded-3xl relative overflow-hidden flex items-center justify-center border border-white/30 backdrop-blur-xs">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-2xl pointer-events-none" />
            <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-current filter drop-shadow">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.23 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/>
            </svg>
          </div>
        </div>

        {/* 3. 3D GLOSSY MESSENGER LOGO */}
        <div
          ref={messengerRef}
          className="absolute top-[18%] start-[10%] w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl p-0.5 shadow-2xl transition-transform duration-300 ease-out will-change-transform animate-float-3"
          style={{
            background: 'linear-gradient(135deg, #00B2FE 0%, #006AFF 50%, #9026FD 100%)',
            boxShadow: '0 18px 36px -8px rgba(0, 106, 255, 0.35), 0 0 20px rgba(144, 38, 253, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.45), inset 0 -3px 6px rgba(0, 0, 0, 0.25)',
            transformStyle: 'preserve-3d',
            opacity: 0.85
          }}
        >
          <div className="w-full h-full rounded-2xl sm:rounded-3xl relative overflow-hidden flex items-center justify-center border border-white/30 backdrop-blur-xs">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-2xl pointer-events-none" />
            <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-current filter drop-shadow">
              <path d="M12 2C6.48 2 2 6.13 2 11.23c0 2.9 1.45 5.5 3.73 7.15V22l3.43-1.88c.9.25 1.86.38 2.84.38 5.52 0 10-4.13 10-9.23S17.52 2 12 2zm1.05 12.38l-2.67-2.85-5.21 2.85 5.73-6.08 2.74 2.85 5.14-2.85-5.73 6.08z"/>
            </svg>
          </div>
        </div>

        {/* 4. 3D GLOSSY EMERALD CRM DIAMOND */}
        <div
          ref={crystalRef}
          className="absolute bottom-[22%] end-[12%] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 shadow-2xl transition-transform duration-300 ease-out will-change-transform animate-float-1"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 18px 36px -8px rgba(16, 185, 129, 0.4), 0 0 20px rgba(5, 150, 105, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -3px 6px rgba(0, 0, 0, 0.25)',
            transformStyle: 'preserve-3d',
            opacity: 0.85
          }}
        >
          <div className="w-full h-full rounded-2xl relative overflow-hidden flex items-center justify-center border border-white/40 backdrop-blur-xs">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl pointer-events-none" />
            <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-none stroke-current stroke-2 filter drop-shadow">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* 5. 3D FLOATING GLASS SPHERES */}
        <div
          ref={sphere1Ref}
          className="absolute top-[45%] start-[18%] w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-transform duration-500 ease-out will-change-transform animate-float-2"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.9), rgba(16, 185, 129, 0.35) 45%, rgba(6, 182, 212, 0.15) 75%, rgba(16, 185, 129, 0.4) 100%)',
            boxShadow: '0 15px 30px -5px rgba(16, 185, 129, 0.25), inset -4px -4px 10px rgba(6, 182, 212, 0.3), inset 3px 3px 8px rgba(255, 255, 255, 0.8)',
            opacity: 0.75
          }}
        />

        <div
          ref={sphere2Ref}
          className="absolute top-[35%] end-[22%] w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-transform duration-500 ease-out will-change-transform animate-float-3"
          style={{
            background: 'radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.95), rgba(99, 102, 241, 0.3) 45%, rgba(236, 72, 153, 0.15) 75%, rgba(99, 102, 241, 0.4) 100%)',
            boxShadow: '0 15px 25px -5px rgba(99, 102, 241, 0.25), inset -3px -3px 8px rgba(236, 72, 153, 0.25), inset 2px 2px 6px rgba(255, 255, 255, 0.8)',
            opacity: 0.7
          }}
        />

      </div>

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70"
      />

      {/* Ambient gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80 pointer-events-none" />
    </div>
  );
}
