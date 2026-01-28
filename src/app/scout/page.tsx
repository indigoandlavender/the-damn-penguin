'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { LegalStatus, ScoutCapture, GeoPoint } from '@/types';

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
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.85
      );
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
    <div className="card">
      <div className="card-header">
        <h2 className="font-semibold text-slate-900">GPS Location</h2>
      </div>
      <div className="card-body">
        {gps.status === 'idle' && (
          <button onClick={onAcquire} className="btn btn-primary btn-md w-full">
            Acquire GPS
          </button>
        )}

        {gps.status === 'acquiring' && (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <span className="text-slate-600">Acquiring GPS signal...</span>
          </div>
        )}

        {gps.status === 'acquired' && gps.position && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot--active" />
              <span className="text-sm font-medium text-emerald-700">
                GPS Acquired
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Latitude</p>
                <p className="mono-data">
                  {gps.position.coords.latitude.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Longitude</p>
                <p className="mono-data">
                  {gps.position.coords.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Accuracy</p>
                <p className="mono-data">
                  {gps.position.coords.accuracy.toFixed(1)}m
                </p>
              </div>
              <div>
                <p className="text-slate-500">Altitude</p>
                <p className="mono-data">
                  {gps.position.coords.altitude?.toFixed(1) ?? '—'}m
                </p>
              </div>
            </div>
            <button
              onClick={onAcquire}
              className="btn btn-secondary btn-sm w-full"
            >
              Re-acquire
            </button>
          </div>
        )}

        {gps.status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-rose-600">{gps.error}</p>
            <button
              onClick={onAcquire}
              className="btn btn-secondary btn-sm w-full"
            >
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
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Photo Evidence</h2>
        <span className="text-sm text-slate-500">{photos.length} captured</span>
      </div>
      <div className="card-body">
        {/* Camera Preview */}
        {camera.isActive && (
          <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-black">
            <video
              ref={camera.videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
              <button
                onClick={handleCapture}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg"
                aria-label="Capture photo"
              >
                <div className="h-12 w-12 rounded-full border-4 border-slate-900" />
              </button>
              <button
                onClick={camera.stop}
                className="btn btn-secondary btn-md"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Start Camera Button */}
        {!camera.isActive && (
          <button
            onClick={camera.start}
            className="btn btn-primary btn-md w-full"
          >
            Open Camera
          </button>
        )}

        {camera.error && (
          <p className="mt-2 text-sm text-rose-600">{camera.error}</p>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square">
                <img
                  src={photo.preview}
                  alt="Captured"
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  onClick={() => onRemove(photo.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
  const options: { value: LegalStatus; label: string; description: string }[] = [
    { value: 'Titled', label: 'Titled', description: 'Titre Foncier confirmed' },
    { value: 'In-Process', label: 'In Process', description: 'Réquisition filed' },
    { value: 'Melkia', label: 'Melkia', description: 'Traditional ownership' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="font-semibold text-slate-900">Legal Status</h2>
      </div>
      <div className="card-body space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex cursor-pointer items-center gap-3 rounded-lg border p-3
              transition-colors
              ${
                value === option.value
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
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
                flex h-5 w-5 items-center justify-center rounded-full border-2
                ${
                  value === option.value
                    ? 'border-slate-900 bg-slate-900'
                    : 'border-slate-300'
                }
              `}
            >
              {value === option.value && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">{option.label}</p>
              <p className="text-sm text-slate-500">{option.description}</p>
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
    <div className="min-h-screen bg-slate-100 safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-slate-600">
            ← Back
          </Link>
          <h1 className="font-semibold text-slate-900">Scout Mode</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* GPS */}
        <GPSCapture gps={gps} onAcquire={gps.acquire} />

        {/* Photos */}
        <PhotoCapture
          photos={photos}
          onCapture={handlePhotoCapture}
          onRemove={handlePhotoRemove}
        />

        {/* Legal Status */}
        <LegalStatusSelect value={legalStatus} onChange={setLegalStatus} />

        {/* Notes */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Field Notes</h2>
          </div>
          <div className="card-body">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Access conditions, visible boundaries, contact details..."
              rows={4}
              className="input resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="btn btn-primary btn-lg w-full"
        >
          {isSubmitting ? 'Saving...' : 'Save Scout Report'}
        </button>
      </div>
    </div>
  );
}
