/** Canonical content and progression state for The Museum. */
export const ROOMS = [
  {
    id: 1,
    title: 'The First Page',
    plaqueTitle: 'FIRST PAGE',
    subtitle: 'Beginnings are built one piece at a time.',
    motif: 'archivo',
    accent: '#d9ad70',
    revealTitle: 'A Page Yet to Be Written',
    meaning: 'Choosing each other does not always begin with grand gestures. Sometimes it begins with curiosity, care, and the desire to truly know someone.',
    mechanicHint: 'Rebuild the scrambled letter: slide each fragment into the empty space until the sentence comes together.',
    game: 'sliding',
    progressLabel: 'Rebuild a letter',
  },
  {
    id: 2,
    title: 'The Cabinet of Little Things',
    plaqueTitle: 'LITTLE THINGS',
    subtitle: 'Small things hold stories, too.',
    motif: 'vitrina',
    accent: '#a6c4d9',
    revealTitle: 'The Value of a Small Thing',
    meaning: 'Paying attention is a form of love: remembering details the rest of the world might overlook.',
    mechanicHint: 'Complete three memory rounds: 8 cards, then 12, then 16. Each round adds more details to remember.',
    game: 'memory',
    progressLabel: 'Find the pairs',
  },
  {
    id: 3,
    title: 'The Room of Voices',
    plaqueTitle: 'ROOM OF VOICES',
    subtitle: 'Learning someone’s rhythm without ever stopping listening.',
    motif: 'sonido',
    accent: '#9aaee7',
    revealTitle: 'A Sound That Stays',
    meaning: 'Listening is not waiting for your turn to speak; it is paying attention and learning another person’s rhythm.',
    mechanicHint: 'Listen and repeat three melodies of increasing length: five notes, seven notes, then nine. One wrong note resets the current sequence.',
    game: 'rhythm',
    progressLabel: 'Repeat the rhythm',
  },
  {
    id: 4,
    title: 'The Garden of Growing Things',
    plaqueTitle: 'THE GARDEN',
    subtitle: 'Care is not giving everything the same thing; it is understanding what each one needs.',
    motif: 'jardin',
    accent: '#a5bd82',
    revealTitle: 'Something Still Growing',
    meaning: 'Love needs consistency, but also attention. Each plant needs a different amount; caring well means learning to notice.',
    mechanicHint: 'Solve three garden rounds using the written clues. Allocate exactly eight drops, then test your plan and revise any imbalance.',
    game: 'garden',
    progressLabel: 'Share the water',
  },
  {
    id: 5,
    title: 'The Gallery of Two Perspectives',
    plaqueTitle: 'TWO PERSPECTIVES',
    subtitle: 'Two points of view can form one shared picture.',
    motif: 'perspectiva',
    accent: '#dfbb84',
    revealTitle: 'When Everything Finds Its Place',
    meaning: 'Being together does not mean always seeing things the same way. It means having the patience to adjust your perspective until you understand each other better.',
    mechanicHint: 'Align three different pairs of perspectives. Each stage has a new target, and the final seam must be almost exact.',
    game: 'alignment',
    progressLabel: 'Align the perspectives',
  },
  {
    id: 6,
    title: 'The Held Moment',
    plaqueTitle: 'THE MOMENT',
    subtitle: 'Some moments deserve all of our attention.',
    motif: 'teatro',
    accent: '#e49a9e',
    revealTitle: 'A Moment That Stays',
    meaning: 'We cannot stop time, but we can choose to be present when a moment matters.',
    mechanicHint: 'Capture five moving moments. The target window narrows and the marker accelerates after every successful hit.',
    game: 'timing',
    progressLabel: 'Capture five moments',
  },
  {
    id: 7,
    title: 'The Observatory of Moments',
    plaqueTitle: 'OBSERVATORY',
    subtitle: 'Separate points can still tell a story.',
    motif: 'observatorio',
    accent: '#a7c8ed',
    revealTitle: 'A Shape Among the Points',
    meaning: 'Memories can seem small and unrelated as they happen. Over time, we discover the shape they have drawn together.',
    mechanicHint: 'Memorise and rebuild three constellations. Each new path is longer, and a wrong star breaks the current attempt.',
    game: 'constellation',
    progressLabel: 'Rebuild the constellation',
  },
  {
    id: 8,
    title: 'The Memory That Opens',
    plaqueTitle: 'THE OPEN BOOK',
    subtitle: 'The future is built from small decisions, too.',
    motif: 'libro',
    accent: '#c7a7df',
    revealTitle: 'The Book Is Still Open',
    meaning: 'There is no final page. There are ways to care for each other, choose each other, and keep creating memories you both decide to keep alive.',
    mechanicHint: 'Write the next page by choosing one concrete promise for each of the three chapters.',
    game: 'promises',
    progressLabel: 'Write the next page',
  },
];

