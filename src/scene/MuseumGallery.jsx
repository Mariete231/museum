import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { GALLERY_ARTWORKS } from '../domain/galleryArtworks.js';
import { createArtworkTexture, preloadGalleryArtworks } from './galleryAssets.js';

const ARTWORK_CENTRE_Y = 2.9;
const ARTWORK_CENTRES_Z = [-5.35, 0, 5.35];
const ARTWORK_LIGHT_Z = [-5.25, 0, 5.25];

export default function MuseumGallery({ interactionTargetsRef, lightsOn }) {
  const { gl } = useThree();
  const [loadState, setLoadState] = useState('loading');
  const [artworkTextures, setArtworkTextures] = useState(null);
  const uploadIndexRef = useRef(0);
  const ownedTexturesRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    preloadGalleryArtworks(GALLERY_ARTWORKS)
      .then((bitmaps) => {
        if (cancelled) return;

        const textures = new Map();

        try {
          for (const artwork of GALLERY_ARTWORKS) {
            const canvas = bitmaps.get(artwork.id);

            if (!canvas) {
              throw new Error(`Gallery artwork ${artwork.id} was not prepared.`);
            }

            textures.set(
              artwork.id,
              createArtworkTexture(canvas, artwork.aspectRatio),
            );
          }
        } catch (error) {
          textures.forEach((texture) => texture.dispose());
          throw error;
        }

        if (cancelled) {
          textures.forEach((texture) => texture.dispose());
          return;
        }

        ownedTexturesRef.current = textures;
        setArtworkTextures(textures);
        uploadIndexRef.current = 0;
        setLoadState('uploading');
      })
      .catch((error) => {
        if (cancelled) return;

        console.error('[Gallery] The six artworks could not be prepared.', error);
        setLoadState('error');
      });

    return () => {
      cancelled = true;
      ownedTexturesRef.current?.forEach((texture) => texture.dispose());
      ownedTexturesRef.current = null;
    };
  }, []);

  useFrame(() => {
    if (loadState !== 'uploading' || !artworkTextures) return;

    const uploadIndex = uploadIndexRef.current;
    const artwork = GALLERY_ARTWORKS[uploadIndex];

    if (!artwork) {
      setLoadState('ready');
      return;
    }

    const texture = artworkTextures.get(artwork.id);

    try {
      if (!texture) {
        throw new Error(`Missing GPU texture for artwork ${artwork.id}.`);
      }

      // Upload one painting per frame while the room is still dark.
      gl.initTexture(texture);

      uploadIndexRef.current = uploadIndex + 1;

      if (uploadIndexRef.current === GALLERY_ARTWORKS.length) {
        setLoadState('ready');
      }
    } catch (error) {
      console.error(
        `[Gallery] GPU preparation failed for artwork ${artwork.id}.`,
        error,
      );
      setLoadState('error');
    }
  });

  const assetsReady = loadState === 'ready';
  const galleryRevealed = lightsOn && assetsReady;

  return (
    <group>
      <GalleryArchitecture lightsOn={galleryRevealed} />

      {GALLERY_ARTWORKS.map((artwork, index) => (
        <GalleryFrame
          key={artwork.id}
          artwork={artwork}
          artworkTexture={assetsReady ? artworkTextures?.get(artwork.id) : null}
          position={
            index < 3
              ? [-7.43, ARTWORK_CENTRE_Y, ARTWORK_CENTRES_Z[index]]
              : [7.43, ARTWORK_CENTRE_Y, ARTWORK_CENTRES_Z[index - 3]]
          }
          rotationY={index < 3 ? Math.PI / 2 : -Math.PI / 2}
          lightsOn={galleryRevealed}
          interactionTargetsRef={interactionTargetsRef}
        />
      ))}

      {!galleryRevealed && (
        <GallerySwitch
          lightsOn={false}
          loadState={loadState}
          interactionTargetsRef={interactionTargetsRef}
        />
      )}

      <GalleryExit
        interactionTargetsRef={interactionTargetsRef}
        lightsOn={galleryRevealed}
      />
    </group>
  );
}

