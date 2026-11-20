import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROOMS } from '../domain/museumState.js';

const THEMES = {
  1: { wall: '#4b3b2a', floor: '#76664f', trim: '#c5a06a', ceiling: '#2b2118', accent: '#d9ad70' },
  2: { wall: '#d8ceba', floor: '#c9c0ad', trim: '#a8895d', ceiling: '#e7dece', accent: '#a6c4d9' },
  3: { wall: '#2d3542', floor: '#414b5c', trim: '#8a9bb0', ceiling: '#1d2430', accent: '#9aaee7' },
  4: { wall: '#b8bba6', floor: '#bcb59b', trim: '#8c8d68', ceiling: '#d9d7c4', accent: '#a5bd82' },
  5: { wall: '#afb0b0', floor: '#bdbcb5', trim: '#827e73', ceiling: '#d9d6ce', accent: '#dfbb84' },
  6: { wall: '#482b35', floor: '#49343a', trim: '#b08a63', ceiling: '#291b25', accent: '#e49a9e' },
  7: { wall: '#202b40', floor: '#30384a', trim: '#7f8eab', ceiling: '#111827', accent: '#a7c8ed' },
  8: { wall: '#c7bba7', floor: '#b4a58e', trim: '#98744a', ceiling: '#ded3bf', accent: '#c7a7df' },
};

const TARGETS = {
  1: { position: [0, 1.55, -2.0], size: [2.85, 3.2, 1.45], label: 'Rebuild the letter' },
  2: { position: [0, 1.72, -2.05], size: [7.2, 2.5, 1.55], label: 'Find the matching pairs' },
  3: { position: [0, 1.68, -1.48], size: [2.9, 2.0, 1.3], label: 'Listen and repeat the rhythm' },
  4: { position: [0, 1.25, -1.42], size: [7.5, 2.2, 2.0], label: 'Care for the garden' },
  5: { position: [0, 1.85, -2.0], size: [5.8, 3.1, 1.35], label: 'Align the two perspectives' },
  6: { position: [0, 2.2, -4.05], size: [6.2, 4.2, 1.5], label: 'Capture the moments' },
  7: { position: [0, 2.5, -3.55], size: [5.8, 3.8, 1.2], label: 'Rebuild the constellation' },
  8: { position: [0, 2.05, -1.72], size: [2.5, 2.6, 0.92], label: 'Write the next page' },
};

export default function MuseumRooms({ roomId, interactionTargetsRef }) {
  const room = ROOMS.find((item) => item.id === roomId) ?? ROOMS[0];
  const theme = THEMES[room.id] ?? THEMES[1];

  return (
    <group>
      <RoomEnvelope roomId={room.id} theme={theme} />
      {room.id === 1 && <ArchiveRoom theme={theme} />}
      {room.id === 2 && <VitrineRoom theme={theme} />}
      {room.id === 3 && <SoundRoom theme={theme} />}
      {room.id === 4 && <GardenRoom theme={theme} />}
      {room.id === 5 && <PerspectiveRoom theme={theme} />}
      {room.id === 6 && <TheatreRoom theme={theme} />}
      {room.id === 7 && <ObservatoryRoom theme={theme} />}
      {room.id === 8 && <BookRoom theme={theme} />}
      <RoomGameTarget
        roomId={room.id}
        target={TARGETS[room.id]}
        interactionTargetsRef={interactionTargetsRef}
      />
    </group>
  );
}

