import React, { useEffect, useRef } from 'react';
import './ChillBackground.css';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  baseX: number;
  angle: number;
}

const ChillBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates tracking
    const mouse = { x: -1000, y: -1000, active: false };

    // Ambient glowing orbs (Lava lamp style)
    const orbs: Orb[] = [
      {
        x: width * 0.25,
        y: height * 0.3,
        vx: 0.2,
        vy: -0.15,
        radius: Math.min(width, height) * 0.35,
        color: 'rgba(139, 92, 246, 0.08)', // Violet
      },
      {
        x: width * 0.75,
        y: height * 0.7,
        vx: -0.15,
        vy: 0.2,
        radius: Math.min(width, height) * 0.4,
        color: 'rgba(236, 72, 153, 0.07)', // Fuchsia
      },
      {
        x: width * 0.5,
        y: height * 0.5,
        vx: 0.1,
        vy: -0.1,
        radius: Math.min(width, height) * 0.3,
        color: 'rgba(59, 130, 246, 0.07)', // Blue
      },
    ];

    // Dust particles
    const particleCount = 45;
    const particles: Particle[] = [];

    const createParticle = (initY = false): Particle => {
      const pRadius = Math.random() * 2 + 1;
      const pX = Math.random() * width;
      const pY = initY ? Math.random() * height : height + 10;
      return {
        x: pX,
        y: pY,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.2), // Rising slowly
        radius: pRadius,
        alpha: Math.random() * 0.5 + 0.2,
        decay: Math.random() * 0.002 + 0.001,
        baseX: pX,
        angle: Math.random() * Math.PI * 2,
      };
    };

    // Initialize particles on full height
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true));
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      // Update orb radii on resize
      orbs[0].radius = Math.min(width, height) * 0.35;
      orbs[1].radius = Math.min(width, height) * 0.4;
      orbs[2].radius = Math.min(width, height) * 0.3;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw and update Ambient Orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Bounce boundaries
        if (orb.x - orb.radius < 0 || orb.x + orb.radius > width) orb.vx *= -1;
        if (orb.y - orb.radius < 0 || orb.y + orb.radius > height) orb.vy *= -1;

        // Draw radial gradient for lava lamp glow
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'rgba(7, 7, 9, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw and update Dust Particles
      particles.forEach((p, idx) => {
        // Slow sway (sine wave movement)
        p.angle += 0.01;
        p.x += Math.sin(p.angle) * 0.15;
        p.y += p.vy;

        // Mouse interaction: push away slowly
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * force * 1.5;
            p.y += Math.sin(angle) * force * 1.5;
          }
        }

        // Draw particle
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Respawn if offscreen top or fully faded
        if (p.y < -10 || p.x < -10 || p.x > width + 10) {
          particles[idx] = createParticle(false);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="chill-background-canvas" />;
};

export default ChillBackground;
