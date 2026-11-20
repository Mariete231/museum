import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ROOMS } from '../domain/museumState.js';
import MuseumHub from './MuseumHub.jsx';
import MuseumRooms from './MuseumRooms.jsx';
import MuseumGallery from './MuseumGallery.jsx';

const INTRO_SPAWN = new THREE.Vector3(0, 1.65, 8.55);
const HUB_SPAWN = new THREE.Vector3(0, 1.65, 4.25);
const ROOM_SPAWN = new THREE.Vector3(0, 1.65, 5.8);
const GALLERY_SPAWN = new THREE.Vector3(0, 1.65, 6.45);
const EYE_HEIGHT = 1.65;
const LOOK_SENSITIVITY = 0.0021;
const WALK_SPEED = 3.0;
const SPRINT_SPEED = 5.5;
const HUB_WALK_RADIUS = 15.1;
const HUB_DOOR_RADIUS = 15.68;
const HUB_COLUMN_RADIUS = 14.82;
const HUB_DOOR_INTERACTION_DISTANCE = 5.3;
const ROOM_INTERACTION_DISTANCE = 5.4;

const INTERACTION_LABELS = {
  'Reconstruir la carta': 'Rebuild the letter',
  'Buscar las parejas': 'Find the matching pairs',
  'Escuchar y repetir el compás': 'Listen and repeat the rhythm',
  'Repartir el agua entre las plantas': 'Share water among the plants',
  'Alinear las dos perspectivas': 'Align the two perspectives',
  'Capturar los instantes': 'Capture the moments',
  'Reconstruir la constelación': 'Rebuild the constellation',
  'Escribir la siguiente página': 'Write the next page',
};

function getEnglishInteractionLabel(label) {
  return INTERACTION_LABELS[label] ?? label;
}

const ROOM_OBSTACLES = {
  1: [[0, -2.0, 1.05]],
  2: [[0, -1.5, 1.0], [-5.1, -2.3, 0.78], [5.1, -2.3, 0.78]],
  3: [[0, -1.48, 1.08]],
  4: [[-3.1, -1.35, 0.9], [3.2, -1.35, 0.9], [-4.9, -5.35, 0.7], [4.95, -5.35, 0.7]],
  5: [[0, -1.7, 0.65]],
  6: [[0, -4.1, 1.5]],
  7: [[-3.2, -0.5, 0.52]],
  8: [[0, -1.75, 1.08]],
};

export default function MuseumScene({
  phase,
  activeRoomId,
  completedRoomIds = [],
  nextRoomId,
  onOpenRoom,
  onStartMiniGame,
  onEnterGallery,
  onReturnFromGallery,
  onActivateGalleryLights,
  onOpenGalleryArtwork,
  galleryLightsOn = false,
  onPointerLockChange,
  onInteractionPromptChange,
  onCanvasReady,
}) {
  const interactionTargetsRef = useRef([]);
  const isRoomScene = [
    'enteringRoom',
    'room',
    'minigame',
    'reveal',
    'returningHub',
  ].includes(phase);
  const isGalleryScene = ['gallery', 'returningGallery'].includes(phase);

  return (
    <div className="museum-canvas">
      <Canvas
        dpr={[1, 1.25]}
        camera={{
          position: [0, EYE_HEIGHT, INTRO_SPAWN.z],
          fov: 67,
          near: 0.1,
          far: 90,
        }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.78;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor('#05060a', 1);
          camera.position.copy(INTRO_SPAWN);
          camera.rotation.order = 'YXZ';
          camera.rotation.set(-0.035, 0, 0, 'YXZ');
          onCanvasReady?.(gl.domElement);
        }}
      >
        <color attach="background" args={['#05060a']} />
        <fog
          attach="fog"
          args={isGalleryScene ? ['#05060a', 21, 52] : ['#05060a', 12, 35]}
        />

        {!isGalleryScene && (
          <>
            <hemisphereLight args={['#7b8498', '#090a0e', 0.16]} />
            <ambientLight intensity={0.045} color="#9aa4b8" />
            <pointLight position={[-8, 7, 5]} intensity={0.65} distance={23} color="#b7a080" />
            <pointLight position={[8, 5.5, -7]} intensity={0.35} distance={20} color="#7b8ba9" />
          </>
        )}

        <CameraDirector
          phase={phase}
          activeRoomId={activeRoomId}
          nextRoomId={nextRoomId}
          completedRoomIds={completedRoomIds}
          interactionTargetsRef={interactionTargetsRef}
          onOpenRoom={onOpenRoom}
          onStartMiniGame={onStartMiniGame}
          onEnterGallery={onEnterGallery}
          onReturnFromGallery={onReturnFromGallery}
          onActivateGalleryLights={onActivateGalleryLights}
          onOpenGalleryArtwork={onOpenGalleryArtwork}
          onPointerLockChange={onPointerLockChange}
          onInteractionPromptChange={onInteractionPromptChange}
        />

        {phase === 'intro' ? null : isGalleryScene ? (
          <MuseumGallery
            interactionTargetsRef={interactionTargetsRef}
            lightsOn={galleryLightsOn}
          />
        ) : isRoomScene ? (
          <MuseumRooms
            roomId={activeRoomId ?? 1}
            interactionTargetsRef={interactionTargetsRef}
          />
        ) : (
          <MuseumHub
            nextRoomId={nextRoomId}
            completedRoomIds={completedRoomIds}
            interactionTargetsRef={interactionTargetsRef}
          />
        )}
      </Canvas>
    </div>
  );
}