function RoomEnvelope({ roomId, theme }) {
  return (
    <group>
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[16.25, 0.32, 19.3]} />
        <meshStandardMaterial color={theme.floor} roughness={0.82} metalness={0.04} />
      </mesh>
      {roomId !== 1 && (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.9, 6.96, 64]} />
          <meshBasicMaterial color={theme.trim} transparent opacity={0.36} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh position={[0, 3.0, -9.25]}>
        <boxGeometry args={[16.25, 6.0, 0.35]} />
        <meshStandardMaterial color={theme.wall} roughness={0.84} />
      </mesh>
      <mesh position={[-7.93, 3.0, -0.08]}>
        <boxGeometry args={[0.35, 6.0, 18.7]} />
        <meshStandardMaterial color={theme.wall} roughness={0.84} />
      </mesh>
      <mesh position={[7.93, 3.0, -0.08]}>
        <boxGeometry args={[0.35, 6.0, 18.7]} />
        <meshStandardMaterial color={theme.wall} roughness={0.84} />
      </mesh>
      <mesh position={[-5.33, 3.0, 9.25]}>
        <boxGeometry args={[5.45, 6.0, 0.35]} />
        <meshStandardMaterial color={theme.wall} roughness={0.84} />
      </mesh>
      <mesh position={[5.33, 3.0, 9.25]}>
        <boxGeometry args={[5.45, 6.0, 0.35]} />
        <meshStandardMaterial color={theme.wall} roughness={0.84} />
      </mesh>
      {roomId !== 4 && roomId !== 7 && (
        <mesh position={[0, 6.12, -0.05]}>
          <boxGeometry args={[16.2, 0.22, 19.1]} />
          <meshStandardMaterial color={theme.ceiling} roughness={0.82} />
        </mesh>
      )}
      <mesh position={[0, 5.7, 9.03]}>
        <boxGeometry args={[5.8, 0.24, 0.38]} />
        <meshStandardMaterial color={theme.trim} roughness={0.43} metalness={0.38} />
      </mesh>
      <mesh position={[0, 3.1, -9.04]}>
        <boxGeometry args={[10.8, 0.1, 0.12]} />
        <meshStandardMaterial color={theme.trim} roughness={0.45} metalness={0.38} />
      </mesh>
      <mesh position={[0, 0.18, -9.04]}>
        <boxGeometry args={[10.8, 0.14, 0.12]} />
        <meshStandardMaterial color={theme.trim} roughness={0.45} metalness={0.38} />
      </mesh>
      {roomId !== 4 && (
        <pointLight
          position={[0, 4.55, 0.2]}
          intensity={11}
          distance={16}
          color={roomId === 3 || roomId === 7 ? '#afc4ed' : '#efd4a5'}
        />
      )}
    </group>
  );
}

/** Room 01: a unified, grounded archive cabinet with five flush drawers. */
function ArchiveRoom() {
  const drawerYs = [0.48, 1.0, 1.52, 2.04, 2.56];

  return (
    <group position={[0, 0, -2.0]}>
      {/* One coherent, floor-standing cabinet; every detail is attached to its body. */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[2.5, 3.1, 1.08]} />
        <meshStandardMaterial color="#39291d" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[2.72, 0.15, 1.24]} />
        <meshStandardMaterial color="#a27b4c" roughness={0.43} metalness={0.28} />
      </mesh>
      <mesh position={[0, 3.055, 0]}>
        <boxGeometry args={[2.72, 0.15, 1.24]} />
        <meshStandardMaterial color="#a27b4c" roughness={0.43} metalness={0.28} />
      </mesh>
      {[-1.28, 1.28].map((x) => (
        <mesh key={x} position={[x, 1.55, 0.02]}>
          <boxGeometry args={[0.12, 2.94, 1.14]} />
          <meshStandardMaterial color="#b38b57" roughness={0.42} metalness={0.24} />
        </mesh>
      ))}
      {drawerYs.map((y, index) => (
        <group key={y} position={[0, y, 0.585]}>
          <mesh>
            <boxGeometry args={[2.18, 0.44, 0.12]} />
            <meshStandardMaterial color={index % 2 ? '#765337' : '#63452d'} roughness={0.54} />
          </mesh>
          <mesh position={[0, 0, 0.066]}>
            <boxGeometry args={[0.4, 0.055, 0.035]} />
            <meshStandardMaterial color="#d0ad74" roughness={0.3} metalness={0.78} />
          </mesh>
          <mesh position={[-0.82, 0, 0.066]}>
            <boxGeometry args={[0.16, 0.22, 0.03]} />
            <meshStandardMaterial color="#b79a69" roughness={0.36} metalness={0.58} />
          </mesh>
          <mesh position={[0.82, 0, 0.066]}>
            <boxGeometry args={[0.16, 0.22, 0.03]} />
            <meshStandardMaterial color="#b79a69" roughness={0.36} metalness={0.58} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 4.0, 0.9]} intensity={3.8} distance={5.8} color="#e7c58f" />
    </group>
  );
}