function GalleryArchitecture({ lightsOn }) {
  const spotRefs = useRef([]);
  const targetRefs = useRef([]);
  const ceilingRef = useRef(null);
  const hemisphereRef = useRef(null);

  const spots = useMemo(() => [
    {
      position: [-5.15, 5.55, ARTWORK_LIGHT_Z[0]],
      target: [-7.3, 2.9, ARTWORK_LIGHT_Z[0]],
    },
    {
      position: [-5.15, 5.55, ARTWORK_LIGHT_Z[1]],
      target: [-7.3, 2.9, ARTWORK_LIGHT_Z[1]],
    },
    {
      position: [-5.15, 5.55, ARTWORK_LIGHT_Z[2]],
      target: [-7.3, 2.9, ARTWORK_LIGHT_Z[2]],
    },
    {
      position: [5.15, 5.55, ARTWORK_LIGHT_Z[0]],
      target: [7.3, 2.9, ARTWORK_LIGHT_Z[0]],
    },
    {
      position: [5.15, 5.55, ARTWORK_LIGHT_Z[1]],
      target: [7.3, 2.9, ARTWORK_LIGHT_Z[1]],
    },
    {
      position: [5.15, 5.55, ARTWORK_LIGHT_Z[2]],
      target: [7.3, 2.9, ARTWORK_LIGHT_Z[2]],
    },
  ], []);

  useLayoutEffect(() => {
    spotRefs.current.forEach((light, index) => {
      const target = targetRefs.current[index];

      if (!light || !target) return;

      light.target = target;
      target.updateMatrixWorld(true);
      light.updateMatrixWorld(true);
    });
  }, []);

  useFrame((_, delta) => {
    for (const light of spotRefs.current) {
      if (!light) continue;

      light.intensity = THREE.MathUtils.damp(
        light.intensity,
        lightsOn ? 42 : 0,
        2.6,
        delta,
      );
    }

    if (hemisphereRef.current) {
      hemisphereRef.current.intensity = THREE.MathUtils.damp(
        hemisphereRef.current.intensity,
        lightsOn ? 0.58 : 0.025,
        2.2,
        delta,
      );
    }

    if (ceilingRef.current) {
      ceilingRef.current.intensity = THREE.MathUtils.damp(
        ceilingRef.current.intensity,
        lightsOn ? 0.28 : 0.018,
        2.2,
        delta,
      );
    }
  });

  return (
    <group>
      {/* Stone floor */}
      <mesh position={[0, -0.19, 0]}>
        <boxGeometry args={[16.1, 0.38, 19.1]} />
        <meshStandardMaterial
          color="#454640"
          roughness={0.42}
          metalness={0.12}
        />
      </mesh>

      <mesh
        position={[0, 0.018, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[15.8, 18.8]} />
        <meshStandardMaterial
          color="#77776d"
          roughness={0.46}
          metalness={0.1}
        />
      </mesh>

      <mesh
        position={[0, 0.028, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[7.35, 7.42, 96]} />
        <meshBasicMaterial
          color="#b18a57"
          transparent
          opacity={lightsOn ? 0.46 : 0.09}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        position={[0, 0.035, -0.15]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[3.15, 10.5]} />
        <meshStandardMaterial color="#30343a" roughness={0.92} />
      </mesh>

      {[-1.63, 1.63].map((x) => (
        <mesh
          key={x}
          position={[x, 0.043, -0.15]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.035, 10.5]} />
          <meshBasicMaterial
            color="#b18a57"
            toneMapped={false}
            transparent
            opacity={lightsOn ? 0.9 : 0.14}
          />
        </mesh>
      ))}

      {/* Side walls */}
      {[-7.65, 7.65].map((x) => (
        <group key={x}>
          <mesh position={[x, 3.24, -0.1]}>
            <boxGeometry args={[0.36, 6.48, 18.4]} />
            <meshStandardMaterial color="#c5baa5" roughness={0.8} />
          </mesh>

          <mesh position={[x + (x < 0 ? 0.19 : -0.19), 3.22, -0.1]}>
            <boxGeometry args={[0.05, 6.3, 18.25]} />
            <meshStandardMaterial
              color="#ded1b8"
              roughness={0.65}
              metalness={0.04}
            />
          </mesh>

          <mesh position={[x + (x < 0 ? 0.13 : -0.13), 0.28, -0.1]}>
            <boxGeometry args={[0.12, 0.45, 18.2]} />
            <meshStandardMaterial
              color="#8d7048"
              roughness={0.38}
              metalness={0.6}
            />
          </mesh>

          <mesh position={[x + (x < 0 ? 0.13 : -0.13), 5.95, -0.1]}>
            <boxGeometry args={[0.12, 0.2, 18.2]} />
            <meshStandardMaterial
              color="#8d7048"
              roughness={0.38}
              metalness={0.6}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 3.24, -9.18]}>
        <boxGeometry args={[16.0, 6.48, 0.36]} />
        <meshStandardMaterial color="#c8beac" roughness={0.79} />
      </mesh>

      <mesh position={[-5.3, 3.24, 9.18]}>
        <boxGeometry args={[5.5, 6.48, 0.36]} />
        <meshStandardMaterial color="#c8beac" roughness={0.79} />
      </mesh>

      <mesh position={[5.3, 3.24, 9.18]}>
        <boxGeometry args={[5.5, 6.48, 0.36]} />
        <meshStandardMaterial color="#c8beac" roughness={0.79} />
      </mesh>

      <mesh position={[0, 5.96, 9.18]}>
        <boxGeometry args={[5.5, 0.22, 0.38]} />
        <meshStandardMaterial
          color="#98784d"
          roughness={0.35}
          metalness={0.64}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 6.3, 0]}>
        <boxGeometry args={[16.1, 0.3, 19.1]} />
        <meshStandardMaterial color="#282a2c" roughness={0.75} />
      </mesh>

      <mesh position={[0, 6.11, 0]}>
        <boxGeometry args={[14.6, 0.08, 17.5]} />
        <meshStandardMaterial
          color="#8d7048"
          roughness={0.36}
          metalness={0.58}
        />
      </mesh>

      <mesh position={[0, 6.16, 0]}>
        <boxGeometry args={[14.3, 0.09, 17.2]} />
        <meshStandardMaterial color="#d0c3a9" roughness={0.76} />
      </mesh>

      <hemisphereLight
        ref={hemisphereRef}
        args={['#c9c0af', '#211d18', 0.025]}
      />

      <ambientLight
        ref={ceilingRef}
        intensity={0.018}
        color="#f1e5ce"
      />

      {spots.map((spot, index) => (
        <group key={index}>
          <mesh position={spot.position}>
            <cylinderGeometry args={[0.055, 0.09, 0.18, 10]} />
            <meshStandardMaterial
              color="#a88858"
              roughness={0.32}
              metalness={0.72}
            />
          </mesh>

          <spotLight
            ref={(light) => { spotRefs.current[index] = light; }}
            position={spot.position}
            intensity={0}
            angle={0.82}
            penumbra={1}
            distance={15}
            decay={1.8}
            color="#ffe0ad"
            castShadow={false}
          />

          <object3D
            ref={(target) => { targetRefs.current[index] = target; }}
            position={spot.target}
          />
        </group>
      ))}

      <GalleryTitleSign lightsOn={lightsOn} />
    </group>
  );
}

