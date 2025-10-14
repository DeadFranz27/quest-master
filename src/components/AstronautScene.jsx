import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Astronaut({ mousePosition }) {
  const meshRef = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (meshRef.current) {
      targetRotation.current.x = mousePosition.y * 0.3;
      targetRotation.current.y = mousePosition.x * 0.5;

      meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.05;
      meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.05;
      meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} emissive="#667eea" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[0, 1.2, 0.35]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#3a3a5e" metalness={0.9} roughness={0.1} transparent opacity={0.8} emissive="#667eea" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.5]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0.26]}>
        <boxGeometry args={[0.5, 0.6, 0.05]} />
        <meshStandardMaterial color="#667eea" metalness={0.5} roughness={0.2} emissive="#667eea" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.5, 0.4, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.12, 0.12, 0.9, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0.4, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.12, 0.12, 0.9, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh position={[-0.25, -0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh position={[0.25, -0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.4, -0.35]}>
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.3} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Moon() {
  const moonRef = useRef();

  useFrame(() => {
    if (moonRef.current) {
      moonRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={moonRef} position={[0, -5, -8]}>
      <sphereGeometry args={[4, 64, 64]} />
      <meshStandardMaterial color="#9ca3af" metalness={0.1} roughness={0.9} />
    </mesh>
  );
}

function FloatingParticles() {
  const particlesRef = useRef();
  const particleCount = 100;

  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#667eea" transparent opacity={0.6} />
    </points>
  );
}

export default function AstronautScene() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    setMousePosition({
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-5, 5, 5]} intensity={0.8} color="#667eea" />
        <pointLight position={[0, 0, 5]} intensity={1} color="#ffffff" />
        <spotLight position={[0, 10, 0]} intensity={1} angle={0.5} penumbra={1} color="#ffffff" />

        <Astronaut mousePosition={mousePosition} />
        <Moon />
        <FloatingParticles />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
}