export const initialMuseumState = {
  phase: 'intro',
  activeRoomId: null,
  completedRoomIds: [],
  roomResults: {},
  galleryVisited: false,
  galleryLightsOn: false,
  notice: null,
};

function getNextRoomId(completedRoomIds) {
  return ROOMS.find((room) => !completedRoomIds.includes(room.id))?.id ?? null;
}

export function museumReducer(state, action) {
  switch (action.type) {
    case 'BEGIN_ENTRY':
      return state.phase === 'intro'
        ? { ...state, phase: 'enteringHub', notice: null }
        : state;

    case 'COMPLETE_HUB_ENTRY':
      return state.phase === 'enteringHub'
        ? { ...state, phase: 'hub', notice: null }
        : state;

    case 'OPEN_ROOM': {
      if (state.phase !== 'hub') return state;
      const room = ROOMS.find((item) => item.id === action.roomId);

      if (!room) {
        return { ...state, notice: 'This room does not exist in the catalogue.' };
      }

      const nextRoomId = getNextRoomId(state.completedRoomIds);

      if (nextRoomId !== null && room.id > nextRoomId) {
        return {
          ...state,
          notice: `The journey follows a set order. Discover room ${String(nextRoomId).padStart(2, '0')}.`,
        };
      }

      return {
        ...state,
        phase: 'enteringRoom',
        activeRoomId: room.id,
        notice: null,
      };
    }

    case 'ROOM_TRANSITION_COVERED':
      return state.phase === 'enteringRoom'
        ? { ...state, phase: 'room', notice: null }
        : state;

    case 'ENTER_GALLERY': {
      const allRoomsCompleted = ROOMS.every((room) => state.completedRoomIds.includes(room.id));
      return state.phase === 'hub' && allRoomsCompleted
        ? { ...state, phase: 'enteringGallery', notice: null }
        : state;
    }

    case 'ACTIVATE_GALLERY_LIGHTS': {
      const allRoomsCompleted = ROOMS.every((room) => state.completedRoomIds.includes(room.id));
      return state.phase === 'gallery' && allRoomsCompleted
        ? { ...state, galleryLightsOn: true, notice: null }
        : state;
    }

    case 'GALLERY_TRANSITION_COVERED':
      return state.phase === 'enteringGallery'
        ? { ...state, phase: 'gallery', galleryVisited: true, notice: null }
        : state;

    case 'RETURN_FROM_GALLERY':
      return state.phase === 'gallery'
        ? { ...state, phase: 'returningGallery', notice: null }
        : state;

    case 'RETURN_GALLERY_TRANSITION_COVERED':
      return state.phase === 'returningGallery'
        ? { ...state, phase: 'hub', activeRoomId: null, notice: null }
        : state;

    case 'START_MINIGAME':
      if (state.phase !== 'room' || action.roomId !== state.activeRoomId) return state;
      return { ...state, phase: 'minigame', notice: null };

    case 'CLOSE_MINIGAME':
      return state.phase === 'minigame'
        ? { ...state, phase: 'room', notice: null }
        : state;

    case 'ROOM_GAME_WON': {
      if (state.phase !== 'minigame' || action.roomId !== state.activeRoomId) return state;
      const room = ROOMS.find((item) => item.id === action.roomId);
      if (!room) return state;

      return {
        ...state,
        phase: 'reveal',
        completedRoomIds: [...new Set([...state.completedRoomIds, room.id])],
        roomResults: { ...state.roomResults, [room.id]: action.result ?? {} },
        notice: null,
      };
    }

    case 'RETURN_TO_HUB':
      return ['room', 'minigame', 'reveal'].includes(state.phase)
        ? { ...state, phase: 'returningHub', notice: null }
        : state;

    case 'FINISH_REVEAL':
      return state.phase === 'reveal'
        ? { ...state, phase: 'returningHub', notice: null }
        : state;

    case 'HUB_TRANSITION_COVERED':
      return state.phase === 'returningHub'
        ? { ...state, phase: 'hub', activeRoomId: null, notice: null }
        : state;

    case 'SET_NOTICE':
      return typeof action.message === 'string' && action.message.trim()
        ? { ...state, notice: action.message }
        : state;

    case 'DISMISS_NOTICE':
      return state.notice
        ? { ...state, notice: null }
        : state;

    default:
      return state;
  }
}