function GalleryFrame({
  artwork,
  artworkTexture,
  position,
  rotationY,
  lightsOn,
  interactionTargetsRef,
}) {
  const targetRef = useRef(null);
  const [plaqueTexture, setPlaqueTexture] = useState(null);

  const frameWidth = artwork.canvasWidth + 0.36;
  const frameHeight = artwork.canvasHeight + 0.36;
  const plaqueY = -frameHeight / 2 - 0.24;
  const plaqueWidth = Math.min(artwork.canvasWidth + 0.15, 2.82);
  const plaqueMaterialKey =
    plaqueTexture?.uuid ?? `plaque-placeholder-${artwork.id}`;

  useEffect(() => {
    const labelTexture = createPlaqueTexture(artwork);
    setPlaqueTexture(labelTexture);

    return () => labelTexture.dispose();
  }, [artwork]);

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target || !lightsOn) return undefined;

    target.userData.museumInteraction = {
      type: 'galleryArtwork',
      artworkId: artwork.id,
      label: `Read “${artwork.title}”`,
    };

    interactionTargetsRef.current.push(target);

    return () => {
      const targetIndex = interactionTargetsRef.current.indexOf(target);

      if (targetIndex >= 0) {
        interactionTargetsRef.current.splice(targetIndex, 1);
      }

      delete target.userData.museumInteraction;
    };
  }, [artwork.id, artwork.title, interactionTargetsRef, lightsOn]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[frameWidth, frameHeight, 0.18]} />
        <meshStandardMaterial
          color="#3c3025"
          roughness={0.48}
          metalness={0.2}
        />
      </mesh>

      <mesh position={[0, 0, 0.102]}>
        <boxGeometry args={[frameWidth - 0.13, frameHeight - 0.13, 0.045]} />
        <meshStandardMaterial
          color="#b69b6d"
          roughness={0.42}
          metalness={0.42}
        />
      </mesh>

      <mesh position={[0, 0, 0.13]}>
        <boxGeometry args={[
          artwork.canvasWidth + 0.12,
          artwork.canvasHeight + 0.12,
          0.035,
        ]} />
        <meshStandardMaterial color="#e9dfcd" roughness={0.88} />
      </mesh>

      <mesh position={[0, 0, 0.157]}>
        <planeGeometry args={[artwork.canvasWidth, artwork.canvasHeight]} />
        <meshStandardMaterial
          map={artworkTexture ?? undefined}
          color={artworkTexture ? '#ffffff' : '#322c24'}
          emissive={lightsOn ? '#1b140c' : '#000000'}
          emissiveMap={lightsOn ? (artworkTexture ?? undefined) : undefined}
          emissiveIntensity={lightsOn ? 0.018 : 0}
          roughness={0.84}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>

      <FrameMoulding width={frameWidth} height={frameHeight} />

      <mesh position={[0, plaqueY, 0.105]}>
        <boxGeometry args={[plaqueWidth, 0.3, 0.09]} />
        <meshStandardMaterial
          color="#34291f"
          roughness={0.4}
          metalness={0.25}
        />
      </mesh>

      <mesh position={[0, plaqueY, 0.155]}>
        <planeGeometry args={[plaqueWidth - 0.08, 0.25]} />
        <meshBasicMaterial
          key={plaqueMaterialKey}
          map={plaqueTexture ?? undefined}
          color={plaqueTexture ? '#ffffff' : '#8b704d'}
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>

      <mesh ref={targetRef} position={[0, 0, 0.27]}>
        <planeGeometry args={[frameWidth + 0.12, frameHeight + 0.08]} />
        <meshBasicMaterial
          transparent
          opacity={0.001}
          colorWrite={false}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

