import { useCallback, useEffect, useRef, useState } from 'react';

const PROMISE_CHAPTERS = [
  {
    title: 'When the Day Gets Difficult',
    prompt: 'What do you want me to find in you when everything feels a little heavier?',
    choices: [
      { title: 'A safe place', copy: 'Listening without trying to fix everything.' },
      { title: 'A helping hand', copy: 'Remembering that you do not have to handle everything alone.' },
      { title: 'A little light', copy: 'Finding something together that makes us smile again.' },
    ],
  },
  {
    title: 'On Ordinary Days',
    prompt: 'What small thing do you want to keep caring for when life gets busy?',
    choices: [
      { title: 'Curiosity', copy: 'Keep asking questions and discovering who the other person is becoming.' },
      { title: 'Our own language', copy: 'Make room for the jokes only the two of you understand.' },
      { title: 'Being present', copy: 'Make time to be together, even without a special plan.' },
    ],
  },
  {
    title: 'For Everything Still Ahead',
    prompt: 'What do you want to keep building together?',
    choices: [
      { title: 'More first times', copy: 'Keep trying things and surprising each other.' },
      { title: 'A home we share', copy: 'Turn small rituals into a place you can return to.' },
      { title: 'Choosing each other again', copy: 'Remember that love lives in everyday choices, too.' },
    ],
  },
];

const LETTER_TILES = [
  'By your side',
  'the little things',
  'take on a',
  'meaning',
  'they never',
  'had',
  'before',
  'you',
];

const MEMORY_PAIR_POOL = [
  { pair: 'thread', symbol: '⌁', label: 'A thread' },
  { pair: 'flower', symbol: '✿', label: 'A flower' },
  { pair: 'moon', symbol: '☾', label: 'A moon' },
  { pair: 'key', symbol: '⚿', label: 'A key' },
  { pair: 'star', symbol: '✦', label: 'A star' },
  { pair: 'shell', symbol: '◖', label: 'A shell' },
  { pair: 'ribbon', symbol: '∞', label: 'A ribbon' },
  { pair: 'candle', symbol: '♧', label: 'A candle' },
];

const MEMORY_ROUND_PAIRS = [4, 6, 8];

const RHYTHM_ROUNDS = [
  [0, 2, 1, 3, 2],
  [3, 1, 0, 2, 3, 0, 1],
  [2, 0, 3, 1, 2, 3, 0, 1, 2],
];

const RHYTHM_PADS = [
  { name: 'Presence', note: 261.63, color: '#c9a36c' },
  { name: 'Laughter', note: 329.63, color: '#a7bd8a' },
  { name: 'Calm', note: 392.0, color: '#9db4dd' },
  { name: 'Home', note: 523.25, color: '#c49cc9' },
];

const CONSTELLATION_POINTS = [
  [50, 15],
  [79, 28],
  [91, 59],
  [70, 84],
  [30, 84],
  [9, 59],
  [21, 28],
];

const CONSTELLATION_ROUNDS = [
  [0, 2, 4, 1, 3],
  [6, 0, 3, 5, 2, 4],
  [1, 4, 0, 5, 2, 6, 3],
];

const helperPanelStyle = {
  margin: '12px 0',
  padding: '12px 14px',
  border: '1px solid rgba(207, 175, 125, 0.42)',
  borderRadius: '8px',
  background: 'rgba(153, 116, 66, 0.10)',
  color: '#e4d8c5',
  fontSize: '13px',
  lineHeight: 1.55,
};

