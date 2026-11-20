import { useEffect, useMemo, useState } from 'react';

export default function GalleryArtworkLabel({ artwork, onResume }) {
  const paragraphs = useMemo(
    () => artwork.description.split(/\n\s*\n/).filter(Boolean),
    [artwork.description],
  );

  const totalCharacters = artwork.description.length;
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    setVisibleCharacters(0);

    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches ?? false;

    if (reduceMotion) {
      setVisibleCharacters(totalCharacters);
      return undefined;
    }

    // Reveal a few characters per tick: readable typewriter rhythm without a long delay.
    const timer = window.setInterval(() => {
      setVisibleCharacters((current) => {
        const next = Math.min(totalCharacters, current + 3);
        if (next >= totalCharacters) window.clearInterval(timer);
        return next;
      });
    }, 19);

    return () => window.clearInterval(timer);
  }, [artwork.id, totalCharacters]);

  let remainingCharacters = visibleCharacters;
  let activeParagraphIndex = -1;

  const renderedParagraphs = paragraphs.map((paragraph, index) => {
    const visibleText = paragraph.slice(0, Math.max(0, remainingCharacters));

    if (
      activeParagraphIndex === -1
      && remainingCharacters <= paragraph.length
    ) {
      activeParagraphIndex = index;
    }

    remainingCharacters = Math.max(
      0,
      remainingCharacters - paragraph.length - 2,
    );

    return {
      key: `${artwork.id}-${index}`,
      text: visibleText,
    };
  });

  const isComplete = visibleCharacters >= totalCharacters;

  return (
    <div className="gallery-description-backdrop">
      <article
        className={`gallery-label-card${isComplete ? ' is-typed' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-label-title"
        aria-describedby="gallery-label-readable-description"
      >
        <div className="gallery-label-inner-border" aria-hidden="true" />

        <header className="gallery-label-header">
          <div className="gallery-label-number" aria-hidden="true">
            <span>CATALOGUE</span>
            <strong>{artwork.id}</strong>
          </div>

          <div className="gallery-label-heading">
            <p className="gallery-label-kicker">
              THE MUSEUM · PRIVATE COLLECTION
            </p>
            <h2 id="gallery-label-title">{artwork.title}</h2>
            <span className="gallery-label-subtitle">
              A work kept especially for this collection
            </span>
          </div>
        </header>

        <div className="gallery-label-ornament" aria-hidden="true">
          <span />
          <i>✦</i>
          <span />
        </div>

        <div className="gallery-label-story" aria-hidden="true">
          {renderedParagraphs.map((paragraph, index) => (
            (paragraph.text.length > 0 || index === activeParagraphIndex) && (
              <p key={paragraph.key}>
                {paragraph.text}
                {!isComplete && index === activeParagraphIndex && (
                  <span className="gallery-typewriter-caret" />
                )}
              </p>
            )
          ))}
        </div>

        <div
          id="gallery-label-readable-description"
          className="gallery-sr-only"
        >
          {artwork.description}
        </div>

        <footer className="gallery-label-footer">
          <span className="gallery-label-edition">
            THE MUSEUM · A COLLECTION OF SIX
          </span>

          <div className="gallery-label-actions">
            <button
              className="gallery-label-primary"
              type="button"
              onClick={onResume}
            >
              Return to the gallery <span aria-hidden="true">↗</span>
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}