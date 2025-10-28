// Lightweight audio utilities: robust recorder helper, playback helper, and SHA-256 checksum
export async function computeSha256Hex(blob) {
    try {
        const arrayBuffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        // console.warn('Failed to compute SHA-256', e);
        return null;
    }
}

export async function playBlobSafely(blob) {
    // Simple, reliable HTMLAudio playback that waits for 'ended' event
    if (!blob) throw new Error('No audio blob provided');

    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        const cleanup = () => {
            try {
                audio.pause();
                audio.src = '';
            } catch (e) { }
            try { URL.revokeObjectURL(url); } catch (e) { }
        };

        const onEnded = () => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onErr);
            cleanup();
            resolve();
        };

        const onErr = (e) => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onErr);
            cleanup();
            reject(e);
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onErr);

        // Wait for canplaythrough before starting play
        audio.addEventListener('canplaythrough', () => {
            audio.play().catch(err => {
                cleanup();
                reject(err);
            });
        }, { once: true });

        audio.load();
    });
}

// Start a recorder that accumulates chunks and returns a stop() Promise that resolves to a complete Blob.
export async function createRecorder(options = {}) {
    // Choose a safe mimeType. If caller provides mimeType use it; otherwise probe supported types.
    const { mimeType: requestedMime } = options;
    let mimeType = requestedMime;
    try {
        if (!mimeType && typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
            const candidates = [
                'audio/webm;codecs=opus',
                'audio/ogg;codecs=opus',
                'audio/mp4',
                'audio/mpeg',
                'audio/webm'
            ];
            for (const c of candidates) {
                try {
                    if (MediaRecorder.isTypeSupported(c)) {
                        mimeType = c;
                        break;
                    }
                } catch (e) {
                    // ignore probing errors and continue
                }
            }
        }
    } catch (e) {
        // guard: if probing throws for any reason, fall back to undefined and let the browser decide
        mimeType = mimeType || undefined;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support MediaDevices.getUserMedia');
    }

    // getUserMedia requires a secure context (HTTPS) on many mobile browsers (especially
    // iOS Safari). Provide a clearer error message when running on an insecure origin.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error('getUserMedia requires a secure context (HTTPS). Please use HTTPS or test locally via localhost.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    let mediaRecorder;
    try {
        if (mimeType) {
            // console.debug('createRecorder: using mimeType', mimeType);
            mediaRecorder = new MediaRecorder(stream, { mimeType });
        } else {
            // console.debug('createRecorder: no supported mimeType detected, creating MediaRecorder without explicit mime');
            mediaRecorder = new MediaRecorder(stream);
        }
    } catch (e) {
        // fallback without mimeType
        try {
            mediaRecorder = new MediaRecorder(stream);
        } catch (err) {
            // rethrow the original exception as it is more informative
            throw e;
        }
    }

    const chunks = [];
    mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
    });

    let stoppedResolve, stoppedReject;
    const stopped = new Promise((resolve, reject) => { stoppedResolve = resolve; stoppedReject = reject; });

    mediaRecorder.addEventListener('stop', () => {
        stoppedResolve();
    });
    mediaRecorder.addEventListener('error', (err) => {
        stoppedReject(err);
    });

    return {
        start: () => {
            chunks.length = 0;
            try { mediaRecorder.start(); } catch (e) { mediaRecorder.start && mediaRecorder.start(); }
            return stream;
        },
        stop: async () => {
            // ensure requestData flush when available
            try { if (typeof mediaRecorder.requestData === 'function') mediaRecorder.requestData(); } catch (e) { }
            try { mediaRecorder.stop(); } catch (e) { try { mediaRecorder.state && mediaRecorder.stream && mediaRecorder.stream.getTracks().forEach(t => t.stop()); } catch (_) { } }
            await stopped; // wait for 'stop' event
            // Build final blob only once on stop
            const blobType = chunks[0]?.type || mimeType || 'audio/webm';
            const blob = new Blob(chunks.slice(), { type: blobType });
            return { blob, stream };
        },
        cancel: () => {
            try { mediaRecorder.stop(); } catch (e) { }
        },
        stream,
    };
}

export default { createRecorder, playBlobSafely, computeSha256Hex };
