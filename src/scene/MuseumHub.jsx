import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ROOMS } from '../domain/museumState.js';

const FLOOR_RADIUS = 16.25;
const WALL_RADIUS = 15.85;
const DOOR_RADIUS = 15.68;
const plaqueTextures = new Map();

export default function MuseumHub({ nextRoomId, completedRoomIds, interactionTargetsRef }) {
  return (
    <group>
      <FloorAndInlay />
      <RotundaWalls />
      <ColumnRing />
      <CeilingAndLucernario />
      <MuseumDoors
        nextRoomId={nextRoomId}
        completedRoomIds={completedRoomIds}
        interactionTargetsRef={interactionTargetsRef}
      />
      <CentralMaquette completedRoomIds={completedRoomIds} interactionTargetsRef={interactionTargetsRef} />
      {completedRoomIds.length === ROOMS.length && <GalleryUnlockGuide />}
      <DustPoints />
    </group>
  );
}

function FloorAndInlay() {
  const ringsRef = useRef(null);
  const detailsRef = useRef(null);
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.993, 1, 96), []);
  const boxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const ringMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: '#8e7657',
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    }),
    [],
  );
  const detailMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: '#8c7353',
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    }),
    [],
  );
  const details = useMemo(() => Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    return {
      position: [Math.sin(angle) * 15.18, -0.015, Math.cos(angle) * 15.18],
      rotation: [0, angle, 0],
      scale: [0.16, 0.014, 0.045],
    };
  }), []);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    [3.1, 5.4, 8.4, 11.4, 14.45].forEach((radius, index) => {
      dummy.position.set(0, -0.017 + index * 0.0004, 0);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(radius, radius, 1);
      dummy.updateMatrix();
      ringsRef.current?.setMatrixAt(index, dummy.matrix);
    });

    details.forEach((item, index) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(...item.rotation);
      dummy.scale.set(...item.scale);
      dummy.updateMatrix();
      detailsRef.current?.setMatrixAt(index, dummy.matrix);
    });

    if (ringsRef.current) ringsRef.current.instanceMatrix.needsUpdate = true;
    if (detailsRef.current) detailsRef.current.instanceMatrix.needsUpdate = true;
  }, [details]);

  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[FLOOR_RADIUS, FLOOR_RADIUS + 0.22, 0.54, 96]} />
        <meshStandardMaterial color="#8d806a" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.023, 0]}>
        <circleGeometry args={[FLOOR_RADIUS, 96]} />
        <meshStandardMaterial color="#c9beaa" roughness={0.82} metalness={0.04} />
      </mesh>
      <instancedMesh ref={ringsRef} args={[ringGeometry, ringMaterial, 5]} />
      <instancedMesh ref={detailsRef} args={[boxGeometry, detailMaterial, details.length]} />
    </group>
  );
}

function RotundaWalls() {
  const panelsRef = useRef(null);
  const ribsRef = useRef(null);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const panelMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.82, metalness: 0.02 }),
    [],
  );
  const ribMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#9b886d', roughness: 0.58, metalness: 0.12 }),
    [],
  );
  const bronzeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#96774e', roughness: 0.34, metalness: 0.72 }),
    [],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    for (let index = 0; index < 32; index += 1) {
      const angle = (index / 32) * Math.PI * 2;
      const x = Math.sin(angle) * (WALL_RADIUS - 0.08);
      const z = Math.cos(angle) * (WALL_RADIUS - 0.08);

      dummy.position.set(x, 3.78, z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(2.9, 7.1, 0.14);
      dummy.updateMatrix();
      panelsRef.current?.setMatrixAt(index, dummy.matrix);
      panelsRef.current?.setColorAt(
        index,
        new THREE.Color(index % 2 ? '#c9bca7' : '#d8cdbb'),
      );

      dummy.scale.set(0.1, 7.3, 0.18);
      dummy.updateMatrix();
      ribsRef.current?.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 0.08, z);
      dummy.scale.set(2.9, 0.12, 0.17);
      dummy.updateMatrix();
      bottomRef.current?.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 7.34, z);
      dummy.scale.set(2.9, 0.16, 0.17);
      dummy.updateMatrix();
      topRef.current?.setMatrixAt(index, dummy.matrix);
    }

    [panelsRef, ribsRef, bottomRef, topRef].forEach((ref) => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });

    if (panelsRef.current?.instanceColor) {
      panelsRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  return (
    <group>
      <mesh position={[0, 3.82, 0]}>
        <cylinderGeometry args={[WALL_RADIUS, WALL_RADIUS, 7.65, 96, 1, true]} />
        <meshStandardMaterial color="#a99a82" roughness={0.92} side={THREE.BackSide} />
      </mesh>
      <instancedMesh ref={panelsRef} args={[unitBox, panelMaterial, 32]} />
      <instancedMesh ref={ribsRef} args={[unitBox, ribMaterial, 32]} />
      <instancedMesh ref={bottomRef} args={[unitBox, bronzeMaterial, 32]} />
      <instancedMesh ref={topRef} args={[unitBox, bronzeMaterial, 32]} />
    </group>
  );
}

