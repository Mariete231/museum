import * as THREE from 'three';

const MAX_TEXTURE_DIMENSION = 1024;
const IMAGE_LOAD_TIMEOUT_MS = 20000;
const MAX_LOAD_ATTEMPTS = 2;
const imageCache = new Map();

/**
 * Resolve a replaceable image from Vite's public directory, including deployments
 * mounted below a non-root base path.
 */
export function getGalleryImageUrl(fileName) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}gallery/${encodeURIComponent(fileName)}`;
}

function loadImageCanvasAttempt(url, attempt) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    let finishing = false;
    const requestUrl = attempt === 0
      ? url
      : `${url}${url.includes('?') ? '&' : '?'}gallery-retry=${attempt}`;

    const timeoutId = window.setTimeout(() => {
      fail(new Error(`Timed out while loading gallery image: ${url}`));
    }, IMAGE_LOAD_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      image.removeAttribute('src');
      reject(error);
    };

    const finish = async () => {
      if (settled || finishing) return;
      finishing = true;

      if (!image.naturalWidth || !image.naturalHeight) {
        fail(new Error(`The browser returned an empty gallery image: ${url}`));
        return;
      }

      // The load event guarantees that pixels are available. decode() is an
      // additional readiness check, but a rejection is harmless when the image
      // already has valid natural dimensions (some browsers reject late decode()).
      if (typeof image.decode === 'function') {
        try {
          await image.decode();
        } catch {
          if (!image.naturalWidth || !image.naturalHeight) {
            fail(new Error(`The browser could not decode gallery image: ${url}`));
            return;
          }
        }
      }

      if (settled) return;

      const scale = Math.min(
        1,
        MAX_TEXTURE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        fail(new Error(`Could not create a canvas for gallery image: ${url}`));
        return;
      }

      try {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.fillStyle = '#171511';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
      } catch (error) {
        fail(new Error(`Could not prepare gallery image ${url}: ${error.message}`));
        return;
      }

      settled = true;
      cleanup();
      resolve(canvas);
    };

    image.decoding = 'async';
    image.loading = 'eager';
    image.fetchPriority = 'high';
    image.onload = () => { void finish(); };
    image.onerror = () => fail(new Error(`The browser could not load gallery image: ${url}`));
    image.src = requestUrl;

    // A cached response may be complete before the load callback is dispatched.
    if (image.complete && image.naturalWidth > 0) void finish();
  });
}

/**
 * Shared, concurrent image cache. All six network requests begin together instead
 * of serializing the entire exhibition behind one slow or failed request.
 */
export function loadGalleryBitmap(url) {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const request = (async () => {
    let lastError = null;

    for (let attempt = 0; attempt < MAX_LOAD_ATTEMPTS; attempt += 1) {
      try {
        return await loadImageCanvasAttempt(url, attempt);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error(`Unable to load gallery image: ${url}`);
  })();

  imageCache.set(url, request);
  request.catch(() => {
    if (imageCache.get(url) === request) imageCache.delete(url);
  });

  return request;
}

/**
 * Preload every artwork as one coordinated operation. The caller receives the
 * complete set only when all six images have been downloaded, decoded and resized.
 */
export async function preloadGalleryArtworks(artworks) {
  const entries = await Promise.all(artworks.map(async (artwork) => {
    const canvas = await loadGalleryBitmap(getGalleryImageUrl(artwork.fileName));
    return [artwork.id, canvas];
  }));

  return new Map(entries);
}

export function createArtworkTexture(canvas, targetAspect) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.needsUpdate = true;

  const imageAspect = canvas.width / canvas.height;

  if (imageAspect > targetAspect) {
    const visibleWidth = targetAspect / imageAspect;
    texture.repeat.set(visibleWidth, 1);
    texture.offset.set((1 - visibleWidth) / 2, 0);
  } else if (imageAspect < targetAspect) {
    const visibleHeight = imageAspect / targetAspect;
    texture.repeat.set(1, visibleHeight);
    texture.offset.set(0, (1 - visibleHeight) / 2);
  }

  return texture;
}