function VitrineRoom({ theme }) {
  const exhibits = [
    { x: -2.35, objectY: 1.43, color: '#b9c6c8' },
    { x: 0, objectY: 1.5, color: '#d8bd8d' },
    { x: 2.35, objectY: 1.48, color: '#a9b8d4' },
  ];

  return (
    <group position={[0, 0, -2.1]}>
      {/* Three matching museum plinths form one balanced, readable exhibit. */}
      {exhibits.map((exhibit, index) => (
        <group key={exhibit.x} position={[exhibit.x, 0, 0]}>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[1.45, 0.9, 1.35]} />
            <meshStandardMaterial color="#b8b0a1" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.96, 0]}>
            <boxGeometry args={[1.55, 0.08, 1.45]} />
            <meshStandardMaterial color={theme.trim} roughness={0.34} metalness={0.62} />
          </mesh>
          <mesh position={[0, exhibit.objectY, 0]}>
            {index === 1
              ? <torusGeometry args={[0.38, 0.12, 12, 36]} />
              : index === 0
                ? <sphereGeometry args={[0.43, 24, 18]} />
                : <dodecahedronGeometry args={[0.48, 1]} />}
            <meshStandardMaterial
              color={exhibit.color}
              roughness={index === 1 ? 0.25 : 0.42}
              metalness={index === 1 ? 0.68 : 0.18}
              emissive={exhibit.color}
              emissiveIntensity={0.06}
            />
          </mesh>
          <mesh position={[0, 1.02, 0.69]}>
            <boxGeometry args={[0.82, 0.025, 0.025]} />
            <meshStandardMaterial color="#77664f" roughness={0.65} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[7.0, 0.16, 2.15]} />
        <meshStandardMaterial color="#8e8779" roughness={0.76} />
      </mesh>
      <mesh position={[0, 3.7, -0.5]}>
        <boxGeometry args={[7.0, 0.12, 0.32]} />
        <meshStandardMaterial color={theme.trim} roughness={0.4} metalness={0.48} />
      </mesh>
      <pointLight position={[0, 4.35, -1.2]} intensity={4.8} distance={8} color="#d8e6ef" />
    </group>
  );
}

function SoundRoom({ theme }) {
  const acousticPanels = useMemo(() => Array.from({ length: 12 }, (_, index) => ({
    position: [index % 2 ? 7.35 : -7.35, 3.0, -7.3 + index * 1.25],
    rotation: [0, index % 2 ? -0.08 : 0.08, 0],
    scale: [0.23, 5.0, 0.52],
  })), []);

  return (
    <group>
      <InstancedBoxes items={acousticPanels} color="#596273" roughness={0.85} />
      <mesh position={[0, 0.32, -1.48]}>
        <cylinderGeometry args={[1.25, 1.45, 0.64, 40]} />
        <meshStandardMaterial color="#28303e" roughness={0.62} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.69, -1.48]}>
        <cylinderGeometry args={[1.18, 1.2, 0.08, 40]} />
        <meshStandardMaterial color={theme.trim} roughness={0.3} metalness={0.72} />
      </mesh>
      <group position={[0, 1.72, -1.48]}>
        {[1.42, 1.06, 0.7].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.035, 7, 40]} />
            <meshStandardMaterial
              color={index === 0 ? '#b6c8e0' : theme.trim}
              roughness={0.32}
              metalness={0.65}
              emissive="#364965"
              emissiveIntensity={0.24}
            />
          </mesh>
        ))}
      </group>
      <group position={[6.25, 2.22, -2.35]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <torusGeometry args={[0.52, 0.045, 7, 32]} />
          <meshStandardMaterial color={theme.accent} roughness={0.3} metalness={0.68} emissive="#40516b" emissiveIntensity={0.32} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <circleGeometry args={[0.3, 28]} />
          <meshBasicMaterial color="#b7cce8" transparent opacity={0.58} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[0, 3.3, -8.98]}>
        <torusGeometry args={[2.4, 0.06, 8, 64]} />
        <meshStandardMaterial color={theme.trim} roughness={0.32} metalness={0.7} />
      </mesh>
    </group>
  );
}