function ColumnRing() {
  const bodyRef = useRef(null);
  const capitalRef = useRef(null);
  const baseRef = useRef(null);
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e0d4c0', roughness: 0.68, metalness: 0.03 }),
    [],
  );
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#a18155', roughness: 0.34, metalness: 0.68 }),
    [],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    for (let index = 0; index < 16; index += 1) {
      const angle = ((index + 0.5) / 16) * Math.PI * 2;
      const x = Math.sin(angle) * 14.82;
      const z = Math.cos(angle) * 14.82;

      dummy.position.set(x, 3.61, z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(0.3, 6.75, 0.4);
      dummy.updateMatrix();
      bodyRef.current?.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 6.92, z);
      dummy.scale.set(0.52, 0.3, 0.56);
      dummy.updateMatrix();
      capitalRef.current?.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 0.2, z);
      dummy.scale.set(0.52, 0.4, 0.56);
      dummy.updateMatrix();
      baseRef.current?.setMatrixAt(index, dummy.matrix);
    }

    [bodyRef, capitalRef, baseRef].forEach((ref) => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });
  }, []);

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[unitBox, stone, 16]} />
      <instancedMesh ref={capitalRef} args={[unitBox, brass, 16]} />
      <instancedMesh ref={baseRef} args={[unitBox, brass, 16]} />
    </group>
  );
}

function CeilingAndLucernario() {
  const beamsRef = useRef(null);
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#87785f', roughness: 0.63, metalness: 0.12 }),
    [],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2;
      dummy.position.set(Math.sin(angle) * 9.8, 7.48, Math.cos(angle) * 9.8);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(0.2, 0.2, 11.2);
      dummy.updateMatrix();
      beamsRef.current?.setMatrixAt(index, dummy.matrix);
    }

    if (beamsRef.current) beamsRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 7.5, 0]}>
        <ringGeometry args={[4.2, WALL_RADIUS, 96]} />
        <meshStandardMaterial color="#c2b49b" roughness={0.86} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 7.53, 0]}>
        <circleGeometry args={[4.16, 64]} />
        <meshBasicMaterial color="#e7dcc6" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 7.46, 0]}>
        <ringGeometry args={[4.18, 4.36, 64]} />
        <meshStandardMaterial color="#a28153" roughness={0.36} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={beamsRef} args={[unitBox, material, 16]} />
      <pointLight position={[0, 6.2, 0]} intensity={0.42} distance={9} color="#a99a7e" />
    </group>
  );
}

