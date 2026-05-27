"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, PerspectiveCamera } from "@react-three/drei";
import { RitualPhase, DrawnCard } from "@/lib/types";
import { TarotCard3D } from "./tarot-card-3d";

const CARD_COUNT = 78;

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.2} color="#4b3a8e" />
      <pointLight position={[10, 8, 10]} intensity={2} color="#c9a0ff" />
      <pointLight position={[-10, -3, 5]} intensity={1} color="#8b5cf6" />
      <pointLight position={[0, 5, -8]} intensity={0.8} color="#f59e0b" />
      <pointLight position={[0, -2, 3]} intensity={0.4} color="#a78bfa" />
    </>
  );
}

function CardDeck({
  phase,
  drawnCards,
  onPickCard,
  onCardHover,
}: {
  phase: RitualPhase;
  drawnCards: DrawnCard[];
  onPickCard: (cardId: number) => void;
  onCardHover?: (hovered: boolean) => void;
}) {
  const isPickPhase =
    phase === "pick_1" || phase === "pick_2" || phase === "pick_3";

  return (
    <group>
      {Array.from({ length: CARD_COUNT }, (_, i) => {
        const isDrawn = drawnCards.some((c) => c.card_id === i);
        const spreadPos = drawnCards.findIndex((c) => c.card_id === i);
        const drawnCard = drawnCards.find((c) => c.card_id === i);
        const isReversed = drawnCard?.is_reversed ?? false;

        return (
          <TarotCard3D
            key={i}
            cardId={i}
            index={i}
            phase={phase}
            isDrawn={isDrawn}
            spreadPosition={spreadPos}
            isReversed={isReversed}
            onHoverChange={onCardHover}
            onClick={() => {
              if (isPickPhase && !isDrawn) onPickCard(i);
            }}
          />
        );
      })}
    </group>
  );
}

interface TarotSceneProps {
  phase: RitualPhase;
  drawnCards: DrawnCard[];
  onPickCard: (cardId: number) => void;
  onCardHover?: (hovered: boolean) => void;
}

export function TarotScene({ phase, drawnCards, onPickCard, onCardHover }: TarotSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-auto">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 1, 14], fov: 50 }}
      >
        <Suspense fallback={null}>
          <SceneLights />
          <Stars
            radius={40}
            depth={60}
            count={800}
            factor={4}
            saturation={0.15}
            fade
            speed={0.3}
          />
          <CardDeck
            phase={phase}
            drawnCards={drawnCards}
            onPickCard={onPickCard}
            onCardHover={onCardHover}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
