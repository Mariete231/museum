import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import MuseumScene from './scene/MuseumScene.jsx';
import RoomMiniGame from './scene/RoomMiniGame.jsx';
import './minigames.css';
import './intro-reveal.css';
import './gallery.css';
import { initialMuseumState, museumReducer, ROOMS } from './domain/museumState.js';
import { getGalleryArtworkById } from './domain/galleryArtworks.js';
import GalleryArtworkLabel from './components/GalleryArtworkLabel.jsx';

const ROOM_SYMBOLS = {
  archivo: '⌑',
  vitrina: '◇',
  sonido: '∿',
  jardin: '✳',
  perspectiva: '⌘',
  teatro: '◌',
  observatorio: '✧',
  libro: '▤',
};

export default function App() {
  const [state, dispatch] = useReducer(museumReducer, initialMuseumState);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [hasStartedExploration, setHasStartedExploration] = useState(false);
  const [interactionTarget, setInteractionTarget] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [galleryWalkStarted, setGalleryWalkStarted] = useState(false);
  const canvasElementRef = useRef(null);

  const activeRoom = ROOMS.find((room) => room.id === state.activeRoomId) ?? null;
  const interactionRoom = interactionTarget?.type === 'door'
    ? ROOMS.find((room) => room.id === interactionTarget.roomId) ?? null
    : null;
  const completedCount = state.completedRoomIds.length;
  const nextRoom = useMemo(
    () => ROOMS.find((room) => !state.completedRoomIds.includes(room.id)) ?? null,
    [state.completedRoomIds],
  );

  const isIntro = state.phase === 'intro' || state.phase === 'enteringHub';
  const isHub = state.phase === 'hub';
  const isRoom = state.phase === 'room';
  const isGallery = state.phase === 'gallery';
  const isNavigable = isHub || isRoom || isGallery;
  const isTransitionCovering = [
    'enteringRoom',
    'returningHub',
    'enteringGallery',
    'returningGallery',
  ].includes(state.phase);
  const showExplorationBackdrop = !pointerLocked
    && !selectedArtwork
    && ['hub', 'room', 'gallery'].includes(state.phase);

  const handleCanvasReady = useCallback((canvasElement) => {
    canvasElementRef.current = canvasElement;
  }, []);

  const handlePointerLockChange = useCallback((isLocked) => {
    setPointerLocked(isLocked);
    if (isLocked) setHasStartedExploration(true);
    else setInteractionTarget(null);
  }, []);

  const handleInteractionPromptChange = useCallback((target) => {
    setInteractionTarget(target ?? null);
  }, []);

  const requestPointerLock = useCallback(() => {
    if (state.phase === 'gallery') setGalleryWalkStarted(true);
    const canvasElement = canvasElementRef.current;

    if (!canvasElement?.requestPointerLock) {
      dispatch({
        type: 'SET_NOTICE',
        message: 'This browser does not support first-person mouse control.',
      });
      return;
    }

    try {
      const request = canvasElement.requestPointerLock();

      if (request && typeof request.catch === 'function') {
        request.catch(() => {
          dispatch({
            type: 'SET_NOTICE',
            message: 'Mouse control could not be captured. Select “Begin exploring” again.',
          });
        });
      }
    } catch {
      dispatch({
        type: 'SET_NOTICE',
        message: 'First-person controls could not be activated.',
      });
    }
  }, [state.phase]);

  useEffect(() => {
    const handleGlobalKeyboard = (event) => {
      if (!selectedArtwork || event.key !== 'Escape') return;
      event.preventDefault();
      setSelectedArtwork(null);
    };

    window.addEventListener('keydown', handleGlobalKeyboard);
    return () => window.removeEventListener('keydown', handleGlobalKeyboard);
  }, [selectedArtwork]);

  const handleIntroTransitionEnd = useCallback((event) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'opacity') return;
    dispatch({ type: 'COMPLETE_HUB_ENTRY' });
  }, []);

  const handleSceneTransitionEnd = useCallback((event) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'opacity') return;

    if (state.phase === 'enteringRoom') {
      dispatch({ type: 'ROOM_TRANSITION_COVERED' });
    } else if (state.phase === 'returningHub') {
      dispatch({ type: 'HUB_TRANSITION_COVERED' });
    } else if (state.phase === 'enteringGallery') {
      dispatch({ type: 'GALLERY_TRANSITION_COVERED' });
    } else if (state.phase === 'returningGallery') {
      dispatch({ type: 'RETURN_GALLERY_TRANSITION_COVERED' });
    }
  }, [state.phase]);

  let interactionPrompt = null;

  if (isHub && interactionRoom) {
    interactionPrompt = interactionTarget?.label
      ?? `Enter “${interactionRoom.title}”`;
  } else if (isHub && interactionTarget?.type === 'gallery') {
    interactionPrompt = interactionTarget.label ?? 'Enter The Gallery';
  } else if (isRoom && interactionTarget?.type === 'roomGame') {
    interactionPrompt = interactionTarget.label ?? 'Start the mini-game';
  } else if (isGallery && interactionTarget?.type === 'galleryExit') {
    interactionPrompt = interactionTarget.label ?? 'Return to Central Hall';
  } else if (isGallery && interactionTarget?.type === 'gallerySwitch') {
    interactionPrompt = interactionTarget.label ?? 'Turn on the gallery lights';
  } else if (isGallery && interactionTarget?.type === 'galleryArtwork') {
    interactionPrompt = interactionTarget.label ?? 'Read artwork description';
  }

  const activateGalleryLights = useCallback(() => {
    dispatch({ type: 'ACTIVATE_GALLERY_LIGHTS' });
  }, []);

  const openGalleryArtwork = useCallback((artworkId) => {
    const artwork = getGalleryArtworkById(artworkId);
    if (!artwork) return;

    setSelectedArtwork(artwork);
    if (document.pointerLockElement) document.exitPointerLock();
  }, []);

  const closeGalleryArtwork = useCallback(() => {
    setSelectedArtwork(null);
  }, []);

  const returnToGalleryWalk = useCallback(() => {
    // Pointer lock is reacquired only from this explicit user click, never as a side effect
    // of closing a modal. If the browser declines it, the resume panel remains available.
    setSelectedArtwork(null);
    requestPointerLock();
  }, [requestPointerLock]);

  const enterGallery = useCallback(() => {
    setGalleryWalkStarted(false);
    dispatch({ type: 'ENTER_GALLERY' });
  }, []);

  const returnFromGallery = useCallback(() => {
    setGalleryWalkStarted(false);
    dispatch({ type: 'RETURN_FROM_GALLERY' });
  }, []);

  const handleGameWon = useCallback((result) => {
    if (activeRoom) {
      dispatch({
        type: 'ROOM_GAME_WON',
        roomId: activeRoom.id,
        result,
      });
    }
  }, [activeRoom]);

  return (
    <main className={`museum-app phase-${state.phase}`}>
      {state.phase !== 'intro' && (
        <MuseumScene
          phase={state.phase}
          activeRoomId={state.activeRoomId}
          completedRoomIds={state.completedRoomIds}
          nextRoomId={nextRoom?.id ?? null}
          onOpenRoom={(roomId) => dispatch({ type: 'OPEN_ROOM', roomId })}
          onStartMiniGame={(roomId) => dispatch({ type: 'START_MINIGAME', roomId })}
          onEnterGallery={enterGallery}
          onReturnFromGallery={returnFromGallery}
          onActivateGalleryLights={activateGalleryLights}
          onOpenGalleryArtwork={openGalleryArtwork}
          galleryLightsOn={state.galleryLightsOn}
          onPointerLockChange={handlePointerLockChange}
          onInteractionPromptChange={handleInteractionPromptChange}
          onCanvasReady={handleCanvasReady}
        />
      )}

      {state.phase !== 'intro' && (
        <div className="scene-vignette" aria-hidden="true" />
      )}

      {showExplorationBackdrop && (
        <div className="exploration-blur" aria-hidden="true" />
      )}

      {isIntro && (
        <section
          className={`intro-screen${state.phase === 'enteringHub' ? ' is-exiting' : ''}`}
          aria-labelledby="intro-title"
          onTransitionEnd={handleIntroTransitionEnd}
        >
          <div className="intro-content">
            <p className="eyebrow intro-kicker">EIGHT MONTHS · ONE STORY</p>
            <h1 id="intro-title">The Museum</h1>
            <p className="intro-subtitle">
              of everything that happened before we noticed
            </p>
            <button
              className="primary-button intro-button"
              type="button"
              disabled={state.phase === 'enteringHub'}
              onClick={() => dispatch({ type: 'BEGIN_ENTRY' })}
            >
              <span>Enter</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
      )}

      {isHub && (
        <>
          <header className="hub-topbar" aria-label="Central Hall">
            <div className="hub-brand">
              <span className="brand-mark" aria-hidden="true">M.</span>
              <div>
                <span className="eyebrow">THE MUSEUM</span>
                <strong>Central Hall</strong>
              </div>
            </div>

            <div
              className="hub-progress"
              aria-label={`${completedCount} of 8 rooms completed`}
            >
              <span className="status-dot" />
              <span>{String(completedCount).padStart(2, '0')}</span>
              <span className="progress-divider">/</span>
              <span>08</span>
            </div>
          </header>

          {!pointerLocked && (
            <section
              className="exploration-panel hub-entry-panel"
              aria-labelledby="hub-entry-title"
            >
              <p className="eyebrow">THE CENTRAL ARCHIVE</p>
              <h1 id="hub-entry-title">A place to return to.</h1>
              <p className="exploration-copy">
                {nextRoom
                  ? 'Eight doors, eight small experiences. The journey unfolds one room at a time. Begin with the door illuminated for you.'
                  : 'All eight experiences are complete. The sculpture at the centre has awakened. Approach its light and press E to enter The Gallery.'}
              </p>

              <div className="next-room-callout">
                <span className="status-dot" />
                <span>
                  {nextRoom
                    ? `NEXT · ROOM ${String(nextRoom.id).padStart(2, '0')} · ${nextRoom.title.toLocaleUpperCase('en-US')}`
                    : 'GALLERY UNLOCKED · THE CENTRAL SCULPTURE IS AWAKE'}
                </span>
              </div>

              <div className="control-guide">
                <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span>
                <span><kbd>MOUSE</kbd> Look</span>
                <span><kbd>E</kbd> Enter / play</span>
                <span><kbd>SHIFT</kbd> Sprint</span>
                <span><kbd>ESC</kbd> Pause</span>
              </div>

              <button
                className="primary-button exploration-start-button"
                type="button"
                onClick={requestPointerLock}
              >
                <span>
                  {hasStartedExploration ? 'Resume exploring' : 'Begin exploring'}
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            </section>
          )}
        </>
      )}

      {isGallery && (
        <header className="hub-topbar gallery-topbar" aria-label="The Gallery">
          <div className="hub-brand">
            <span className="brand-mark" aria-hidden="true">M.</span>
            <div>
              <span className="eyebrow">THE MUSEUM</span>
              <strong>The Gallery</strong>
            </div>
          </div>
          <div className="hub-progress">
            <span className="status-dot" />
            {state.galleryLightsOn ? 'LIGHTS ON · SIX WORKS' : 'GALLERY IN DARKNESS'}
          </div>
        </header>
      )}

      {isGallery && !pointerLocked && !selectedArtwork && !galleryWalkStarted && (
        <section
          className="exploration-panel gallery-entry-panel"
          aria-labelledby="gallery-entry-title"
        >
          <p className="eyebrow">THE FINAL ROOM · UNLOCKED</p>
          <h1 id="gallery-entry-title">
            {state.galleryLightsOn ? 'Six memories. One story.' : 'Before the paintings appear.'}
          </h1>
          <p className="exploration-copy">
            {state.galleryLightsOn
              ? 'Walk between the six paintings. Aim at a work and press E to open its museum label and dedication.'
              : 'The gallery is deliberately unlit. Begin your walk, find the brass lighting console just ahead, aim at it and press E. The room will slowly reveal its six works.'}
          </p>
          <div className="gallery-entry-note">
            <span className="status-dot" />
            {state.galleryLightsOn
              ? 'SIX WORKS · PRESS E TO READ A PAINTING'
              : 'LIGHTS OFF · A SINGLE SWITCH WAITS NEAR THE ENTRANCE'}
          </div>
          <div className="control-guide">
            <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span>
            <span><kbd>MOUSE</kbd> Look</span>
            <span><kbd>E</kbd> Switch lights / read paintings / return</span>
            <span><kbd>SHIFT</kbd> Sprint</span>
            <span><kbd>ESC</kbd> Pause</span>
          </div>
          <button
            className="primary-button exploration-start-button"
            type="button"
            onClick={requestPointerLock}
          >
            <span>
              {state.galleryLightsOn ? 'Continue gallery walk' : 'Enter the dark gallery'}
            </span>
            <span aria-hidden="true">↗</span>
          </button>
          <button
            className="text-button room-exit-button"
            type="button"
            onClick={returnFromGallery}
          >
            Return to Central Hall
          </button>
        </section>
      )}

      {isGallery && !pointerLocked && !selectedArtwork && galleryWalkStarted && (
        <section className="gallery-resume-panel" aria-label="Resume gallery exploration">
          <span className="eyebrow">THE GALLERY</span>
          <p>Your viewing session is paused.</p>
          <button className="primary-button" type="button" onClick={requestPointerLock}>
            <span>Resume first-person viewing</span><span aria-hidden="true">↗</span>
          </button>
          <button className="text-button" type="button" onClick={returnFromGallery}>
            Return to Central Hall
          </button>
        </section>
      )}

      {isRoom && !pointerLocked && activeRoom && (
        <section
          className="exploration-panel room-entry-panel"
          aria-labelledby="room-title"
        >
          <p className="eyebrow">
            ROOM {String(activeRoom.id).padStart(2, '0')} · INTERACTIVE EXPERIENCE
          </p>

          <h1 id="room-title">{activeRoom.title}</h1>
          <p className="exploration-copy">{activeRoom.subtitle}</p>

          <p className="exploration-copy room-mechanic-copy">
            <span className="eyebrow">THE CHALLENGE</span>
            {activeRoom.mechanicHint}
          </p>

          <div className="control-guide">
            <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span>
            <span><kbd>MOUSE</kbd> Look</span>
            <span><kbd>E</kbd> Start game</span>
            <span><kbd>SHIFT</kbd> Sprint</span>
            <span><kbd>ESC</kbd> Pause</span>
          </div>

          <button
            className="primary-button exploration-start-button"
            type="button"
            onClick={requestPointerLock}
          >
            <span>
              {hasStartedExploration ? 'Return to exploring' : 'Begin exploring'}
            </span>
            <span aria-hidden="true">↗</span>
          </button>

          <button
            className="text-button room-exit-button"
            type="button"
            onClick={() => dispatch({ type: 'RETURN_TO_HUB' })}
          >
            Return to the hall
          </button>
        </section>
      )}

      {isNavigable && pointerLocked && (
        <div className="first-person-hud" aria-live="polite">
          <div className="crosshair" aria-hidden="true"><span /></div>

          {interactionPrompt && (
            <div className="interaction-prompt">
              <kbd>E</kbd>
              <span>{interactionPrompt}</span>
            </div>
          )}

          <div className="first-person-help">
            <span>W A S D <i>·</i> MOVE</span>
            <span>MOUSE <i>·</i> LOOK</span>
            <span>E <i>·</i> INTERACT</span>
            <span>SHIFT <i>·</i> SPRINT</span>
            <span>ESC <i>·</i> PAUSE</span>
          </div>
        </div>
      )}

      {state.phase === 'minigame' && activeRoom && (
        <RoomMiniGame
          key={`${activeRoom.id}-${state.completedRoomIds.length}`}
          room={activeRoom}
          onWin={handleGameWon}
          onClose={() => dispatch({ type: 'CLOSE_MINIGAME' })}
        />
      )}

      {state.phase === 'reveal' && activeRoom && (
        <div className="reveal-backdrop">
          <section
            className="reveal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reveal-title"
          >
            <p className="eyebrow">
              ROOM {String(activeRoom.id).padStart(2, '0')} · EXPERIENCE COMPLETE
            </p>

            <div className="reveal-symbol" aria-hidden="true">
              {ROOM_SYMBOLS[activeRoom.motif] ?? '✳'}
            </div>

            <h2 id="reveal-title">{activeRoom.revealTitle}</h2>
            <p>{activeRoom.meaning}</p>

            {state.roomResults[activeRoom.id]?.promises && (
              <div className="promise-summary reveal-promises">
                <span className="minigame-overline">
                  YOUR THREE PROMISES FOR WHAT COMES NEXT
                </span>

                {state.roomResults[activeRoom.id].promises.map((promise, index) => (
                  <p key={promise.chapter}>
                    <strong>{index + 1}.</strong> {promise.title} — {promise.copy}
                  </p>
                ))}
              </div>
            )}

            {state.roomResults[activeRoom.id]?.summary && (
              <p className="game-result-summary">
                {state.roomResults[activeRoom.id].summary}
              </p>
            )}

            <div className="reveal-note">
              <span className="status-dot" />
              CHALLENGE COMPLETE · ROOM {String(activeRoom.id).padStart(2, '0')} OF 08
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={() => dispatch({ type: 'FINISH_REVEAL' })}
            >
              <span>
                {activeRoom.id < 8 ? 'Continue the journey' : 'Return to the hall'}
              </span>
              <span aria-hidden="true">↗</span>
            </button>

            {nextRoom && activeRoom.id < 8 && (
              <p className="reveal-progress">
                THE NEXT DOOR WILL BE ROOM {String(nextRoom.id).padStart(2, '0')}
              </p>
            )}
            {activeRoom.id === 8 && (
              <p className="reveal-progress">
                RETURN TO THE CENTRAL HALL TO SEE THE SCULPTURE AWAKEN AND OPEN THE GALLERY.
              </p>
            )}
          </section>
        </div>
      )}

      {isGallery && selectedArtwork && (
        <GalleryArtworkLabel
          artwork={selectedArtwork}
          onClose={closeGalleryArtwork}
          onResume={returnToGalleryWalk}
        />
      )}

      {state.notice && !isIntro && (
        <div className="notice-toast" role="status">
          <span>{state.notice}</span>
          <button
            className="notice-close"
            type="button"
            aria-label="Dismiss notice"
            onClick={() => dispatch({ type: 'DISMISS_NOTICE' })}
          >
            ×
          </button>
        </div>
      )}

      <div
        className={`scene-transition${isTransitionCovering ? ' is-covering' : ''}`}
        aria-hidden="true"
        onTransitionEnd={handleSceneTransitionEnd}
      />
    </main>
  );
}