function FrameMoulding({ width, height }) {
  const z = 0.185;
  const verticalHeight = Math.max(0.2, height - 0.12);

  const brass = {
    color: '#c2a16a',
    roughness: 0.3,
    metalness: 0.72,
  };

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh
          key={`v-${side}`}
          position={[side * (width / 2 - 0.045), 0, z]}
        >
          <boxGeometry args={[0.09, verticalHeight, 0.09]} />
          <meshStandardMaterial {...brass} />
        </mesh>
      ))}

      {[-1, 1].map((side) => (
        <mesh
          key={`h-${side}`}
          position={[0, side * (height / 2 - 0.045), z]}
        >
          <boxGeometry args={[width, 0.09, 0.09]} />
          <meshStandardMaterial {...brass} />
        </mesh>
      ))}

      {[-1, 1].flatMap((xSide) =>
        [-1, 1].map((ySide) => (
          <mesh
            key={`${xSide}-${ySide}`}
            position={[
              xSide * (width / 2 - 0.09),
              ySide * (height / 2 - 0.09),
              z + 0.005,
            ]}
          >
            <boxGeometry args={[0.11, 0.11, 0.095]} />
            <meshStandardMaterial
              color="#ddc28f"
              roughness={0.3}
              metalness={0.72}
            />
          </mesh>
        )),
      )}
    </group>
  );
}