function MuseumDoors({ nextRoomId, completedRoomIds, interactionTargetsRef }) {
  const doorRef = useRef(null);
  const trimRef = useRef(null);
  const accentRef = useRef(null);
  const handleRef = useRef(null);

  const doorGeometry = useMemo(() => new THREE.BoxGeometry(2.08, 3.2, 0.18), []);
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const handleGeometry = useMemo(() => new THREE.SphereGeometry(0.075, 8, 6), []);
  const doorMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.54, metalness: 0.24 }),
    [],
  );
  const trimMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b28a54', roughness: 0.31, metalness: 0.75 }),
    [],
  );
  const insetMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.38,
      metalness: 0.32,
      emissive: '#111111',
      emissiveIntensity: 0.1,
    }),
    [],
  );
  const handleMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e0bf82', roughness: 0.24, metalness: 0.84 }),
    [],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const axisY = new THREE.Vector3(0, 1, 0);

    for (let index = 0; index < ROOMS.length; index += 1) {
      const room = ROOMS[index];
      const angle = (index / ROOMS.length) * Math.PI * 2 + Math.PI;
      const x = Math.sin(angle) * DOOR_RADIUS;
      const z = Math.cos(angle) * DOOR_RADIUS;
      const yaw = angle + Math.PI;

      dummy.position.set(x, 1.62, z);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      doorRef.current?.setMatrixAt(index, dummy.matrix);

      const rgb = new THREE.Color(room.accent);
      const isNext = room.id === nextRoomId;
      const isDone = completedRoomIds.includes(room.id);

      if (!isNext && !isDone) rgb.lerp(new THREE.Color('#45464b'), 0.64);
      if (isDone) rgb.multiplyScalar(0.68);

      doorRef.current?.setColorAt(index, rgb);

      const trimBoxes = [
        { x: -1.09, y: 1.61, sx: 0.13, sy: 3.42, sz: 0.23 },
        { x: 1.09, y: 1.61, sx: 0.13, sy: 3.42, sz: 0.23 },
        { x: 0, y: 3.34, sx: 2.32, sy: 0.15, sz: 0.24 },
        { x: 0, y: 0.06, sx: 2.32, sy: 0.12, sz: 0.24 },
      ];

      trimBoxes.forEach((piece, pieceIndex) => {
        const offset = new THREE.Vector3(piece.x, piece.y, 0).applyAxisAngle(axisY, yaw);
        dummy.position.set(x + offset.x, piece.y, z + offset.z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(piece.sx, piece.sy, piece.sz);
        dummy.updateMatrix();
        trimRef.current?.setMatrixAt(index * trimBoxes.length + pieceIndex, dummy.matrix);
      });

      const offset = new THREE.Vector3(0, 1.74, 0.12).applyAxisAngle(axisY, yaw);
      dummy.position.set(x + offset.x, offset.y, z + offset.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1.55, 1.55, 0.12);
      dummy.updateMatrix();
      accentRef.current?.setMatrixAt(index, dummy.matrix);

      const handleOffset = new THREE.Vector3(0.7, 1.42, 0.14).applyAxisAngle(axisY, yaw);
      dummy.position.set(x + handleOffset.x, handleOffset.y, z + handleOffset.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 0.75);
      dummy.updateMatrix();
      handleRef.current?.setMatrixAt(index, dummy.matrix);
    }

    [doorRef, trimRef, accentRef, handleRef].forEach((ref) => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });

    if (doorRef.current?.instanceColor) doorRef.current.instanceColor.needsUpdate = true;

    if (accentRef.current) {
      for (let index = 0; index < ROOMS.length; index += 1) {
        accentRef.current.setColorAt(index, new THREE.Color(ROOMS[index].accent));
      }

      if (accentRef.current.instanceColor) accentRef.current.instanceColor.needsUpdate = true;
    }

    const mesh = doorRef.current;

    if (mesh) {
      mesh.userData.museumInteraction = { type: 'doorInstances' };
      interactionTargetsRef.current.push(mesh);
    }

    return () => {
      const list = interactionTargetsRef.current;
      const index = list.indexOf(mesh);
      if (index >= 0) list.splice(index, 1);
      if (mesh) delete mesh.userData.museumInteraction;
    };
  }, [completedRoomIds, interactionTargetsRef, nextRoomId]);

  return (
    <group>
      <instancedMesh ref={doorRef} args={[doorGeometry, doorMaterial, ROOMS.length]} />
      <instancedMesh ref={trimRef} args={[unitBox, trimMaterial, ROOMS.length * 4]} />
      <instancedMesh ref={accentRef} args={[unitBox, insetMaterial, ROOMS.length]} />
      <instancedMesh ref={handleRef} args={[handleGeometry, handleMaterial, ROOMS.length]} />
      <DoorPlaques />
      <DoorPreviews nextRoomId={nextRoomId} completedRoomIds={completedRoomIds} />
      {nextRoomId !== null && <SpotlightGuide roomId={nextRoomId} />}
    </group>
  );
}

