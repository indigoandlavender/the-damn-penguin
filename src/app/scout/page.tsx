'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LegalStatus, ScoutCapture } from '@/types';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface GPSState {
  status: 'idle' | 'acquiring' | 'acquired' | 'error';
  position: GeolocationPosition | null;
  error: string | null;
}

interface PhotoCapture {
  id: string;
  blob: Blob;
  preview: string;
  timestamp: number;
}

// =============================================================================
// HOOKS
// =============================================================================

function useGeolocation() {
  const [state, setState] = useState<GPSState>({
    status: 'idle',
    position: null,
    error: null,
  });

  const acquire = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: 'error',
        position: null,
        error: 'Geolocation not supported',
      });
      return;
    }

    setState((prev) => ({ ...prev, status: 'acquiring' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'acquired',
          position,
          error: null,
        });
      },
      (error) => {
        setState({
          status: 'error',
          position: null,
          error: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  }, []);

  return { ...state, acquire };
}

function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      setIsActive(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied');
    }
  }, []);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
    }
  }, [stream]);

  const capture = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !isActive) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
    });
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return { videoRef, isActive, error, start, stop, capture };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function GPSCapture({
  gps,
  onAcquire,
}: {
  gps: GPSState;
  onAcquire: () => void;
}) {
  return (
    <div className="specimen-card">
      <div className="specimen-header">
        <h3>GPS Coordinates</h3>
      </div>
      <div className="specimen-body">
        {gps.status === 'idle' && (
          <button onClick={onAcquire} className="btn-editorial w-full">
            Acquire GPS Signal
          </button>
        )}

        {gps.status === 'acquiring' && (
          <div className="flex items-center justify-center gap-4 py-8">
            <div className="h-4 w-4 animate-pulse bg-black" />
            <span className="font-mono text-xs uppercase tracking-widest">
              Acquiring Signal...
            </span>
          </div>
        )}

        {gps.status === 'acquired' && gps.position && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="stamp stamp--certified text-[10px]">LOCKED</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest opacity-50">
                  Latitude
                </p>
                <p className="font-mono text-lg tabular-nums">
                  {gps.position.coords.latitude.toFixed(6)}°
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest opacity-50">
                  Longitude
                </p>
                <p className="font-mono text-lg tabular-nums">
                  {gps.position.coords.longitude.toFixed(6)}°
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest opacity-50">
                  Accuracy
                </p>
                <p className="font-mono text-lg tabular-nums">
                  {gps.position.coords.accuracy.toFixed(1)}m
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest opacity-50">
                  Altitude
                </p>
                <p className="font-mono text-lg tabular-nums">
                  {gps.position.coords.altitude?.toFixed(1) ?? '—'}m
                </p>
              </div>
            </div>
            <button onClick={onAcquire} className="btn-editorial w-full">
              Re-acquire
            </button>
          </div>
        )}

        {gps.status === 'error' && (
          <div className="space-y-4">
            <p className="font-mono text-sm">{gps.error}</p>
            <button onClick={onAcquire} className="btn-editorial w-full">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoCapture({
  photos,
  onCapture,
  onRemove,
}: {
  photos: PhotoCapture[];
  onCapture: (blob: Blob) => void;
  onRemove: (id: string) => void;
}) {
  const camera = useCamera();

  const handleCapture = async () => {
    const blob = await camera.capture();
    if (blob) {
      onCapture(blob);
    }
  };

  return (
    <div className="specimen-card">
      <div className="specimen-header flex items-center justify-between">
        <h3>Photo Evidence</h3>
        <span className="font-mono text-xs tabular-nums opacity-50">
          {photos.length} CAPTURED
        </span>
      </div>
      <div className="specimen-body">
        {/* Camera Preview */}
        {camera.isActive && (
          <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-black">
            <video
              ref={camera.videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* Crosshair */}
            <div className="crosshair-overlay" />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4">
              <button
                onClick={handleCapture}
                className="flex h-16 w-16 items-center justify-center border-2 border-white bg-transparent"
                aria-label="Capture photo"
              >
                <div className="h-10 w-10 border-2 border-white" />
              </button>
              <button onClick={camera.stop} className="btn-editorial bg-white">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Start Camera Button */}
        {!camera.isActive && (
          <button onClick={camera.start} className="btn-editorial w-full">
            Open Camera
          </button>
        )}

        {camera.error && (
          <p className="mt-2 font-mono text-xs">{camera.error}</p>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-px bg-[#EEEEEE]">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square bg-white">
                <img
                  src={photo.preview}
                  alt="Captured"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => onRemove(photo.id)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-black text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LegalStatusSelect({
  value,
  onChange,
}: {
  value: LegalStatus;
  onChange: (status: LegalStatus) => void;
}) {
  const options: { value: LegalStatus; label: string; sublabel: string }[] = [
    { value: 'Titled', label: 'CERTIFIED', sublabel: 'Titre Foncier confirmed' },
    { value: 'In-Process', label: 'PENDING', sublabel: 'Réquisition filed' },
    { value: 'Melkia', label: 'UNVERIFIED', sublabel: 'Traditional ownership' },
  ];

  return (
    <div className="specimen-card">
      <div className="specimen-header">
        <h3>Legal Status</h3>
      </div>
      <div className="specimen-body space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex cursor-pointer items-center gap-4 border p-4
              transition-colors
              ${
                value === option.value
                  ? 'border-black bg-[#F9F9F9]'
                  : 'border-[#EEEEEE] hover:border-[#DDDDDD]'
              }
            `}
          >
            <input
              type="radio"
              name="legal_status"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div
              className={`
                flex h-4 w-4 items-center justify-center border-2
                ${value === option.value ? 'border-black' : 'border-[#DDDDDD]'}
              `}
            >
              {value === option.value && (
                <div className="h-2 w-2 bg-black" />
              )}
            </div>
            <div>
              <p className="font-mono text-sm font-semibold tracking-wider">
                {option.label}
              </p>
              <p className="font-mono text-xs opacity-50">{option.sublabel}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function ScoutPage() {
  const gps = useGeolocation();
  const [photos, setPhotos] = useState<PhotoCapture[]>([]);
  const [legalStatus, setLegalStatus] = useState<LegalStatus>('Melkia');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoCapture = useCallback((blob: Blob) => {
    const id = crypto.randomUUID();
    const preview = URL.createObjectURL(blob);
    setPhotos((prev) => [...prev, { id, blob, preview, timestamp: Date.now() }]);
  }, []);

  const handlePhotoRemove = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleSubmit = async () => {
    if (!gps.position) return;

    setIsSubmitting(true);

    const capture: ScoutCapture = {
      gps: {
        latitude: gps.position.coords.latitude,
        longitude: gps.position.coords.longitude,
        accuracy: gps.position.coords.accuracy,
        timestamp: gps.position.timestamp,
      },
      photos: photos.map((p) => ({ blob: p.blob, timestamp: p.timestamp })),
      notes,
      device_info: {
        user_agent: navigator.userAgent,
        platform: navigator.platform,
      },
    };

    // TODO: Submit to Supabase
    console.log('Scout capture:', capture);

    setIsSubmitting(false);
  };

  const canSubmit = gps.status === 'acquired' && photos.length > 0;

  return (
    <div className="min-h-screen bg-white safe-top safe-bottom">
      {/* Navigation */}
      <nav className="nav-editorial">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            The Damn Penguin
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-link">
              Portfolio
            </Link>
            <Link href="/scout" className="nav-link nav-link--active">
              Scout
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <motion.header
        className="border-b border-[#EEEEEE]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container-narrow py-8">
          <motion.div variants={itemVariants}>
            <Link
              href="/dashboard"
              className="font-mono text-xs uppercase tracking-widest opacity-50 hover:opacity-100"
            >
              ← Back to Portfolio
            </Link>
          </motion.div>
          <motion.h1 variants={itemVariants} className="mt-6 font-serif">
            Field Scout
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-2 font-mono text-sm uppercase tracking-wider opacity-50"
          >
            Capture specimen data for verification
          </motion.p>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.section
        className="section-void"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container-narrow space-y-6">
          <motion.div variants={itemVariants}>
            <GPSCapture gps={gps} onAcquire={gps.acquire} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <PhotoCapture
              photos={photos}
              onCapture={handlePhotoCapture}
              onRemove={handlePhotoRemove}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <LegalStatusSelect value={legalStatus} onChange={setLegalStatus} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="specimen-card">
              <div className="specimen-header">
                <h3>Field Notes</h3>
              </div>
              <div className="specimen-body">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ACCESS CONDITIONS, VISIBLE BOUNDARIES, CONTACT DETAILS..."
                  rows={4}
                  className="input-editorial resize-none"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`
                btn-editorial btn-editorial--filled w-full py-4
                ${(!canSubmit || isSubmitting) && 'opacity-30 cursor-not-allowed'}
              `}
            >
              {isSubmitting ? 'Saving...' : 'Save Scout Report'}
            </button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