export default function RoomMiniGame({ room, onWin, onClose }) {
  const [submitting, setSubmitting] = useState(false);

  const finish = useCallback((result) => {
    if (submitting) return;
    setSubmitting(true);
    onWin(result);
  }, [onWin, submitting]);

  return (
    <div className="minigame-backdrop">
      <section
        className={`minigame-card minigame-${room.game}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="minigame-title"
      >
        <header className="minigame-header">
          <div>
            <p className="eyebrow">
              ROOM {String(room.id).padStart(2, '0')} · INTERACTIVE EXPERIENCE
            </p>
            <h2 id="minigame-title">{room.progressLabel}</h2>
            <p className="minigame-subtitle">{room.mechanicHint}</p>
          </div>
          <button
            className="minigame-close"
            type="button"
            onClick={onClose}
            aria-label="Return to the room"
          >
            ×
          </button>
        </header>

        <div className="minigame-play-area">
          {room.game === 'sliding' && <LetterPuzzle onWin={finish} />}
          {room.game === 'memory' && <MemoryPairs onWin={finish} />}
          {room.game === 'rhythm' && <RhythmReplay onWin={finish} />}
          {room.game === 'garden' && <CareGarden onWin={finish} />}
          {room.game === 'alignment' && <PerspectiveAlignment onWin={finish} />}
          {room.game === 'timing' && <MomentTiming onWin={finish} />}
          {room.game === 'constellation' && <ConstellationRecall onWin={finish} />}
          {room.game === 'promises' && <FutureLetter onWin={finish} />}
        </div>

        <footer className="minigame-footer">
          <span><span className="status-dot" /> There is no rush. Find your own way.</span>
          <button className="text-button" type="button" onClick={onClose}>
            Return to the room
          </button>
        </footer>
      </section>
    </div>
  );
}

function LetterPuzzle({ onWin }) {
  const [board, setBoard] = useState(createScrambledBoard);
  const [moves, setMoves] = useState(0);
  const done = board.every((value, index) => value === (index === 8 ? 0 : index + 1));

  const moveTile = (index) => {
    if (done) return;

    const blank = board.indexOf(0);
    const adjacent = (
      Math.abs(Math.floor(index / 3) - Math.floor(blank / 3)) +
      Math.abs((index % 3) - (blank % 3))
    ) === 1;

    if (!adjacent) return;

    const next = [...board];
    [next[index], next[blank]] = [next[blank], next[index]];
    setBoard(next);
    setMoves((count) => count + 1);

    if (next.every((value, position) => value === (position === 8 ? 0 : position + 1))) {
      onWin({ summary: `Letter rebuilt in ${moves + 1} moves.` });
    }
  };

  return (
    <div className="letter-game-layout">
      <div className="letter-puzzle-board" aria-label="Eight-piece sliding puzzle">
        {board.map((tile, index) => (
          <button
            key={tile || 'blank'}
            type="button"
            className={`letter-tile${tile === 0 ? ' is-empty' : ''}`}
            disabled={tile === 0 || done}
            onClick={() => moveTile(index)}
            aria-label={tile ? `Move fragment ${LETTER_TILES[tile - 1]}` : 'Empty space'}
          >
            {tile ? (
              <>
                <span className="tile-number">{String(tile).padStart(2, '0')}</span>
                <span>{LETTER_TILES[tile - 1]}</span>
              </>
            ) : (
              <span className="tile-empty-mark">·</span>
            )}
          </button>
        ))}
      </div>

      <div className="minigame-sidecopy">
        <span className="minigame-overline">FRAGMENTED LETTER</span>
        <h3>Words find their place.</h3>
        <p>
          Move a tile next to the empty space. The letter is rebuilt when every
          fragment returns to its place.
        </p>
        <div className="game-stat"><span>MOVES</span><strong>{moves}</strong></div>
        <p className="game-hint">Hint: you can only move tiles next to the empty space.</p>
      </div>
    </div>
  );
}

function createScrambledBoard() {
  const board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  let blank = 8;
  let previousBlank = -1;

  for (let turn = 0; turn < 34; turn += 1) {
    const row = Math.floor(blank / 3);
    const column = blank % 3;
    const neighbors = [
      row > 0 ? blank - 3 : -1,
      row < 2 ? blank + 3 : -1,
      column > 0 ? blank - 1 : -1,
      column < 2 ? blank + 1 : -1,
    ].filter((index) => index >= 0 && index !== previousBlank);

    const selected = neighbors[(turn * 7 + 3) % neighbors.length];
    [board[blank], board[selected]] = [board[selected], board[blank]];
    previousBlank = blank;
    blank = selected;
  }

  if (board.every((value, index) => value === (index === 8 ? 0 : index + 1))) {
    [board[7], board[8]] = [board[8], board[7]];
  }

  return board;
}

function MemoryPairs({ onWin }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [cards, setCards] = useState(() => createMemoryDeck(MEMORY_ROUND_PAIRS[0]));
  const [revealed, setRevealed] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [roundMoves, setRoundMoves] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [helperReveals, setHelperReveals] = useState(0);
  const [isShowingHelp, setIsShowingHelp] = useState(false);
  const [message, setMessage] = useState(
    'Study the symbols, then find every pair. The next round has more cards.',
  );
  const lockRef = useRef(false);
  const timerRef = useRef(null);
  const roundPairs = MEMORY_ROUND_PAIRS[roundIndex];
  const canOfferHelper = wrongAttempts >= 3 && matched.length < cards.length;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const revealHelpfulPair = () => {
    // The assist unlocks after three failed mismatches and can be reused without a limit.
    if (!canOfferHelper || lockRef.current || matched.length === cards.length) return;

    const unmatched = cards.filter((card) => !matched.includes(card.id));
    const unmatchedPairIds = [...new Set(unmatched.map((card) => card.pair))];
    if (unmatchedPairIds.length === 0) return;

    // Rotate through the still-unmatched pairs so repeated help does not keep revealing the same one.
    const pairId = unmatchedPairIds[helperReveals % unmatchedPairIds.length];
    const pairCards = unmatched.filter((card) => card.pair === pairId);
    const [first, second] = pairCards;
    if (!first || !second) return;

    lockRef.current = true;
    setIsShowingHelp(true);
    setHelperReveals((count) => count + 1);
    setRevealed([first.id, second.id]);
    setMessage('Study these two positions. The pair will turn away in a moment.');
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setRevealed([]);
      setIsShowingHelp(false);
      lockRef.current = false;
      setMessage('Now find the same two positions again. You can reveal another pair whenever you need help.');
    }, 1800);
  };

  const chooseCard = (id) => {
    if (lockRef.current || revealed.includes(id) || matched.includes(id)) return;

    const nextRevealed = [...revealed, id];
    setRevealed(nextRevealed);
    if (nextRevealed.length < 2) return;

    const nextMoves = moves + 1;
    const nextRoundMoves = roundMoves + 1;
    setMoves(nextMoves);
    setRoundMoves(nextRoundMoves);
    const first = cards.find((card) => card.id === nextRevealed[0]);
    const second = cards.find((card) => card.id === nextRevealed[1]);

    if (first.pair === second.pair) {
      const nextMatched = [...matched, ...nextRevealed];
      setMatched(nextMatched);
      setRevealed([]);
      setMessage('A pair remembered. Keep going at your own pace.');

      if (nextMatched.length === cards.length) {
        if (roundIndex === MEMORY_ROUND_PAIRS.length - 1) {
          onWin({
            summary: `All three memory rounds completed in ${nextMoves} attempts, with ${helperReveals} assisted reveals.`,
          });
          return;
        }

        const nextRound = roundIndex + 1;
        window.clearTimeout(timerRef.current);
        lockRef.current = false;
        setIsShowingHelp(false);
        setRoundIndex(nextRound);
        setCards(createMemoryDeck(MEMORY_ROUND_PAIRS[nextRound]));
        setMatched([]);
        setRevealed([]);
        setRoundMoves(0);
        setWrongAttempts(0);
        setHelperReveals(0);
        setMessage(`Round ${roundIndex + 1} complete. Take a moment to study before you begin.`);
      }
    } else {
      const nextWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(nextWrongAttempts);
      lockRef.current = true;
      setMessage(
        nextWrongAttempts >= 3
          ? 'You can reveal one unmatched pair for a moment.'
          : 'Not a pair. Try to remember both the symbol and its position before the cards turn away.',
      );
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setRevealed([]);
        lockRef.current = false;
      }, 850);
    }
  };

  return (
    <div className="memory-game">
      <div
        className="memory-board"
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
        {cards.map((card) => {
          const visible = revealed.includes(card.id) || matched.includes(card.id);

          return (
            <button
              key={card.id}
              type="button"
              className={`memory-card${visible ? ' is-revealed' : ''}${matched.includes(card.id) ? ' is-matched' : ''}`}
              onClick={() => chooseCard(card.id)}
              disabled={visible || lockRef.current}
              aria-label={visible ? card.label : 'Face-down card'}
            >
              <span className="memory-card-back">M.</span>
              <span className="memory-card-face"><strong>{card.symbol}</strong></span>
            </button>
          );
        })}
      </div>
      <div className="memory-feedback">
        <span className="minigame-overline">
          ROUND {roundIndex + 1} / {MEMORY_ROUND_PAIRS.length} · {matched.length / 2} OF {roundPairs} PAIRS
        </span>
        <p aria-live="polite">{message}</p>
        <span className="game-stat"><span>ROUND ATTEMPTS</span><strong>{roundMoves}</strong></span>
        <span className="game-stat"><span>TOTAL ATTEMPTS</span><strong>{moves}</strong></span>

        {canOfferHelper && (
          <div className="memory-reveal-help">
            <div>
              <strong>{isShowingHelp ? 'Take a moment to remember' : 'A little help, whenever you need it'}</strong>
              <span>
                {isShowingHelp
                  ? 'The pair is visible now. Look at both symbols and their positions.'
                  : 'Briefly reveal one unmatched pair.'}
              </span>
            </div>
            <button
              className="memory-reveal-help-button"
              type="button"
              onClick={revealHelpfulPair}
              disabled={isShowingHelp || lockRef.current || matched.length === cards.length}
            >
              {isShowingHelp ? 'Pair shown…' : 'Briefly reveal one pair'}
            </button>
            <small>AVAILABLE AFTER 3 MISSES · USED {helperReveals} {helperReveals === 1 ? 'TIME' : 'TIMES'} THIS ROUND</small>
          </div>
        )}
        <p className="mini-muted">
          The first round has 8 cards, the second 12, and the final round 16.
        </p>
      </div>
    </div>
  );
}

function createMemoryDeck(pairCount) {
  const selected = MEMORY_PAIR_POOL.slice(0, pairCount).flatMap((pair, index) => [
    { ...pair, id: index * 2 },
    { ...pair, id: index * 2 + 1 },
  ]);

  for (let index = selected.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [selected[index], selected[swapIndex]] = [selected[swapIndex], selected[index]];
  }

  return selected;
}

function RhythmReplay({ onWin }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [inputIndex, setInputIndex] = useState(0);
  const [activePad, setActivePad] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState(
    'Listen closely. Each round adds more notes to the shared rhythm.',
  );
  const [wrongCount, setWrongCount] = useState(0);
  const timeoutsRef = useRef([]);
  const audioRef = useRef(null);
  const sequence = RHYTHM_ROUNDS[roundIndex];

  useEffect(() => () => {
    timeoutsRef.current.forEach(window.clearTimeout);
    if (audioRef.current && audioRef.current.state !== 'closed') void audioRef.current.close();
  }, []);

  const playTone = useCallback((index) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!audioRef.current) audioRef.current = new AudioContextClass();
      const context = audioRef.current;
      if (context.state === 'suspended') void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(RHYTHM_PADS[index].note, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.06, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.31);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.33);
    } catch {
      // The illuminated pads still communicate the pattern if audio is unavailable.
    }
  }, []);

  const listen = (slow = false) => {
    if (playing) return;
    timeoutsRef.current.forEach(window.clearTimeout);
    timeoutsRef.current = [];
    setPlaying(true);
    setInputIndex(0);
    setActivePad(-1);
    const interval = slow ? 880 : 570;
    setMessage(
      slow
        ? `Slow replay: listen to all ${sequence.length} notes, with more time between each one.`
        : `Listen to round ${roundIndex + 1}. Remember all ${sequence.length} notes in order.`,
    );

    sequence.forEach((pad, index) => {
      timeoutsRef.current.push(window.setTimeout(() => {
        setActivePad(pad);
        playTone(pad);
      }, 420 + index * interval));

      timeoutsRef.current.push(window.setTimeout(() => setActivePad(-1), 730 + index * interval));
    });

    timeoutsRef.current.push(window.setTimeout(() => {
      setPlaying(false);
      setMessage(`Your turn: repeat all ${sequence.length} notes without changing the order.`);
    }, 420 + sequence.length * interval));
  };

  const tapPad = (index) => {
    if (playing) return;
    playTone(index);
    setActivePad(index);
    window.setTimeout(() => setActivePad(-1), 170);

    if (sequence[inputIndex] !== index) {
      const nextWrongCount = wrongCount + 1;
      setWrongCount(nextWrongCount);
      setInputIndex(0);
      setMessage(
        nextWrongCount >= 2
          ? 'The sequence broke. Use the slower replay to hear the spacing between notes more clearly.'
          : 'The sequence broke. Listen again, then repeat it from the beginning.',
      );
      return;
    }

    const next = inputIndex + 1;
    setInputIndex(next);

    if (next === sequence.length) {
      if (roundIndex === RHYTHM_ROUNDS.length - 1) {
        onWin({ summary: 'All three melodies were remembered and repeated.' });
      } else {
        setRoundIndex((value) => value + 1);
        setInputIndex(0);
        setWrongCount(0);
        setMessage(`Round ${roundIndex + 1} complete. The next rhythm is longer.`);
      }
    } else {
      setMessage(`Correct notes: ${next} of ${sequence.length}. Keep listening inwardly.`);
    }
  };

  return (
    <div className="rhythm-game">
      <div className="rhythm-progress" aria-label={`Sequence: ${inputIndex} of ${sequence.length}`}>
        {sequence.map((_, index) => (
          <span
            key={index}
            className={index < inputIndex ? 'is-done' : index === inputIndex ? 'is-current' : ''}
          />
        ))}
      </div>

      <p className="minigame-overline">
        ROUND {roundIndex + 1} / {RHYTHM_ROUNDS.length} · {sequence.length} NOTES
      </p>

      <div className="rhythm-pads">
        {RHYTHM_PADS.map((pad, index) => (
          <button
            key={pad.name}
            type="button"
            className={`rhythm-pad${activePad === index ? ' is-active' : ''}`}
            style={{ '--pad-color': pad.color }}
            disabled={playing}
            onClick={() => tapPad(index)}
          >
            <span className="rhythm-pad-symbol">{['◒', '✳', '∿', '⌂'][index]}</span>
            <strong>{pad.name}</strong>
            <small>NOTE {index + 1}</small>
          </button>
        ))}
      </div>

      <div className="rhythm-bottom">
        <p aria-live="polite">{message}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="primary-button" type="button" disabled={playing} onClick={() => listen(false)}>
            <span>Listen again</span><span aria-hidden="true">♫</span>
          </button>
          {wrongCount >= 2 && (
            <button className="text-button" type="button" disabled={playing} onClick={() => listen(true)}>
              Hear it more slowly
            </button>
          )}
        </div>
      </div>

      {wrongCount >= 2 && (
        <div role="status" style={helperPanelStyle}>
          <strong>A little help with the rhythm</strong>
          <p style={{ margin: '6px 0 0' }}>
            Follow the glowing pads one by one. The slower replay leaves more time to identify each note.
          </p>
        </div>
      )}
      {wrongCount > 0 && (
        <p className="mini-muted">
          Mistakes: {wrongCount}. Each round can be replayed as often as needed.
        </p>
      )}
    </div>
  );
}

function CareGarden({ onWin }) {
  const rounds = [
    {
      needs: [1, 3, 4],
      clue: 'The flower needs two fewer drops than the fern. The fern needs one fewer than the sprout. Use exactly eight drops.',
      hints: [
        'The flower is the smallest amount, then the fern, then the sprout.',
        'The flower gets one drop. The fern and sprout share the remaining seven, with the sprout getting one more than the fern.',
      ],
    },
    {
      needs: [3, 2, 3],
      clue: 'The flower and sprout need the same amount. The fern needs one less. Use exactly eight drops.',
      hints: [
        'Make the flower and sprout equal first. The fern should have one drop less than them.',
        'The fern gets two drops. Divide the other six equally between the flower and the sprout.',
      ],
    },
    {
      needs: [4, 1, 3],
      clue: 'The flower needs one more drop than the sprout. The sprout needs two more than the fern. Use exactly eight drops.',
      hints: [
        'Start with the fern as the smallest amount. Add two for the sprout, then one more for the flower.',
        'The fern gets one drop, the sprout gets three, and the flower receives the four remaining drops.',
      ],
    },
  ];
  const plants = [
    { name: 'The flower', copy: 'Delicate petals; too much can be as harmful as too little.', icon: '✿' },
    { name: 'The fern', copy: 'Steady care keeps its fronds from drooping.', icon: '❧' },
    { name: 'The sprout', copy: 'Still growing; its needs change with each stage.', icon: '♧' },
  ];

  const [roundIndex, setRoundIndex] = useState(0);
  const [water, setWater] = useState([0, 0, 0]);
  const [message, setMessage] = useState('Read the clues, distribute the water, then test your plan.');
  const [checked, setChecked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const round = rounds[roundIndex];
  const total = water.reduce((sum, amount) => sum + amount, 0);
  const hintLevel = mistakes >= 4 ? 2 : mistakes >= 2 ? 1 : 0;

  const adjust = (index, amount) => {
    const next = [...water];
    next[index] = Math.max(0, Math.min(4, next[index] + amount));
    if (next.reduce((sum, value) => sum + value, 0) > 8) return;
    setWater(next);
    setChecked(false);
    setMessage('Allocation changed. Test it when all eight drops have been assigned.');
  };

  const checkAllocation = () => {
    if (total !== 8) {
      setChecked(true);
      setMistakes((count) => count + 1);
      setMessage(`The reservoir still holds ${8 - total} drop${8 - total === 1 ? '' : 's'}. Every drop must be assigned before checking the plant balance.`);
      return;
    }

    const exact = water.every((amount, index) => amount === round.needs[index]);
    setChecked(true);

    if (!exact) {
      setMistakes((count) => count + 1);
      setMessage('Not balanced yet. Revisit the relationships in the clue and adjust one plant at a time.');
      return;
    }

    if (roundIndex === rounds.length - 1) {
      onWin({ summary: 'Three garden rounds solved by careful observation and resource sharing.' });
      return;
    }

    setMessage(`Round ${roundIndex + 1} balanced. The next garden has a new set of needs.`);
    setRoundIndex((value) => value + 1);
    setWater([0, 0, 0]);
    setChecked(false);
    setMistakes(0);
  };

  return (
    <div className="garden-game">
      <div className="garden-reservoir">
        <span>ROUND {roundIndex + 1} / {rounds.length} · WATER AVAILABLE</span>
        <strong>{8 - total}<small> / 8 drops left</small></strong>
        <div className="drop-meter">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} className={index < 8 - total ? 'is-full' : ''}>◆</i>
          ))}
        </div>
      </div>

      <p className="game-instruction">{round.clue}</p>

      <div className="garden-pots">
        {plants.map((plant, index) => {
          const amount = water[index];
          const need = round.needs[index];
          const status = !checked
            ? 'not checked'
            : total !== 8
              ? 'finish allocation'
              : amount === need
                ? 'balanced'
                : 'review amount';

          return (
            <article className={`garden-pot garden-pot-${index}`} key={plant.name}>
              <span className="plant-icon">{plant.icon}</span>
              <h3>{plant.name}</h3>
              <p>{plant.copy}</p>
              <div className={`plant-condition${checked && total === 8 && amount === need ? ' is-balanced' : ''}`}>
                {status}
              </div>
              <div className="pot-count">
                <button
                  type="button"
                  aria-label={`Remove water from ${plant.name}`}
                  disabled={amount === 0}
                  onClick={() => adjust(index, -1)}
                >
                  −
                </button>
                <strong>{amount}</strong>
                <button
                  type="button"
                  aria-label={`Add water to ${plant.name}`}
                  disabled={total === 8 || amount === 4}
                  onClick={() => adjust(index, 1)}
                >
                  +
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="alignment-feedback" aria-live="polite">{message}</p>
      {hintLevel >= 1 && (
        <div role="status" style={helperPanelStyle}>
          <strong>Care clue · a little more guidance</strong>
          <p style={{ margin: '6px 0 0' }}>{round.hints[0]}</p>
          {hintLevel >= 2 && <p style={{ margin: '6px 0 0' }}>{round.hints[1]}</p>}
        </div>
      )}

      <div className="garden-bottom">
        <span>{total} of 8 drops assigned</span>
        <button className="primary-button" type="button" onClick={checkAllocation}>
          Test the balance
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setWater([0, 0, 0]);
            setChecked(false);
            setMessage('Allocation reset. Re-read the clues and try again.');
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}

function PerspectiveAlignment({ onWin }) {
  const rounds = [
    { target: [62, 36], initial: [18, 84], name: 'The first view' },
    { target: [28, 67], initial: [78, 15], name: 'The reversed view' },
    { target: [81, 19], initial: [34, 61], name: 'The shared view' },
  ];

  const [roundIndex, setRoundIndex] = useState(0);
  const [left, setLeft] = useState(rounds[0].initial[0]);
  const [right, setRight] = useState(rounds[0].initial[1]);
  const [message, setMessage] = useState('Adjust both views, then check whether the two pieces truly meet.');
  const [failedChecks, setFailedChecks] = useState(0);
  const round = rounds[roundIndex];
  const error = Math.abs(left - round.target[0]) + Math.abs(right - round.target[1]);
  const aligned = error <= 2;
  const hintLevel = failedChecks >= 6 ? 3 : failedChecks >= 4 ? 2 : failedChecks >= 2 ? 1 : 0;

  const update = (side, value) => {
    if (side === 'left') setLeft(value);
    else setRight(value);

    const nextLeft = side === 'left' ? value : left;
    const nextRight = side === 'right' ? value : right;
    const nextError = Math.abs(nextLeft - round.target[0]) + Math.abs(nextRight - round.target[1]);

    setMessage(
      nextError < 12
        ? 'Very close. Fine-tune both perspectives before checking.'
        : nextError < 35
          ? 'The pieces are approaching each other, but the seam is still visible.'
          : 'The two views are still far apart. Adjust both controls.',
    );
  };

  const checkAlignment = () => {
    if (!aligned) {
      setFailedChecks((count) => count + 1);
      setMessage('The seam is still visible. Adjust the sliders, then check again.');
      return;
    }

    if (roundIndex === rounds.length - 1) {
      onWin({ summary: 'Three different perspectives were brought into alignment.' });
      return;
    }

    const nextRound = roundIndex + 1;
    setRoundIndex(nextRound);
    setLeft(rounds[nextRound].initial[0]);
    setRight(rounds[nextRound].initial[1]);
    setFailedChecks(0);
    setMessage(`${round.name} aligned. A new perspective is waiting.`);
  };

  const direction = (value, target) => value < target ? 'increase' : 'decrease';

  return (
    <div className="alignment-game">
      <p className="minigame-overline">
        ALIGNMENT {roundIndex + 1} / {rounds.length} · {round.name.toUpperCase()}
      </p>

      <div className="alignment-preview" aria-label="Preview of the shape to align">
        <svg viewBox="0 0 480 170" role="img" aria-label="Two lines that must connect">
          <path d="M34 85 H446" className="alignment-guide" />
          <path d={`M34 132 L${70 + left * 3.3} 45`} className="alignment-left" />
          <path d={`M${405 - right * 3.611111} 45 L446 132`} className="alignment-right" />
          <circle cx={70 + left * 3.3} cy="45" r="6" className="alignment-node" />
          <circle cx={405 - right * 3.611111} cy="45" r="6" className="alignment-node" />
          <path d="M220 85 H260" className={aligned ? 'alignment-bridge is-connected' : 'alignment-bridge'} />
        </svg>
        <div className="alignment-score">
          <span>SEAM PRECISION</span>
          <strong>{Math.max(0, 100 - Math.round(error * 1.3))}%</strong>
        </div>
      </div>

      <div className="alignment-controls">
        <label>
          <span><strong>Perspective A</strong><small>Move the first frame</small></span>
          <input
            type="range"
            min="0"
            max="100"
            value={left}
            onChange={(event) => update('left', Number(event.target.value))}
          />
          <output>{left}</output>
        </label>
        <label>
          <span><strong>Perspective B</strong><small>Move the second frame</small></span>
          <input
            type="range"
            min="0"
            max="100"
            value={right}
            onChange={(event) => update('right', Number(event.target.value))}
          />
          <output>{right}</output>
        </label>
      </div>

      <p className="alignment-feedback" aria-live="polite">{message}</p>
      {hintLevel >= 1 && (
        <div role="status" style={helperPanelStyle}>
          <strong>Alignment clue</strong>
          <p style={{ margin: '6px 0 0' }}>
            Try to {direction(left, round.target[0])} slider A and {direction(right, round.target[1])} slider B. The line ends need to meet at the centre.
          </p>
        </div>
      )}
      {hintLevel >= 2 && (
        <div role="status" style={helperPanelStyle}>
          <strong>Getting closer</strong>
          <p style={{ margin: '6px 0 0' }}>
            Perspective A is near {round.target[0] - 8}–{round.target[0] + 8}; Perspective B is near {round.target[1] - 8}–{round.target[1] + 8}. Fine adjustments still matter.
          </p>
        </div>
      )}
      {hintLevel >= 3 && (
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setLeft(round.target[0]);
            setRight(round.target[1]);
            setMessage('The museum has aligned the frames for you. Check the alignment to continue.');
          }}
        >
          Align these frames for me
        </button>
      )}
      <button className="primary-button" type="button" onClick={checkAlignment}>
        Check the alignment
      </button>
    </div>
  );
}

function MomentTiming({ onWin }) {
  const [position, setPosition] = useState(8);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [message, setMessage] = useState('Capture the moving light inside the narrow golden window. Each moment becomes harder.');
  const directionRef = useRef(1);
  const positionRef = useRef(8);
  const hitsRef = useRef(0);
  const speedRef = useRef(1.45);
  const baseTolerance = [7, 5, 4, 3, 2][hits] ?? 2;
  const tolerance = Math.min(12, baseTolerance + (misses >= 6 ? 5 : misses >= 3 ? 3 : 0));

  useEffect(() => {
    const timer = window.setInterval(() => {
      let next = positionRef.current + directionRef.current * speedRef.current;
      if (next >= 96) { next = 96; directionRef.current = -1; }
      if (next <= 4) { next = 4; directionRef.current = 1; }
      positionRef.current = next;
      setPosition(next);
    }, 30);

    return () => window.clearInterval(timer);
  }, []);

  const capture = useCallback(() => {
    if (hitsRef.current >= 5) return;

    const currentBaseTolerance = [7, 5, 4, 3, 2][hitsRef.current] ?? 2;
    const currentTolerance = Math.min(
      12,
      currentBaseTolerance + (misses >= 6 ? 5 : misses >= 3 ? 3 : 0),
    );

    if (Math.abs(positionRef.current - 50) > currentTolerance) {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      speedRef.current = Math.max(0.72, speedRef.current * 0.84);
      setMessage(
        nextMisses >= 3
          ? 'Take your time. The golden window is becoming wider and the light is slowing slightly to help you.'
          : positionRef.current < 50 - currentTolerance
            ? 'Too early. Watch the light travel toward the centre.'
            : 'Too late. Let the light return and focus on the golden window.',
      );
      return;
    }

    const next = hitsRef.current + 1;
    hitsRef.current = next;
    setHits(next);
    setMisses(0);

    if (next >= 5) {
      setMessage('Five moments captured with care and precision.');
      onWin({ summary: 'Five increasingly precise moments were captured.' });
      return;
    }

    positionRef.current = 5;
    directionRef.current = 1;
    speedRef.current = 1.45 + next * 0.38;
    setPosition(5);
    setMessage(`Moment ${next} captured. Round ${next + 1} is faster and has a narrower window.`);
  }, [onWin, misses]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      capture();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [capture]);

  return (
    <div className="timing-game">
      <p className="minigame-overline">
        MOMENT {hits + 1 > 5 ? 5 : hits + 1} / 5 · WINDOW ±{tolerance}%
      </p>
      <div className="moment-meter" aria-label="Timing marker">
        <div className="moment-safe-zone" style={{ left: `${50 - tolerance}%`, width: `${tolerance * 2}%` }} />
        <div className="moment-marker" style={{ left: `${position}%` }} />
        <div className="moment-center-line" />
      </div>
      <div className="moment-target-labels"><span>TOO EARLY</span><span>THE MOMENT</span><span>TOO LATE</span></div>
      <div className="moment-captures">
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index} className={index < hits ? 'is-captured' : ''}>✦</span>
        ))}
      </div>
      <p aria-live="polite">{message}</p>
      {misses >= 3 && (
        <div role="status" style={helperPanelStyle}>
          <strong>Adaptive assistance is on</strong>
          <p style={{ margin: '6px 0 0' }}>
            After several misses, the target zone expands and the moving light slows. Keep aiming for the centre.
          </p>
        </div>
      )}
      <button className="primary-button timing-capture" type="button" onClick={capture}>
        <span>Capture moment</span><span aria-hidden="true">✦</span>
      </button>
      <p className="mini-muted">You can also press the spacebar. Misses do not remove captured moments.</p>
    </div>
  );
}

function ConstellationRecall({ onWin }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState(true);
  const [previewStep, setPreviewStep] = useState(0);
  const [guidedPreview, setGuidedPreview] = useState(false);
  const [message, setMessage] = useState('Memorise the path of light; soon only the stars will remain.');
  const [mistakes, setMistakes] = useState(0);
  const hintTimersRef = useRef([]);
  const sequence = CONSTELLATION_ROUNDS[roundIndex];

  const playHint = useCallback((targetRound = roundIndex, guided = false) => {
    hintTimersRef.current.forEach(window.clearTimeout);
    hintTimersRef.current = [];
    const path = CONSTELLATION_ROUNDS[targetRound];
    const delay = guided ? 720 : 430;
    setHint(true);
    setGuidedPreview(guided);
    setProgress(0);
    setPreviewStep(0);
    setMessage(guided
      ? 'Guided replay: follow the numbered stars in order. There is more time between them.'
      : `Memorise round ${targetRound + 1}: ${path.length} stars in order.`);

    path.forEach((_, index) => {
      hintTimersRef.current.push(window.setTimeout(() => setPreviewStep(index), index * delay));
    });

    hintTimersRef.current.push(window.setTimeout(() => {
      setHint(false);
      setMessage(`Your turn: connect all ${path.length} stars in the same order.`);
    }, path.length * delay + 280));
  }, [roundIndex]);

  useEffect(() => {
    playHint(roundIndex, false);
    return () => hintTimersRef.current.forEach(window.clearTimeout);
  }, [roundIndex, playHint]);

  const chooseStar = (index) => {
    if (hint) return;

    if (sequence[progress] !== index) {
      const nextMistakes = mistakes + 1;
      setProgress(0);
      setMistakes(nextMistakes);

      if (nextMistakes >= 2) {
        setMessage('Let’s trace the path together once more. Follow the numbers, then try again.');
        playHint(roundIndex, true);
      } else {
        setMessage('The path broke. Try to recall which star came next, then start the path again.');
      }
      return;
    }

    const next = progress + 1;
    setProgress(next);

    if (next >= sequence.length) {
      if (roundIndex === CONSTELLATION_ROUNDS.length - 1) {
        onWin({ summary: 'Three constellations were rebuilt from memory.' });
        return;
      }

      setRoundIndex((value) => value + 1);
      setProgress(0);
      setMistakes(0);
      setMessage(`Constellation ${roundIndex + 1} complete. The next path is longer.`);
    } else {
      setMessage(`Connected ${next} of ${sequence.length} stars. Keep the path in order.`);
    }
  };

  return (
    <div className="constellation-game">
      <p className="minigame-overline">
        CONSTELLATION {roundIndex + 1} / {CONSTELLATION_ROUNDS.length} · {sequence.length} STARS
      </p>
      <div className="constellation-board">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {Array.from({ length: Math.max(0, progress - 1) }, (_, index) => {
            const from = CONSTELLATION_POINTS[sequence[index]];
            const to = CONSTELLATION_POINTS[sequence[index + 1]];
            return <line key={index} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="constellation-line" />;
          })}
        </svg>
        {CONSTELLATION_POINTS.map(([x, y], index) => (
          <button
            key={index}
            type="button"
            className={`constellation-star${hint && sequence[previewStep] === index ? ' is-preview' : ''}${progress > 0 && sequence.slice(0, progress).includes(index) ? ' is-connected' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={`Star ${index + 1}`}
            onClick={() => chooseStar(index)}
            disabled={hint || progress === sequence.length}
          >
            <span>✦</span>
            {hint && sequence[previewStep] === index && <small>{guidedPreview ? previewStep + 1 : '•'}</small>}
          </button>
        ))}
      </div>

      <p className="constellation-feedback" aria-live="polite">{message}</p>
      <button className="text-button" type="button" onClick={() => playHint(roundIndex, mistakes >= 2)} disabled={hint}>
        {mistakes >= 2 ? 'Replay the numbered path slowly' : 'Show this round again'}
      </button>
      {mistakes >= 2 && (
        <div role="status" style={helperPanelStyle}>
          <strong>A clearer star map</strong>
          <p style={{ margin: '6px 0 0' }}>
            The next replay numbers each star and leaves longer gaps. The path still has to be rebuilt in the right order.
          </p>
        </div>
      )}
      {mistakes > 0 && (
        <p className="mini-muted">
          Mistakes this round: {mistakes}. You can replay the path at any time.
        </p>
      )}
    </div>
  );
}