function GallerySwitch({ lightsOn, loadState, interactionTargetsRef }) {
  const targetRef = useRef(null);
  const buttonRef = useRef(null);
  const [signTexture, setSignTexture] = useState(null);

  const signState = loadState === 'error'
    ? 'error'
    : loadState === 'ready'
      ? 'ready'
      : 'preparing';

  const signLines = signState === 'error'
    ? ['EXHIBITION NOT READY', 'EXIT AND RE-ENTER TO RETRY']
    : signState === 'ready'
      ? ['MASTER LIGHTING', 'PRESS E TO REVEAL THE GALLERY']
      : ['PREPARING THE EXHIBITION', 'SIX WORKS ARE BEING CHECKED'];

  useEffect(() => {
    const texture = makeTextTexture({
      width: 640,
      height: 180,
      background: '#29251e',
      border: '#b99a69',
      lines: signLines,
    });

    setSignTexture(texture);

    return () => texture.dispose();
  }, [signState]);

  useFrame(({ clock }) => {
    if (!buttonRef.current) return;

    const canActivate = loadState === 'ready' && !lightsOn;

    buttonRef.current.material.emissiveIntensity = canActivate
      ? 0.46 + (Math.sin(clock.elapsedTime * 2.1) + 1) * 0.09
      : lightsOn
        ? 0.12
        : 0.035;
  });

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target || lightsOn || loadState !== 'ready') return undefined;

    target.userData.museumInteraction = {
      type: 'gallerySwitch',
      label: 'Turn on the gallery lights',
    };

    interactionTargetsRef.current.push(target);

    return () => {
      const index = interactionTargetsRef.current.indexOf(target);

      if (index >= 0) {
        interactionTargetsRef.current.splice(index, 1);
      }

      delete target.userData.museumInteraction;
    };
  }, [interactionTargetsRef, lightsOn, loadState]);

  return (
    <group position={[0, 0, 4.2]}>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[1.08, 0.28, 0.86]} />
        <meshStandardMaterial
          color="#38332a"
          roughness={0.55}
          metalness={0.22}
        />
      </mesh>

      <mesh position={[0, 0.77, 0]}>
        <boxGeometry args={[0.7, 1.12, 0.64]} />
        <meshStandardMaterial
          color="#594631"
          roughness={0.42}
          metalness={0.42}
        />
      </mesh>

      <mesh position={[0, 1.52, 0.335]}>
        <boxGeometry args={[0.96, 0.98, 0.2]} />
        <meshStandardMaterial
          color="#b08c59"
          roughness={0.34}
          metalness={0.68}
        />
      </mesh>

      <mesh position={[0, 1.52, 0.443]}>
        <boxGeometry args={[0.84, 0.86, 0.035]} />
        <meshStandardMaterial
          color="#27231d"
          roughness={0.48}
          metalness={0.18}
        />
      </mesh>

      <mesh position={[0, 1.82, 0.467]}>
        <planeGeometry args={[0.72, 0.22]} />
        <meshBasicMaterial
          key={signTexture?.uuid ?? 'gallery-switch-sign-placeholder'}
          map={signTexture ?? undefined}
          toneMapped={false}
        />
      </mesh>

      <mesh
        position={[0, 1.25, 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.19, 0.19, 0.09, 32]} />
        <meshStandardMaterial
          color="#d0b17a"
          roughness={0.28}
          metalness={0.78}
        />
      </mesh>

      <mesh
        position={[0, 1.25, 0.535]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.145, 0.145, 0.055, 32]} />
        <meshStandardMaterial
          color="#44372a"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      <mesh
        ref={buttonRef}
        position={[0, 1.25, 0.5725]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.105, 0.105, 0.035, 32]} />
        <meshStandardMaterial
          color="#e6c58d"
          roughness={0.24}
          metalness={0.28}
          emissive="#d9953c"
          emissiveIntensity={0.035}
        />
      </mesh>

      {[-0.34, 0.34].map((x) => (
        <mesh
          key={x}
          position={[x, 1.52, 0.469]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.018, 12]} />
          <meshStandardMaterial
            color="#ddc18b"
            roughness={0.26}
            metalness={0.8}
          />
        </mesh>
      ))}

      <pointLight
        position={[0, 1.26, 0.75]}
        intensity={loadState === 'ready' && !lightsOn ? 0.24 : 0.05}
        distance={2.0}
        decay={2}
        color="#f4c783"
      />

      <mesh ref={targetRef} position={[0, 1.5, 0.82]}>
        <planeGeometry args={[1.12, 1.42]} />
        <meshBasicMaterial
          transparent
          opacity={0.001}
          colorWrite={false}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