function GardenRoom({ theme }) {
  const planters = [
    { x: -3.1, z: -1.35, name: 'flower' },
    { x: 0, z: -1.42, name: 'fern' },
    { x: 3.2, z: -1.35, name: 'sprout' },
    { x: -4.9, z: -5.35, name: 'side-left' },
    { x: 4.95, z: -5.35, name: 'side-right' },
  ];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 5.97, -0.1]}>
        <circleGeometry args={[3.35, 48]} />
        <meshBasicMaterial color="#e3e2ce" toneMapped={false} />
      </mesh>
      <mesh position={[0, 5.87, -0.1]}>
        <torusGeometry args={[3.42, 0.09, 8, 64]} />
        <meshStandardMaterial color={theme.trim} roughness={0.38} metalness={0.54} />
      </mesh>
      {planters.map((plant, index) => (
        <group key={plant.name} position={[plant.x, 0, plant.z]}>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[index > 2 ? 1.55 : 2.0, 0.56, index > 2 ? 1.7 : 1.85]} />
            <meshStandardMaterial color="#777860" roughness={0.87} />
          </mesh>
          <mesh position={[0, 0.59, 0]}>
            <boxGeometry args={[index > 2 ? 1.4 : 1.85, 0.08, index > 2 ? 1.55 : 1.7]} />
            <meshStandardMaterial color="#655b42" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.12, 0.19, 1.02, 8]} />
            <meshStandardMaterial color="#655f43" roughness={0.9} />
          </mesh>
          {[0, 1, 2, 3].map((leaf) => (
            <mesh
              key={leaf}
              position={[
                Math.cos(leaf * Math.PI / 2) * 0.36,
                1.35 + (leaf % 2) * 0.15,
                Math.sin(leaf * Math.PI / 2) * 0.36,
              ]}
              rotation={[0.2, leaf * Math.PI / 2, 0.55]}
              scale={[0.56, 0.2, 0.32]}
            >
              <icosahedronGeometry args={[0.52, 0]} />
              <meshStandardMaterial color={index === 1 ? '#8f9e73' : '#697653'} roughness={0.86} />
            </mesh>
          ))}
        </group>
      ))}
      <pointLight position={[0, 4.7, -1.4]} intensity={17} distance={9} color="#d9d7a9" />
    </group>
  );
}

function PerspectiveRoom({ theme }) {
  return (
    <group position={[0, 0, -2.0]}>
      {/* Two framed optical panels, one shared rail and a central alignment lens. */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[6.8, 0.36, 1.5]} />
        <meshStandardMaterial color="#6e675c" roughness={0.62} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[6.65, 0.08, 1.38]} />
        <meshStandardMaterial color={theme.trim} roughness={0.34} metalness={0.65} />
      </mesh>
      {[-2.0, 2.0].map((x, index) => (
        <group key={x} position={[x, 1.92, 0]}>
          <mesh>
            <boxGeometry args={[1.55, 2.85, 0.14]} />
            <meshStandardMaterial color={index === 0 ? '#8b7559' : '#b6a17d'} roughness={0.48} metalness={0.24} />
          </mesh>
          <mesh position={[0, 0, 0.09]}>
            <boxGeometry args={[1.31, 2.61, 0.035]} />
            <meshStandardMaterial color={index === 0 ? '#c2b59d' : '#d5cbb9'} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <torusGeometry args={[0.48, 0.035, 8, 40]} />
            <meshStandardMaterial color={index === 0 ? '#6f8498' : '#a17c54'} roughness={0.3} metalness={0.65} />
          </mesh>
          <mesh position={[0, -0.98, 0.13]}>
            <boxGeometry args={[0.9, 0.035, 0.025]} />
            <meshStandardMaterial color="#8b806e" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.95, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 2.0, 24]} />
        <meshStandardMaterial color={theme.trim} roughness={0.32} metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.95, 0.18]}>
        <torusGeometry args={[0.42, 0.075, 10, 40]} />
        <meshStandardMaterial color="#e1c28e" roughness={0.26} metalness={0.72} emissive="#554025" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 3.68, 0]}>
        <boxGeometry args={[5.9, 0.12, 0.42]} />
        <meshStandardMaterial color={theme.trim} roughness={0.38} metalness={0.58} />
      </mesh>
      <pointLight position={[0, 4.25, 0.9]} intensity={4.4} distance={7} color="#f0d6a5" />
    </group>
  );
}