/** The sole authority for camera movement, pointer lock and interaction focus. */
function CameraDirector({
  phase,
  activeRoomId,
  nextRoomId,
  completedRoomIds,
  interactionTargetsRef,
  onOpenRoom,
  onStartMiniGame,
  onEnterGallery,
  onReturnFromGallery,
  onActivateGalleryLights,
  onOpenGalleryArtwork,
  onPointerLockChange,
  onInteractionPromptChange,
}) {
  const { camera, gl } = useThree();
  const domElement = gl.domElement;
  const keysRef = useRef(new Set());
  const lockedRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.035);
  const previousPhaseRef = useRef(null);
  const phaseRef = useRef(phase);
  const activeRoomIdRef = useRef(activeRoomId);
  const nextRoomIdRef = useRef(nextRoomId);
  const completedRoomIdsRef = useRef(completedRoomIds);
  const callbacksRef = useRef({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const centerNdcRef = useRef(new THREE.Vector2(0, 0));
  const currentInteractionRef = useRef(null);
  const lastInteractionKeyRef = useRef('');

  phaseRef.current = phase;
  activeRoomIdRef.current = activeRoomId;
  nextRoomIdRef.current = nextRoomId;
  completedRoomIdsRef.current = completedRoomIds;
  callbacksRef.current = {
    onOpenRoom,
    onStartMiniGame,
    onEnterGallery,
    onReturnFromGallery,
    onActivateGalleryLights,
    onOpenGalleryArtwork,
    onPointerLockChange,
    onInteractionPromptChange,
  };

  const publishInteraction = useCallback((interaction) => {
    currentInteractionRef.current = interaction;
    const key = interaction
      ? `${interaction.type}:${interaction.roomId ?? ''}:${interaction.label ?? ''}`
      : '';

    if (key === lastInteractionKeyRef.current) return;

    lastInteractionKeyRef.current = key;
    callbacksRef.current.onInteractionPromptChange?.(interaction ?? null);
  }, []);

  useLayoutEffect(() => {
    const previousPhase = previousPhaseRef.current;

    if (previousPhase === null) {
      camera.position.copy(INTRO_SPAWN);
      yawRef.current = 0;
      pitchRef.current = -0.035;
      camera.rotation.order = 'YXZ';
      camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ');
    } else if (phase === 'room' && previousPhase === 'enteringRoom') {
      camera.position.copy(ROOM_SPAWN);
      yawRef.current = 0;
      pitchRef.current = -0.035;
      camera.rotation.order = 'YXZ';
      camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ');
      camera.updateMatrixWorld(true);
    } else if (phase === 'gallery' && previousPhase === 'enteringGallery') {
      camera.position.copy(GALLERY_SPAWN);
      yawRef.current = 0;
      pitchRef.current = -0.035;
      camera.rotation.order = 'YXZ';
      camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ');
      camera.updateMatrixWorld(true);
    } else if (
      phase === 'hub'
      && ['enteringHub', 'returningHub', 'returningGallery'].includes(previousPhase)
    ) {
      camera.position.copy(HUB_SPAWN);
      yawRef.current = 0;
      pitchRef.current = -0.035;
      camera.rotation.order = 'YXZ';
      camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ');
      camera.updateMatrixWorld(true);
    }

    if (!['hub', 'room', 'gallery'].includes(phase)) {
      keysRef.current.clear();
      if (document.pointerLockElement === domElement) document.exitPointerLock();
      publishInteraction(null);
    }

    previousPhaseRef.current = phase;
  }, [camera, domElement, phase, publishInteraction]);

  useEffect(() => {
    const navigationAllowed = () => ['hub', 'room', 'gallery'].includes(phaseRef.current);

    const handlePointerLockChange = () => {
      const browserLocked = document.pointerLockElement === domElement;
      const accepted = browserLocked && navigationAllowed();

      if (browserLocked && !accepted) document.exitPointerLock();

      lockedRef.current = accepted;
      keysRef.current.clear();
      callbacksRef.current.onPointerLockChange?.(accepted);

      if (!accepted) publishInteraction(null);
    };

    const handleMouseMove = (event) => {
      if (!lockedRef.current || !navigationAllowed()) return;

      yawRef.current -= event.movementX * LOOK_SENSITIVITY;
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - event.movementY * LOOK_SENSITIVITY,
        -1.12,
        1.12,
      );

      camera.rotation.order = 'YXZ';
      camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ');
    };

    const handleKeyDown = (event) => {
      if (!lockedRef.current || !navigationAllowed()) return;

      if ([
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'ShiftLeft',
        'ShiftRight',
      ].includes(event.code)) {
        if (event.code.startsWith('Key')) event.preventDefault();
        keysRef.current.add(event.code);
        return;
      }

      if (event.code !== 'KeyE' || event.repeat) return;

      event.preventDefault();
      const interaction = currentInteractionRef.current;
      if (!interaction) return;

      if (interaction.type === 'door') {
        callbacksRef.current.onOpenRoom?.(interaction.roomId);
      } else if (interaction.type === 'roomGame') {
        callbacksRef.current.onStartMiniGame?.(interaction.roomId);
      } else if (interaction.type === 'gallery') {
        callbacksRef.current.onEnterGallery?.();
      } else if (interaction.type === 'galleryExit') {
        callbacksRef.current.onReturnFromGallery?.();
      } else if (interaction.type === 'gallerySwitch') {
        callbacksRef.current.onActivateGalleryLights?.();
      } else if (interaction.type === 'galleryArtwork') {
        callbacksRef.current.onOpenGalleryArtwork?.(interaction.artworkId);
      }
    };

    const handleKeyUp = (event) => keysRef.current.delete(event.code);
    const handleBlur = () => keysRef.current.clear();

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    handlePointerLockChange();

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      keysRef.current.clear();

      if (document.pointerLockElement === domElement) document.exitPointerLock();
    };
  }, [camera, domElement, publishInteraction]);

  useFrame((_, delta) => {
    const currentPhase = phaseRef.current;
    const safeDelta = Math.min(delta, 0.05);

    if (currentPhase === 'enteringHub') {
      camera.position.lerp(HUB_SPAWN, 1 - Math.exp(-delta * 5.8));
      camera.rotation.order = 'YXZ';
      camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ');
      return;
    }

    if (!['hub', 'room', 'gallery'].includes(currentPhase)) return;

    if (lockedRef.current) {
      const keys = keysRef.current;
      const forwardInput = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
      const strafeInput = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
      const length = Math.hypot(forwardInput, strafeInput);

      if (length > 0) {
        const norm = length > 1 ? 1 / length : 1;
        const speed = keys.has('ShiftLeft') || keys.has('ShiftRight')
          ? SPRINT_SPEED
          : WALK_SPEED;

        const forwardX = -Math.sin(yawRef.current);
        const forwardZ = -Math.cos(yawRef.current);
        const rightX = Math.cos(yawRef.current);
        const rightZ = -Math.sin(yawRef.current);
        const dx = (
          forwardX * forwardInput + rightX * strafeInput
        ) * norm * speed * safeDelta;
        const dz = (
          forwardZ * forwardInput + rightZ * strafeInput
        ) * norm * speed * safeDelta;

        const nextX = camera.position.x + dx;

        if (!isPositionBlocked(currentPhase, nextX, camera.position.z, activeRoomIdRef.current)) {
          camera.position.x = nextX;
        }

        const nextZ = camera.position.z + dz;

        if (!isPositionBlocked(currentPhase, camera.position.x, nextZ, activeRoomIdRef.current)) {
          camera.position.z = nextZ;
        }
      }
    }

    camera.position.y = EYE_HEIGHT;
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ');
    camera.updateMatrixWorld(true);

    if (!lockedRef.current) return;

    const targets = interactionTargetsRef.current;
    for (const target of targets) target.updateWorldMatrix(true, true);

    raycasterRef.current.setFromCamera(centerNdcRef.current, camera);
    raycasterRef.current.near = 0;
    raycasterRef.current.far = currentPhase === 'hub'
      ? HUB_DOOR_INTERACTION_DISTANCE
      : ROOM_INTERACTION_DISTANCE;

    const hits = raycasterRef.current.intersectObjects(targets, false);
    let focused = null;

    for (const hit of hits) {
      const data = hit.object.userData?.museumInteraction;
      if (!data) continue;

      if (data.type === 'doorInstances' && currentPhase === 'hub') {
        const room = ROOMS[hit.instanceId];
        if (!room) continue;

        const completed = completedRoomIdsRef.current.includes(room.id);
        const nextId = nextRoomIdRef.current;
        const lockedAhead = nextId !== null && room.id > nextId;

        focused = {
          type: 'door',
          roomId: room.id,
          label: lockedAhead
            ? `Visit room ${String(nextId).padStart(2, '0')}`
            : completed
              ? `Return to “${room.title}”`
              : `Enter “${room.title}”`,
        };

        break;
      }

      if (data.type === 'gallery' && currentPhase === 'hub') {
        focused = { type: 'gallery', label: 'Enter The Gallery' };
        break;
      }

      if (data.type === 'galleryExit' && currentPhase === 'gallery') {
        focused = { type: 'galleryExit', label: 'Return to Central Hall' };
        break;
      }

      if (data.type === 'gallerySwitch' && currentPhase === 'gallery') {
        focused = { type: 'gallerySwitch', label: 'Turn on the gallery lights' };
        break;
      }

      if (data.type === 'galleryArtwork' && currentPhase === 'gallery') {
        focused = {
          type: 'galleryArtwork',
          artworkId: data.artworkId,
          label: data.label ?? 'Read artwork description',
        };
        break;
      }

      if (
        data.type === 'roomGame'
        && currentPhase === 'room'
        && data.roomId === activeRoomIdRef.current
      ) {
        focused = {
          ...data,
          label: getEnglishInteractionLabel(data.label),
        };
        break;
      }
    }

    publishInteraction(focused);
  });

  return null;
}