function FutureLetter({ onWin }) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [promises, setPromises] = useState([]);
  const chapter = PROMISE_CHAPTERS[chapterIndex];

  const choosePromise = (choice) => {
    const next = [...promises, {
      chapter: chapter.title,
      title: choice.title,
      copy: choice.copy,
    }];

    setPromises(next);

    if (next.length === PROMISE_CHAPTERS.length) {
      onWin({ summary: 'The new page now holds three promises.', promises: next });
      return;
    }

    setChapterIndex((index) => index + 1);
  };

  return (
    <div className="future-letter-game">
      <div className="letter-progress">
        <span>CHAPTER {chapterIndex + 1} / 3</span>
        <div>
          {PROMISE_CHAPTERS.map((_, index) => (
            <i
              key={index}
              className={index < chapterIndex ? 'is-done' : index === chapterIndex ? 'is-current' : ''}
            />
          ))}
        </div>
      </div>

      <p className="minigame-overline">A PAGE FOR THE FUTURE</p>
      <h3>{chapter.title}</h3>
      <p className="future-letter-question">{chapter.prompt}</p>

      <div className="promise-options">
        {chapter.choices.map((choice, index) => (
          <button
            key={choice.title}
            type="button"
            className="promise-option"
            onClick={() => choosePromise(choice)}
          >
            <span className="promise-number">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{choice.title}</strong>
              <small>{choice.copy}</small>
            </span>
            <span className="promise-arrow">↗</span>
          </button>
        ))}
      </div>

      {promises.length > 0 && (
        <div className="promise-summary">
          <span className="minigame-overline">WHAT YOU CHOSE TO KEEP</span>
          {promises.map((promise, index) => (
            <p key={promise.chapter}><strong>{index + 1}.</strong> {promise.title}</p>
          ))}
        </div>
      )}

      <p className="mini-muted">
        There is no perfect answer. Choose what you would most like to nurture.
      </p>
    </div>
  );
}