function TheatreRoom({ theme }) {
  return (
    <group position={[0, 0, -4.0]}>
      {/* A compact, recognisable stage: platform, curtains, proscenium and screen. */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[8.0, 0.56, 2.7]} />
        <meshStandardMaterial color="#29242a" roughness={0.54} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.59, 0]}>
        <boxGeometry args={[7.75, 0.08, 2.5]} />
        <meshStandardMaterial color={theme.trim} roughness={0.32} metalness={0.62} />
      </mesh>
      {[-3.25, 3.25].map((x) => (
        <group key={x} position={[x, 2.58, -0.15]}>
          <mesh>
            <boxGeometry args={[1.25, 4.25, 0.42]} />
            <meshStandardMaterial color="#6e3545" roughness={0.9} />
          </mesh>
          {[-0.42, 0, 0.42].map((offset) => (
            <mesh key={offset} position={[offset, 0, 0.23]}>
              <boxGeometry args={[0.12, 4.05, 0.05]} />
              <meshStandardMaterial color="#8b4d59" roughness={0.88} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 4.72, -0.12]}>
        <boxGeometry args={[7.25, 0.28, 0.52]} />
        <meshStandardMaterial color={theme.trim} roughness={0.32} metalness={0.66} />
      </mesh>
      <mesh position={[0, 2.72, -0.15]}>
        <boxGeometry args={[4.8, 3.2, 0.24]} />
        <meshStandardMaterial color="#8c745b" roughness={0.42} metalness={0.26} />
      </mesh>
      <mesh position={[0, 2.72, 0.0]}>
        <boxGeometry args={[4.48, 2.88, 0.06]} />
        <meshStandardMaterial color="#141b26" roughness={0.3} emissive="#27384d" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 2.72, 0.045]}>
        <torusGeometry args={[0.78, 0.045, 8, 48]} />
        <meshStandardMaterial color="#d7bc8d" roughness={0.32} metalness={0.54} emissive="#56371b" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.92, 1.0]}>
        <boxGeometry args={[1.15, 0.62, 0.82]} />
        <meshStandardMaterial color="#9a8060" roughness={0.62} />
      </mesh>
      <pointLight position={[0, 4.25, 1.25]} intensity={5.2} distance={8} color="#f3d6a1" />
    </group>
  );
}

function ObservatoryRoom({ theme }) {
  const starPositions = useMemo(() => {
    const values = [];
    const count = 70;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let index = 0; index < count; index += 1) {
      const radius = 6.7 * Math.sqrt((index + 0.5) / count);
      const angle = index * goldenAngle;
      values.push(
        Math.cos(angle) * radius,
        1.5 + (((index * 13) % count) / count) * 4.3,
        -4.5 - Math.sin(angle) * 2.5,
      );
    }

    return new Float32Array(values);
  }, []);

  return (
    <group>
      <mesh position={[0, 0, -0.4]}>
        <sphereGeometry args={[7.0, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#243047" roughness={0.68} side={THREE.BackSide} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#c7d9fa" size={0.065} transparent opacity={0.78} sizeAttenuation depthWrite={false} />
      </points>
      <mesh position={[0, 5.05, -8.9]}>
        <torusGeometry args={[3.6, 0.06, 8, 56]} />
        <meshStandardMaterial color={theme.trim} roughness={0.32} metalness={0.68} />
      </mesh>
      <group position={[-3.2, 0, -0.5]} rotation={[0, 0, 0.38]}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.09, 0.16, 2.2, 10]} />
          <meshStandardMaterial color="#8b7a60" roughness={0.36} metalness={0.65} />
        </mesh>
        <mesh position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.48, 12]} />
          <meshStandardMaterial color="#b1c1d9" roughness={0.23} metalness={0.72} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.3, 0.36, 0.26, 12]} />
          <meshStandardMaterial color="#b1c1d9" roughness={0.23} metalness={0.72} />
        </mesh>
      </group>
    </group>
  );
}