function DoorPlaques() {
  const textures = useMemo(() => ROOMS.map(createPlaqueTexture), []);

  return (
    <group>
      {ROOMS.map((room, index) => {
        const angle = (index / ROOMS.length) * Math.PI * 2 + Math.PI;
        const x = Math.sin(angle) * DOOR_RADIUS;
        const z = Math.cos(angle) * DOOR_RADIUS;

        return (
          <group key={room.id} position={[x, 0, z]} rotation={[0, angle + Math.PI, 0]}>
            <mesh position={[0, 3.56, 0.145]}>
              <boxGeometry args={[2.45, 0.62, 0.09]} />
              <meshStandardMaterial color="#33281e" roughness={0.4} metalness={0.42} />
            </mesh>
            <mesh position={[0, 3.56, 0.198]}>
              <planeGeometry args={[2.32, 0.5]} />
              <meshBasicMaterial map={textures[index]} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function createPlaqueTexture(room) {
  if (plaqueTextures.has(room.id)) return plaqueTextures.get(room.id);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);

  context.fillStyle = '#e9dfcd';
  context.fillRect(0, 0, 1024, 256);
  context.strokeStyle = room.accent;
  context.lineWidth = 8;
  context.strokeRect(9, 9, 1006, 238);
  context.fillStyle = '#34291e';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.font = '500 64px Georgia, serif';
  context.fillText(String(room.id).padStart(2, '0'), 34, 128);

  context.beginPath();
  context.moveTo(135, 46);
  context.lineTo(135, 210);
  context.lineWidth = 3;
  context.strokeStyle = '#a68658';
  context.stroke();

  context.fillStyle = '#34291e';
  context.font = '600 48px Georgia, serif';
  context.fillText(room.plaqueTitle, 165, 128, 818);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  plaqueTextures.set(room.id, texture);
  return texture;
}

function DoorPreviews({ nextRoomId, completedRoomIds }) {
  return (
    <group>
      {ROOMS.map((room, index) => {
        const angle = (index / ROOMS.length) * Math.PI * 2 + Math.PI;
        const x = Math.sin(angle) * DOOR_RADIUS;
        const z = Math.cos(angle) * DOOR_RADIUS;
        const isNext = room.id === nextRoomId;
        const isDone = completedRoomIds.includes(room.id);
        const opacity = isNext || isDone ? 1 : 0.42;

        return (
          <group key={room.id} position={[x, 0, z]} rotation={[0, angle + Math.PI, 0]}>
            <mesh position={[0, 1.76, 0.24]}>
              <torusGeometry args={[0.47, 0.035, 7, 28]} />
              <meshStandardMaterial
                color={room.accent}
                roughness={0.3}
                metalness={0.62}
                emissive={room.accent}
                emissiveIntensity={isNext ? 0.42 : 0.08}
                transparent
                opacity={opacity}
              />
            </mesh>
            <PreviewMotif roomId={room.id} color={room.accent} opacity={opacity} />
            {isDone && (
              <mesh position={[0.79, 0.42, 0.19]}>
                <sphereGeometry args={[0.075, 8, 6]} />
                <meshBasicMaterial color="#e7d0a2" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function PreviewMotif({ roomId, color, opacity }) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.58,
      emissive: color,
      emissiveIntensity: 0.08,
      transparent: opacity < 1,
      opacity,
    }),
    [color, opacity],
  );
  const pale = useMemo(
    () => new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      toneMapped: false,
    }),
    [color, opacity],
  );
  const position = [0, 1.76, 0.29];

  switch (roomId) {
    case 1:
      return <mesh position={position} material={material}><boxGeometry args={[0.42, 0.42, 0.08]} /></mesh>;
    case 2:
      return <mesh position={position} material={material}><dodecahedronGeometry args={[0.28, 0]} /></mesh>;
    case 3:
      return (
        <group position={position}>
          {[0.17, 0.28, 0.39].map((radius) => (
            <mesh key={radius} material={pale}>
              <torusGeometry args={[radius, 0.025, 6, 24]} />
            </mesh>
          ))}
        </group>
      );
    case 4:
      return (
        <group position={position}>
          <mesh material={material} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.035, 0.055, 0.38, 7]} />
          </mesh>
          <mesh material={material} position={[-0.12, 0.13, 0]} rotation={[0, 0, -0.55]}>
            <icosahedronGeometry args={[0.16, 0]} />
          </mesh>
          <mesh material={material} position={[0.13, 0.2, 0]} rotation={[0, 0, 0.6]}>
            <icosahedronGeometry args={[0.16, 0]} />
          </mesh>
        </group>
      );
    case 5:
      return (
        <group position={position}>
          <mesh position={[-0.13, 0, 0]} material={material}>
            <boxGeometry args={[0.16, 0.45, 0.04]} />
          </mesh>
          <mesh position={[0.13, 0, 0]} rotation={[0, 0, 0.22]} material={material}>
            <boxGeometry args={[0.16, 0.45, 0.04]} />
          </mesh>
        </group>
      );
    case 6:
      return (
        <group position={position}>
          {[-0.18, 0, 0.18].map((x) => (
            <mesh key={x} position={[x, 0, 0]} material={material}>
              <boxGeometry args={[0.11, 0.43, 0.045]} />
            </mesh>
          ))}
        </group>
      );
    case 7:
      return (
        <group position={position}>
          {[[-0.2, 0.1], [0.16, 0.16], [0.2, -0.15], [-0.16, -0.17]].map(([x, y]) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0]} material={pale}>
              <sphereGeometry args={[0.06, 7, 5]} />
            </mesh>
          ))}
        </group>
      );
    default:
      return (
        <group position={position}>
          <mesh position={[-0.09, 0, 0]} rotation={[0, 0, 0.08]} material={material}>
            <boxGeometry args={[0.25, 0.42, 0.035]} />
          </mesh>
          <mesh position={[0.12, 0, 0.045]} rotation={[0, 0, -0.08]} material={material}>
            <boxGeometry args={[0.25, 0.42, 0.035]} />
          </mesh>
        </group>
      );
  }
}

function SpotlightGuide({ roomId }) {
  const room = ROOMS.find((item) => item.id === roomId);
  if (!room) return null;

  const angle = ((room.id - 1) / ROOMS.length) * Math.PI * 2 + Math.PI;
  const x = Math.sin(angle) * 15.35;
  const z = Math.cos(angle) * 15.35;

  return (
    <group position={[x, 4.45, z]}>
      <mesh position={[0, -0.85, 0]}>
        <coneGeometry args={[1.22, 7.0, 14, 1, true]} />
        <meshBasicMaterial
          color={room.accent}
          transparent
          opacity={0.075}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -4.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.88, 36]} />
        <meshBasicMaterial
          color={room.accent}
          transparent
          opacity={0.8}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, -1.9, 0]} intensity={6} distance={5.5} color={room.accent} />
    </group>
  );
}