function GalleryTitleSign({ lightsOn }) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const activeTexture = makeTextTexture({
      width: 1024,
      height: 256,
      background: '#282820',
      border: '#b99a69',
      lines: ['THE GALLERY', 'SIX FRAGMENTS OF ONE STORY'],
    });

    setTexture(activeTexture);

    return () => activeTexture.dispose();
  }, []);

  return (
    <group position={[0, 4.45, -8.93]}>
      <mesh>
        <boxGeometry args={[4.7, 1.22, 0.17]} />
        <meshStandardMaterial
          color="#3b3024"
          roughness={0.5}
          metalness={0.18}
        />
      </mesh>

      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[4.5, 1.02]} />
        <meshStandardMaterial
          key={texture?.uuid ?? 'gallery-title-sign-placeholder'}
          map={texture ?? undefined}
          roughness={0.75}
          metalness={0.04}
          color={lightsOn ? '#ffffff' : '#090807'}
          emissive={lightsOn ? '#8b673a' : '#000000'}
          emissiveIntensity={lightsOn ? 0.075 : 0}
        />
      </mesh>
    </group>
  );
}

/**
 * The entire physical plaque assembly is rotated around its own centre:
 * backing and text surface move together.
 *
 * The rotation is 180 degrees on X. Since that inverts the local vertical
 * axis, the canvas is mirrored vertically to keep the lettering upright.
 */
