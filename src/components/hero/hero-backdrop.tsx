"use client";

import { useEffect, useRef } from "react";

export function HeroBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let accent = "99, 102, 241";
    let frame = 0;
    let raf = 0;

    function readAccent() {
      const color = getComputedStyle(canvas as HTMLCanvasElement).color;
      const match = color.match(/-?[\d.]+/g);
      if (match) accent = `${match[0]}, ${match[1]}, ${match[2]}`;
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    readAccent();
    window.addEventListener("resize", resize);

    const step = 30;
    function draw() {
      raf = requestAnimationFrame(draw);
      frame++;
      if (frame % 45 === 0) readAccent();
      if (!width || !height) {
        resize();
        return;
      }
      const t = frame / 150;
      ctx!.clearRect(0, 0, width, height);
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          const wave = Math.sin(x * 0.011 + y * 0.02 - t) * Math.cos(y * 0.013 + t * 0.55);
          const alpha = 0.06 + Math.max(0, wave) * 0.5;
          const radius = 0.7 + Math.max(0, wave) * 1.5;
          ctx!.beginPath();
          ctx!.arc(x, y + wave * 2.5, radius, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${accent}, ${alpha.toFixed(3)})`;
          ctx!.fill();
        }
      }
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute -top-[60px] -right-[140px] -left-[140px] z-0 h-[calc(100%+120px)] w-auto text-brand"
      style={{
        maskImage:
          "radial-gradient(120% 90% at 30% 45%, #000 0%, rgba(0,0,0,0.45) 55%, transparent 82%)",
        WebkitMaskImage:
          "radial-gradient(120% 90% at 30% 45%, #000 0%, rgba(0,0,0,0.45) 55%, transparent 82%)",
      }}
    />
  );
}
