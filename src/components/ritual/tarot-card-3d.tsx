"use client";

import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RitualPhase } from "@/lib/types";
import tarotCards from "@/data/tarot-cards.json";

const CARD_WIDTH = 1.5;
const CARD_HEIGHT = 2.5;
const CARD_DEPTH = 0.05;

const SPREAD_POSITIONS = [
  new THREE.Vector3(-3.5, 0, 3),
  new THREE.Vector3(0, 0.2, 3.5),
  new THREE.Vector3(3.5, 0, 3),
];

// ── Procedural luxury card face texture (gold filigree on deep purple) ──
function createLuxuryFaceTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = Math.round(w * (CARD_HEIGHT / CARD_WIDTH)); // ~853
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Deep purple gradient background
  const bg = ctx.createRadialGradient(w / 2, h / 2, w * 0.05, w / 2, h / 2, w * 0.75);
  bg.addColorStop(0, "#2a1555");
  bg.addColorStop(0.4, "#1a0e38");
  bg.addColorStop(1, "#0b041e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Outer gold frame
  const m = w * 0.04;
  ctx.strokeStyle = "#c9a050";
  ctx.lineWidth = w * 0.008;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);

  // Inner thin gold line
  const m2 = m * 2;
  ctx.lineWidth = w * 0.003;
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(m2, m2, w - m2 * 2, h - m2 * 2);
  ctx.globalAlpha = 1;

  // Corner ornaments — filigree circles
  function drawCornerOrnament(cx: number, cy: number) {
    ctx.save();
    ctx.translate(cx, cy);
    const r = w * 0.06;
    ctx.strokeStyle = "#d4b860";
    ctx.lineWidth = w * 0.002;
    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    // Cross spokes
    ctx.lineWidth = w * 0.001;
    ctx.globalAlpha = 0.7;
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.3, Math.sin(angle) * r * 0.3);
      ctx.lineTo(Math.cos(angle) * r * 0.95, Math.sin(angle) * r * 0.95);
      ctx.stroke();
    }
    // Center dot
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#f0d878";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const cm = m * 2.5;
  drawCornerOrnament(cm, cm);
  drawCornerOrnament(w - cm, cm);
  drawCornerOrnament(cm, h - cm);
  drawCornerOrnament(w - cm, h - cm);

  // Central mandala
  ctx.save();
  ctx.translate(w / 2, h / 2);
  const mandalaR = w * 0.22;

  // Concentric rings
  for (let ring = 0; ring < 4; ring++) {
    const r = mandalaR * (0.5 + ring * 0.15);
    ctx.strokeStyle = ring % 2 === 0 ? "#c9a050" : "#8b6fc0";
    ctx.lineWidth = w * 0.0015;
    ctx.globalAlpha = 0.5 - ring * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Petal shapes
  const petalCount = 8;
  for (let p = 0; p < petalCount; p++) {
    const angle = (p / petalCount) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    // Petal
    ctx.fillStyle = p % 2 === 0 ? "#c9a050" : "#8b6fc0";
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(mandalaR * 0.45, 0, mandalaR * 0.18, mandalaR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Petal outline
    ctx.strokeStyle = "#d4c080";
    ctx.lineWidth = w * 0.001;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  // Star inside mandala
  const starR = mandalaR * 0.35;
  const starInner = starR * 0.4;
  ctx.fillStyle = "#f0d878";
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? starR : starInner;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c9a050";
  ctx.lineWidth = w * 0.001;
  ctx.globalAlpha = 0.6;
  ctx.stroke();

  // Eye in center
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#2a1555";
  ctx.beginPath();
  ctx.arc(0, 0, mandalaR * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0d878";
  ctx.beginPath();
  ctx.arc(0, 0, mandalaR * 0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Subtle noise / grain
  ctx.globalAlpha = 0.03;
  const imageData = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    imageData.data[i] += noise;
    imageData.data[i + 1] += noise;
    imageData.data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  return texture;
}

// Singleton — shared across all cards
let sharedLuxuryTexture: THREE.CanvasTexture | null = null;
function getLuxuryFaceTexture(): THREE.CanvasTexture {
  if (!sharedLuxuryTexture) {
    sharedLuxuryTexture = createLuxuryFaceTexture();
  }
  return sharedLuxuryTexture;
}

function getCardImagePath(cardId: number): string {
  const card = (tarotCards as any[]).find((c) => c.id === cardId);
  return card?.image ?? `/cards/rws/${String(cardId).padStart(2, "0")}-unknown.png`;
}

// Card back texture
function CardBackFace() {
  const [texture] = useTexture(["/cards/rws/card-back.png"]);
  return <meshStandardMaterial attach="material-4" map={texture} />;
}

// Card front face: either the luxury procedural texture or the card image
// For reversed cards, the texture is rotated 180°
function CardFrontFace({
  cardImagePath,
  isReversed,
  isLuxury,
}: {
  cardImagePath?: string;
  isReversed?: boolean;
  isLuxury?: boolean;
}) {
  const luxuryTex = useMemo(() => (isLuxury ? getLuxuryFaceTexture() : null), [isLuxury]);

  if (isLuxury && luxuryTex) {
    return (
      <meshStandardMaterial
        attach="material-5"
        map={luxuryTex}
        metalness={0.1}
        roughness={0.65}
      />
    );
  }

  if (!cardImagePath) {
    return <meshStandardMaterial attach="material-5" color="#2a1040" />;
  }

  return <CardImageFace cardImagePath={cardImagePath} isReversed={isReversed ?? false} />;
}

function CardImageFace({
  cardImagePath,
  isReversed,
}: {
  cardImagePath: string;
  isReversed: boolean;
}) {
  const [texture] = useTexture([cardImagePath]);
  useEffect(() => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    // Rotate texture 180° for reversed cards — avoids Euler gimbal lock
    texture.center.set(0.5, 0.5);
    texture.rotation = isReversed ? Math.PI : 0;
    texture.needsUpdate = true;
  }, [texture, isReversed]);
  return <meshStandardMaterial attach="material-5" map={texture} />;
}

// ── Sparkle particles ──

function SparkleOrbit({
  cardIndex,
  orbitIndex,
  isHovered,
  canClick,
}: {
  cardIndex: number;
  orbitIndex: number;
  isHovered: boolean;
  canClick: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const phase = useRef((cardIndex * 0.37 + orbitIndex * 1.73) * Math.PI);
  const speed = 0.3 + (cardIndex % 7) * 0.05 + orbitIndex * 0.1;
  const radius = CARD_WIDTH * 0.7 + orbitIndex * 0.2;
  const yOscSpeed = 0.8 + orbitIndex * 0.3;
  const yOscAmp = 0.3 + orbitIndex * 0.15;

  useFrame((_, delta) => {
    if (!ref.current) return;
    phase.current += delta * speed;
    const cx = Math.cos(phase.current) * radius;
    const cy = Math.sin(phase.current * yOscSpeed) * yOscAmp;
    const cz = Math.sin(phase.current) * radius * 0.5;
    ref.current.position.set(cx, cy, cz);
    const alpha = isHovered && canClick ? 0.9 : 0.3;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = alpha;
    const s = 0.03 + Math.sin(phase.current * 3) * 0.01;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color={orbitIndex % 2 === 0 ? "#f0d060" : "#c9a0ff"}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Hover glow halo ──

function HoverGlow({ isHovered, canClick }: { isHovered: boolean; canClick: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const target = isHovered && canClick ? 0.5 : 0;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity += (target - mat.opacity) * 0.1;
    ref.current.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.02);
  });

  return (
    <mesh ref={ref} position={[0, 0, 0.002]}>
      <planeGeometry args={[CARD_WIDTH + 0.12, CARD_HEIGHT + 0.12]} />
      <meshBasicMaterial
        color="#f0d060"
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Main card component ──

interface TarotCard3DProps {
  cardId: number;
  index: number;
  phase: RitualPhase;
  isDrawn: boolean;
  spreadPosition: number;
  isReversed: boolean;
  onClick: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

export function TarotCard3D({
  cardId,
  index,
  phase,
  isDrawn,
  spreadPosition,
  isReversed,
  onClick,
  onHoverChange,
}: TarotCard3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef(0);

  const animRef = useRef({
    target: new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 3 - 4
    ),
    rotTargetY: 0,
    time: Math.random() * 100,
    breatheOffset: Math.random() * Math.PI * 2,
  });

  const isPickPhase =
    phase === "pick_1" || phase === "pick_2" || phase === "pick_3";

  const sparkleCount = 3;
  const sparkles = useMemo(
    () =>
      Array.from({ length: sparkleCount }, (_, i) => (
        <SparkleOrbit
          key={i}
          cardIndex={index}
          orbitIndex={i}
          isHovered={hovered}
          canClick={!isDrawn && isPickPhase}
        />
      )),
    [index, hovered, isDrawn, isPickPhase]
  );

  useEffect(() => {
    onHoverChange?.(hovered && !isDrawn && isPickPhase);
  }, [hovered, isDrawn, isPickPhase, onHoverChange]);

  useEffect(() => {
    const anim = animRef.current;
    if (isDrawn && spreadPosition >= 0 && spreadPosition < 3) {
      anim.target.copy(SPREAD_POSITIONS[spreadPosition]);
      anim.rotTargetY = Math.PI;
    } else if (isPickPhase || phase === "shuffle") {
      anim.target.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 3 - 4
      );
      anim.rotTargetY = 0;
    }
  }, [isDrawn, spreadPosition, phase, isPickPhase]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const anim = animRef.current;
    anim.time += delta;

    const speed = isDrawn ? 0.06 : 0.02;
    meshRef.current.position.lerp(anim.target, speed);

    if (isDrawn) {
      meshRef.current.rotation.x += (0 - meshRef.current.rotation.x) * 0.08;
      meshRef.current.rotation.y += (anim.rotTargetY - meshRef.current.rotation.y) * 0.08;
      meshRef.current.rotation.z += (0 - meshRef.current.rotation.z) * 0.08;
    } else if (phase === "shuffle") {
      meshRef.current.rotation.y += delta * (1 + index * 0.03);
      meshRef.current.rotation.z = Math.sin(anim.time * 3 + index) * 0.15;
    } else if (isPickPhase) {
      meshRef.current.position.y += Math.sin(anim.time * 1.2 + index) * 0.003;
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.z = Math.sin(anim.time * 0.8 + index) * 0.04;

      const breathe = Math.sin(anim.time * 1.5 + anim.breatheOffset) * 0.5 + 0.5;
      glowRef.current = 0.15 + breathe * 0.25;
    } else {
      meshRef.current.position.y += Math.sin(anim.time * 0.5 + index) * 0.003;
      meshRef.current.rotation.y += delta * 0.08;
    }

    const breatheScale = isPickPhase
      ? 1 + Math.sin(anim.time * 1.5 + anim.breatheOffset) * 0.015
      : 1;
    const hoverScale = hovered && !isDrawn && isPickPhase ? 1.15 : 1;
    const targetScale = breatheScale * hoverScale;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.12);
  });

  const canClick = !isDrawn && isPickPhase;

  const emissiveIntensity = isDrawn
    ? 0
    : isPickPhase
    ? glowRef.current
    : phase === "shuffle"
    ? 0.1
    : 0;

  return (
    <group>
      {isPickPhase && !isDrawn && sparkles}

      <mesh
        ref={meshRef}
        position={[
          animRef.current.target.x,
          animRef.current.target.y,
          animRef.current.target.z,
        ]}
        onClick={(e) => {
          e.stopPropagation();
          if (canClick) onClick();
        }}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = canClick ? "pointer" : "default";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        renderOrder={isDrawn ? 1 : 0}
        castShadow
      >
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} />

        {/* Side edges */}
        <meshStandardMaterial
          attach="material-0"
          color={isPickPhase && !isDrawn ? "#2a1850" : "#1a1035"}
          emissive={isPickPhase && !isDrawn ? "#4a2080" : "#000000"}
          emissiveIntensity={emissiveIntensity}
        />
        <meshStandardMaterial
          attach="material-1"
          color={isPickPhase && !isDrawn ? "#2a1850" : "#1a1035"}
          emissive={isPickPhase && !isDrawn ? "#4a2080" : "#000000"}
          emissiveIntensity={emissiveIntensity}
        />

        {/* Top/Bottom edges — gold */}
        <meshStandardMaterial
          attach="material-2"
          color="#c9a050"
          emissive="#805020"
          emissiveIntensity={0.2 + emissiveIntensity}
          metalness={0.3}
          roughness={0.6}
        />
        <meshStandardMaterial
          attach="material-3"
          color="#c9a050"
          emissive="#805020"
          emissiveIntensity={0.2 + emissiveIntensity}
          metalness={0.3}
          roughness={0.6}
        />

        {/* Back face (+Z, facing camera initially) — always card back */}
        <Suspense fallback={<meshStandardMaterial attach="material-4" color="#1a1035" />}>
          <CardBackFace />
        </Suspense>

        {/* Front face (-Z) — luxury texture when hidden, card image when drawn */}
        {isDrawn ? (
          <Suspense fallback={<meshStandardMaterial attach="material-5" color="#3a1a60" />}>
            <CardFrontFace
              cardImagePath={getCardImagePath(cardId)}
              isReversed={isReversed}
            />
          </Suspense>
        ) : (
          <CardFrontFace isLuxury />
        )}

        {/* Hover glow */}
        {!isDrawn && <HoverGlow isHovered={hovered} canClick={canClick} />}

        {/* Glow rings for drawn cards */}
        {isDrawn && (
          <>
            <mesh position={[0, 0, 0.001]}>
              <boxGeometry args={[CARD_WIDTH + 0.06, CARD_HEIGHT + 0.06, CARD_DEPTH + 0.01]} />
              <meshBasicMaterial color="#c9a050" transparent opacity={0.25} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0, -0.001]}>
              <boxGeometry args={[CARD_WIDTH + 0.06, CARD_HEIGHT + 0.06, CARD_DEPTH + 0.01]} />
              <meshBasicMaterial color="#c9a050" transparent opacity={0.25} depthWrite={false} />
            </mesh>
          </>
        )}
      </mesh>
    </group>
  );
}