function GalleryExit({ interactionTargetsRef, lightsOn }) {
  const targetRef = useRef(null);
  const [plaqueTexture, setPlaqueTexture] = useState(null);

  useEffect(() => {
    const texture = makeTextTexture({
      width: 640,
      height: 160,
      background: '#352a20',
      border: '#c3a16b',
      lines: ['CENTRAL HALL', 'PRESS E TO RETURN'],
      mirrorY: true,
    });

    setPlaqueTexture(texture);

    return () => texture.dispose();
  }, []);

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) return undefined;

    target.userData.museumInteraction = {
      type: 'galleryExit',
      label: 'Return to Central Hall',
    };

    interactionTargetsRef.current.push(target);

    return () => {
      const index = interactionTargetsRef.current.indexOf(target);

      if (index >= 0) {
        interactionTargetsRef.current.splice(index, 1);
      }

      delete target.userData.museumInteraction;
    };
  }, [interactionTargetsRef]);

  return (
    <group>
      {/* The exit structure remains fixed in the wall. */}
      {[-2.75, 2.75].map((x) => (
        <mesh key={x} position={[x, 3.0, 8.69]}>
          <boxGeometry args={[0.2, 5.9, 0.5]} />
          <meshStandardMaterial
            color="#9a794e"
            roughness={0.36}
            metalness={0.64}
          />
        </mesh>
      ))}

      <mesh position={[0, 5.96, 8.69]}>
        <boxGeometry args={[5.7, 0.23, 0.52]} />
        <meshStandardMaterial
          color="#9a794e"
          roughness={0.36}
          metalness={0.64}
        />
      </mesh>

      {/*
        COMPLETE PLAQUE ASSEMBLY:
        Both the physical backing and the text plane are children of this
        transformed group. They cannot end up facing opposite directions.
      */}
      <group
        position={[0, 4.88, 8.53]}
        rotation={[Math.PI, 0, 0]}
      >
        {/* Physical backing */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.25, 0.83, 0.16]} />
          <meshStandardMaterial
            color="#3c3024"
            roughness={0.45}
            metalness={0.22}
          />
        </mesh>

        {/* Front face, now pointing towards the gallery interior (-Z). */}
        <mesh position={[0, 0, 0.095]}>
          <planeGeometry args={[3.08, 0.68]} />
          <meshBasicMaterial
            key={plaqueTexture?.uuid ?? 'gallery-exit-sign-placeholder'}
            map={plaqueTexture ?? undefined}
            toneMapped={false}
            side={THREE.FrontSide}
            color={lightsOn ? '#ffffff' : '#100e0b'}
          />
        </mesh>
      </group>

      {/* Interaction target */}
      <mesh ref={targetRef} position={[0, 1.8, 7.65]}>
        <boxGeometry args={[3.8, 2.9, 0.28]} />
        <meshBasicMaterial
          transparent
          opacity={0.001}
          colorWrite={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function createPlaqueTexture(artwork) {
  return makeTextTexture({
    width: 1024,
    height: 144,
    background: '#352b21',
    border: '#b59a6d',
    lines: [`${artwork.id}  ·  ${artwork.title.toUpperCase()}`],
    singleLineFontSize: 42,
    minimumSingleLineFontSize: 20,
    horizontalPadding: 54,
  });
}

function makeTextTexture({
  width,
  height,
  background,
  border,
  lines,
  mirrorX = false,
  mirrorY = false,
  singleLineFontSize,
  minimumSingleLineFontSize = 18,
  horizontalPadding = 28,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) return new THREE.Texture();

  if (mirrorX || mirrorY) {
    context.translate(
      mirrorX ? width : 0,
      mirrorY ? height : 0,
    );

    context.scale(
      mirrorX ? -1 : 1,
      mirrorY ? -1 : 1,
    );
  }

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = border;
  context.lineWidth = Math.max(2, width * 0.006);
  context.strokeRect(8, 8, width - 16, height - 16);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#e6d7bb';

  if (lines.length === 1) {
    const availableWidth = width - horizontalPadding * 2;

    let fontSize = singleLineFontSize ?? Math.round(height * 0.25);
    context.font = `${fontSize}px Georgia, serif`;

    while (
      context.measureText(lines[0]).width > availableWidth
      && fontSize > minimumSingleLineFontSize
    ) {
      fontSize -= 1;
      context.font = `${fontSize}px Georgia, serif`;
    }

    context.fillText(
      lines[0],
      width / 2,
      height / 2,
      availableWidth,
    );
  } else {
    context.font = `${Math.round(height * 0.21)}px Georgia, serif`;
    context.fillText(
      lines[0],
      width / 2,
      height * 0.39,
      width - 28,
    );

    context.fillStyle = '#c4b394';
    context.font = `${Math.round(height * 0.13)}px Arial, sans-serif`;

    context.fillText(
      lines[1],
      width / 2,
      height * 0.71,
      width - 28,
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.needsUpdate = true;

  return texture;
}