function BookRoom({ theme }) {
  return (
    <group>
      <mesh position={[0, 0.26, -1.75]}>
        <cylinderGeometry args={[1.62, 1.85, 0.48, 44]} />
        <meshStandardMaterial color="#4d4131" roughness={0.58} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.52, -1.75]}>
        <cylinderGeometry args={[1.56, 1.62, 0.08, 44]} />
        <meshStandardMaterial color={theme.trim} roughness={0.28} metalness={0.72} />
      </mesh>
      <group position={[0, 1.68, -1.75]}>
        <mesh position={[-0.68, 0, 0]} rotation={[0, -0.06, -0.04]}>
          <boxGeometry args={[1.28, 2.25, 0.12]} />
          <meshStandardMaterial color="#efe4cf" roughness={0.9} />
        </mesh>
        <mesh position={[0.68, 0, 0]} rotation={[0, 0.02, 0.04]}>
          <boxGeometry args={[1.28, 2.25, 0.12]} />
          <meshStandardMaterial color="#dfd0b6" roughness={0.9} />
        </mesh>
        {[-0.96, -0.7, -0.44, 0.44, 0.7, 0.96].map((x, index) => (
          <mesh key={index} position={[x, 0.35 - (index % 3) * 0.26, 0.073]}>
            <boxGeometry args={[0.34, 0.018, 0.008]} />
            <meshBasicMaterial color="#b8a17c" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 3.9, -1.75]}>
        <torusGeometry args={[2.0, 0.05, 7, 64]} />
        <meshStandardMaterial color={theme.trim} roughness={0.36} metalness={0.72} />
      </mesh>
    </group>
  );
}

function RoomGameTarget({ roomId, target, interactionTargetsRef }) {
  const targetRef = useRef(null);

  useLayoutEffect(() => {
    const object = targetRef.current;
    if (!object) return undefined;

    object.userData.museumInteraction = {
      type: 'roomGame',
      roomId,
      label: target.label,
    };
    interactionTargetsRef.current.push(object);

    return () => {
      const list = interactionTargetsRef.current;
      const index = list.indexOf(object);
      if (index >= 0) list.splice(index, 1);
      delete object.userData.museumInteraction;
    };
  }, [interactionTargetsRef, roomId, target.label]);

  return (
    <group>
      <mesh ref={targetRef} position={target.position}>
        <boxGeometry args={target.size} />
        <meshBasicMaterial
          transparent
          opacity={0.001}
          colorWrite={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {roomId !== 1 && (
        <>
          <mesh
            position={[target.position[0], 0.045, target.position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.2, 0.25, 24]} />
            <meshBasicMaterial
              color={ROOMS[roomId - 1].accent}
              transparent
              opacity={0.78}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight
            position={[
              target.position[0],
              Math.min(target.position[1] + 1.2, 4.6),
              target.position[2] + 0.75,
            ]}
            intensity={3.5}
            distance={5.8}
            color={ROOMS[roomId - 1].accent}
          />
        </>
      )}
    </group>
  );
}

function InstancedBoxes({ items, color, roughness = 0.7, metalness = 0.05 }) {
  const meshRef = useRef(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness, metalness }),
    [color, metalness, roughness],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    items.forEach((item, index) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]));
      dummy.scale.set(...item.scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
    });

    if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
  }, [items]);

  return <instancedMesh ref={meshRef} args={[geometry, material, items.length]} />;
}