import React, { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  animationDuration: number;
}

const Particles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);
  
  const createParticle = (): Particle => {
    const currentId = nextId.current;
    nextId.current += 1;
    return {
      id: currentId,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 5 + 2,
      opacity: Math.random() * 0.5 + 0.1,
      animationDuration: Math.random() * 3 + 2
    };
  };
  
  useEffect(() => {
    // Initial particles
    const initialParticles = Array.from({ length: 40 }, () => createParticle());
    setParticles(initialParticles);
    
    // Create new particles periodically
    const interval = setInterval(() => {
      setParticles(prev => {
        // Remove some old particles
        const filtered = prev.filter(() => Math.random() > 0.1);
        
        // Add new particles
        const newParticles = Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          () => createParticle()
        );
        
        // Limit total particles to avoid performance issues (optional)
        const combined = [...filtered, ...newParticles];
        const MAX_PARTICLES = 100; // Adjust as needed
        return combined.slice(-MAX_PARTICLES); // Keep only the latest N particles
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary animate-particle-float"
          style={{
            left: `${particle.x}%`,
            bottom: `${Math.random() * 20}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDuration: `${particle.animationDuration}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Particles;