function GalleryUnlockGuide() {
  const beamRef = useRef(null);
  const floorRingRef = useRef(null);
  const unlockLightRef = useRef(null);

  useFrame(({ clock }) => {
    const pulse = 0.82 + (Math.sin(clock.elapsedTime * 1.6) + 1) * 0.09;
    if (beamRef.current) beamRef.current.material.opacity = 0.045 + pulse * 0.025;
    if (floorRingRef.current) floorRingRef.current.material.opacity = 0.45 + pulse * 0.25;
    if (unlockLightRef.current) unlockLightRef.current.intensity = 22 + pulse * 12;
  });

  return (
    <group>
      <mesh ref={beamRef} position={[0, 3.82, 0]}>
        <cylinderGeometry args={[2.65, 0.23, 7.4, 32, 1, true]} />
        <meshBasicMaterial
          color="#f9d99c"
          transparent
          opacity={0.07}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={floorRingRef} position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.35, 2.48, 72]} />
        <meshBasicMaterial color="#f4d69b" transparent opacity={0.65} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={unlockLightRef} position={[0, 3.8, 0]} intensity={30} distance={11} color="#ffe1a9" />
    </group>
  );
}

function CentralMaquette({ completedRoomIds, interactionTargetsRef }) {
  const sculptureRef = useRef(null);
  const outerRingMaterialRef = useRef(null);
  const innerRingRef = useRef(null);
  const innerRingMaterialRef = useRef(null);
  const gemMaterialRef = useRef(null);
  const markerRef = useRef(null);
  const pillarRef = useRef(null);
  const galleryTargetRef = useRef(null);
  const maquetteLightRef = useRef(null);
  const completeSet = useMemo(() => new Set(completedRoomIds), [completedRoomIds]);
  const galleryUnlocked = completeSet.size === ROOMS.length;

  const markerGeometry = useMemo(() => new THREE.SphereGeometry(0.105, 8, 6), []);
  const pillarGeometry = useMemo(() => new THREE.BoxGeometry(0.16, 1, 0.16), []);
  const markerMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8f806b', roughness: 0.4, metalness: 0.45 }),
    [],
  );
  const pillarMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#c4a06c',
      roughness: 0.35,
      metalness: 0.68,
      emissive: '#342315',
      emissiveIntensity: 0.2,
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    if (sculptureRef.current) sculptureRef.current.rotation.y += delta * (galleryUnlocked ? 0.09 : 0.035);
    if (innerRingRef.current) innerRingRef.current.rotation.z -= delta * 0.055;

    const pulse = 0.8 + (Math.sin(clock.elapsedTime * 1.9) + 1) * 0.12;
    if (outerRingMaterialRef.current) outerRingMaterialRef.current.emissiveIntensity = galleryUnlocked ? 0.85 * pulse : 0.18;
    if (innerRingMaterialRef.current) innerRingMaterialRef.current.emissiveIntensity = galleryUnlocked ? 0.7 * pulse : 0;
    if (gemMaterialRef.current) gemMaterialRef.current.emissiveIntensity = galleryUnlocked ? 1.1 * pulse : 0.16;
    if (maquetteLightRef.current) maquetteLightRef.current.intensity = galleryUnlocked ? 20 + 12 * pulse : 0.55;
  });

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    for (let index = 0; index < ROOMS.length; index += 1) {
      const angle = (index / ROOMS.length) * Math.PI * 2 + Math.PI;
      const completed = completeSet.has(ROOMS[index].id);
      const markerRadius = completed ? 0.142 : 0.075;

      dummy.position.set(
        Math.sin(angle) * 1.55,
        0.482 + markerRadius,
        Math.cos(angle) * 1.55,
      );
      dummy.scale.setScalar(completed ? 1.35 : 0.72);
      dummy.updateMatrix();
      markerRef.current?.setMatrixAt(index, dummy.matrix);
      markerRef.current?.setColorAt(index, new THREE.Color(completed ? '#ffe0a0' : '#716957'));

      const height = completed ? 0.9 : 0.28;
      dummy.position.set(
        Math.sin(angle) * 0.85,
        0.485 + height / 2,
        Math.cos(angle) * 0.85,
      );
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      pillarRef.current?.setMatrixAt(index, dummy.matrix);
    }

    if (markerRef.current) {
      markerRef.current.instanceMatrix.needsUpdate = true;
      if (markerRef.current.instanceColor) markerRef.current.instanceColor.needsUpdate = true;
    }
    if (pillarRef.current) pillarRef.current.instanceMatrix.needsUpdate = true;
  }, [completeSet]);

  useLayoutEffect(() => {
    const target = galleryTargetRef.current;
    if (!target || !galleryUnlocked) return undefined;

    target.userData.museumInteraction = {
      type: 'gallery',
      label: 'Enter The Gallery',
    };
    interactionTargetsRef.current.push(target);

    return () => {
      const index = interactionTargetsRef.current.indexOf(target);
      if (index >= 0) interactionTargetsRef.current.splice(index, 1);
      delete target.userData.museumInteraction;
    };
  }, [galleryUnlocked, interactionTargetsRef]);

  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.08, 2.3, 0.42, 56]} />
        <meshStandardMaterial color="#756653" roughness={0.7} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[1.86, 1.94, 0.09, 56]} />
        <meshStandardMaterial color="#aa895b" roughness={0.28} metalness={0.72} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[1.77, 1.8, 0.07, 56]} />
        <meshStandardMaterial color="#3c3329" roughness={0.48} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.56, 1.64, 64]} />
        <meshBasicMaterial color={galleryUnlocked ? '#ffe1a5' : '#8a7555'} transparent opacity={galleryUnlocked ? 0.92 : 0.25} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={sculptureRef} position={[0, 2.25, 0]}>
        <mesh>
          <torusGeometry args={[1.34, 0.065, 8, 52]} />
          <meshStandardMaterial
            ref={outerRingMaterialRef}
            color="#c6a06a"
            roughness={0.26}
            metalness={0.78}
            emissive="#ffbf5a"
            emissiveIntensity={0.18}
          />
        </mesh>
        <mesh ref={innerRingRef} rotation={[0.5, 0.35, 0]}>
          <torusGeometry args={[0.95, 0.042, 8, 44]} />
          <meshStandardMaterial
            ref={innerRingMaterialRef}
            color="#d8e0e4"
            roughness={0.28}
            metalness={0.68}
            emissive="#9fc9e5"
            emissiveIntensity={0}
          />
        </mesh>
        <mesh rotation={[0.68, 0.2, 0.48]}>
          <octahedronGeometry args={[0.46, 1]} />
          <meshStandardMaterial
            ref={gemMaterialRef}
            color="#f2e2c2"
            roughness={0.2}
            metalness={0.48}
            emissive="#ffd48a"
            emissiveIntensity={0.16}
          />
        </mesh>
      </group>
      <instancedMesh ref={markerRef} args={[markerGeometry, markerMaterial, ROOMS.length]} />
      <instancedMesh ref={pillarRef} args={[pillarGeometry, pillarMaterial, ROOMS.length]} />
      <pointLight
        ref={maquetteLightRef}
        position={[0, 3.0, 0]}
        intensity={0.55}
        distance={galleryUnlocked ? 10.5 : 4.5}
        color="#ffe0a4"
      />
      {galleryUnlocked && (
        <spotLight
          position={[0, 7.35, 0]}
          intensity={92}
          distance={11}
          angle={0.45}
          penumbra={0.65}
          decay={1.65}
          color="#ffe1a7"
        />
      )}
      <mesh ref={galleryTargetRef} position={[0, 2.15, 0]}>
        <boxGeometry args={[2.75, 3.75, 2.75]} />
        <meshBasicMaterial transparent opacity={0.001} colorWrite={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function DustPoints() {
  const positions = useMemo(() => {
    const count = 64;
    const values = new Float32Array(count * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const radius = 13.1 * Math.sqrt((index + 0.5) / count);
      const angle = index * goldenAngle;
      values[offset] = Math.cos(angle) * radius;
      values[offset + 1] = 0.8 + (((index * 7) % count) / count) * 5.1;
      values[offset + 2] = Math.sin(angle) * radius;
    }

    return values;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f1dcb8"
        size={0.022}
        transparent
        opacity={0.21}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}