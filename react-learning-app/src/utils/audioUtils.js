// Lightweight audio utilities: robust recorder helper, playback helper, and SHA-256 checksum
export async function computeSha256Hex(blob) {
    try {
        const arrayBuffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.warn('Failed to compute SHA-256', e);
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
    const { mimeType = 'audio/webm;codecs=opus' } = options;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support MediaDevices.getUserMedia');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    let mediaRecorder;
    try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch (e) {
        // fallback without mimeType
        mediaRecorder = new MediaRecorder(stream);
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