function isPositionBlocked(phase, x, z, activeRoomId) {
  if (phase === 'gallery') {
    return x < -7.05 || x > 7.05 || z < -8.55 || z > 8.0;
  }

  if (phase === 'hub') {
    const radius = Math.hypot(x, z);
    if (radius > HUB_WALK_RADIUS || radius < 2.35) return true;

    for (let index = 0; index < ROOMS.length; index += 1) {
      const angle = (index / ROOMS.length) * Math.PI * 2 + Math.PI;
      const radial = x * Math.sin(angle) + z * Math.cos(angle);
      const tangent = x * Math.cos(angle) - z * Math.sin(angle);

      if (
        radial > HUB_DOOR_RADIUS - 0.58
        && radial < HUB_DOOR_RADIUS + 0.42
        && Math.abs(tangent) < 1.08
      ) return true;
    }

    for (let index = 0; index < 16; index += 1) {
      const angle = ((index + 0.5) / 16) * Math.PI * 2;
      const columnX = Math.sin(angle) * HUB_COLUMN_RADIUS;
      const columnZ = Math.cos(angle) * HUB_COLUMN_RADIUS;

      if (Math.hypot(x - columnX, z - columnZ) < 0.4) return true;
    }

    return false;
  }

  if (x < -7.35 || x > 7.35 || z < -8.45 || z > 8.0) return true;

  return (ROOM_OBSTACLES[activeRoomId] ?? []).some(
    ([centerX, centerZ, radius]) => Math.hypot(x - centerX, z - centerZ) < radius,
  );
}