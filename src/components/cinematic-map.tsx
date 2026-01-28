'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import { createClient } from '@/lib/supabase/client';
import type { GeoPolygon, GeoPoint } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaW5kaWdvYW5kbGF2ZW5kZXIiLCJhIjoiY21kN3B0OTZvMGllNjJpcXY0MnZlZHVlciJ9.1-jV-Pze3d7HZseOAhmkCg';

// Morocco center with cinematic 45° pitch
const INITIAL_VIEW = {
  center: [-7.5898, 31.7917] as [number, number],
  zoom: 5.5,
  pitch: 45,
  bearing: -15,
};

// Mapbox Standard Style — 2026 spec
const MAP_STYLE = 'mapbox://styles/mapbox/standard';

// =============================================================================
// TYPES
// =============================================================================

export interface LandParcel {
  id: string;
  property_id: string;
  polygon: GeoPolygon;
  legal_status: 'Titled' | 'In-Process' | 'Melkia';
  title_number?: string | undefined;
  estimated_value_mad?: number | undefined;
}

export interface CinematicMapHandle {
  flyToProperty: (coords: { lng: number; lat: number }, zoom?: number) => void;
  getMap: () => mapboxgl.Map | null;
}

interface CinematicMapProps {
  /** Initial coordinates to center on */
  initialCoords?: { lng: number; lat: number };
  /** Single point marker */
  marker?: GeoPoint | null | undefined;
  /** Property boundary polygon */
  polygon?: GeoPolygon | null | undefined;
  /** Enable realtime Supabase updates */
  enableRealtime?: boolean;
  /** Callback when a parcel is clicked */
  onParcelClick?: (parcel: LandParcel) => void;
  /** Fixed parcels to display (when not using realtime) */
  parcels?: LandParcel[];
  /** Height of map container */
  height?: string;
  /** Show crosshair overlay */
  showCrosshair?: boolean;
  /** Interactive mode */
  interactive?: boolean;
}

// =============================================================================
// GEOJSON HELPERS
// =============================================================================

function parcelsToGeoJSON(parcels: LandParcel[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: parcels.map((parcel) => ({
      type: 'Feature' as const,
      id: parcel.id,
      properties: {
        id: parcel.id,
        property_id: parcel.property_id,
        legal_status: parcel.legal_status,
        title_number: parcel.title_number || null,
        estimated_value_mad: parcel.estimated_value_mad || null,
      },
      geometry: parcel.polygon,
    })),
  };
}

function pointToGeoJSON(point: GeoPoint): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: point,
    }],
  };
}

function polygonToGeoJSON(polygon: GeoPolygon): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: polygon,
    }],
  };
}

// =============================================================================
// CINEMATIC MAP COMPONENT
// =============================================================================

export const CinematicMap = forwardRef<CinematicMapHandle, CinematicMapProps>(
  function CinematicMap(
    {
      initialCoords,
      marker,
      polygon,
      enableRealtime = false,
      onParcelClick,
      parcels: externalParcels,
      height = '100%',
      showCrosshair = true,
      interactive = true,
    },
    ref
  ) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [parcels, setParcels] = useState<LandParcel[]>(externalParcels || []);

    // ==========================================================================
    // CINEMATIC FLY TO — Smooth ease-in-out transitions
    // ==========================================================================

    const flyToProperty = useCallback(
      (coords: { lng: number; lat: number }, zoom = 16) => {
        if (!map.current) return;

        map.current.flyTo({
          center: [coords.lng, coords.lat],
          zoom,
          pitch: 60,
          bearing: Math.random() * 60 - 30, // Slight random bearing for cinematic effect
          duration: 3000,
          essential: true,
          curve: 1.42, // Ease-in-out cubic bezier approximation
          easing: (t) => {
            // Custom ease-in-out
            return t < 0.5
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2;
          },
        });
      },
      []
    );

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      flyToProperty,
      getMap: () => map.current,
    }));

    // ==========================================================================
    // SUPABASE REALTIME LISTENER — "The Lobster" integration
    // ==========================================================================

    useEffect(() => {
      if (!enableRealtime) return;

      const supabase = createClient();

      // Initial fetch
      const fetchParcels = async () => {
        const { data, error } = await supabase
          .from('land_parcels')
          .select('*');

        if (!error && data) {
          setParcels(data as LandParcel[]);
        }
      };

      fetchParcels();

      // Realtime subscription — instant updates when Lobster inserts
      const channel = supabase
        .channel('land_parcels_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'land_parcels',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newParcel = payload.new as LandParcel;
              setParcels((prev) => [...prev, newParcel]);
              
              // Auto fly to new parcel
              if (map.current && newParcel.polygon) {
                const ring = newParcel.polygon.coordinates[0];
                const coords = ring?.[0];
                if (coords && coords[0] !== undefined && coords[1] !== undefined) {
                  flyToProperty({ lng: coords[0], lat: coords[1] }, 14);
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              setParcels((prev) =>
                prev.map((p) =>
                  p.id === (payload.new as LandParcel).id
                    ? (payload.new as LandParcel)
                    : p
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setParcels((prev) =>
                prev.filter((p) => p.id !== (payload.old as LandParcel).id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [enableRealtime, flyToProperty]);

    // Sync external parcels
    useEffect(() => {
      if (externalParcels) {
        setParcels(externalParcels);
      }
    }, [externalParcels]);

    // ==========================================================================
    // MAP INITIALIZATION — 2026 Spec with all premium features
    // ==========================================================================

    useEffect(() => {
      if (!mapContainer.current || map.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Calculate initial view
      const initialCenter = initialCoords
        ? [initialCoords.lng, initialCoords.lat] as [number, number]
        : INITIAL_VIEW.center;
      const initialZoom = initialCoords ? 14 : INITIAL_VIEW.zoom;

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: initialCenter,
        zoom: initialZoom,
        pitch: INITIAL_VIEW.pitch,
        bearing: INITIAL_VIEW.bearing,
        projection: 'globe', // Globe projection for high-level views
        attributionControl: false,
        logoPosition: 'bottom-right',
        interactive,
        // Remove all default controls
        dragRotate: interactive,
        touchZoomRotate: interactive,
        touchPitch: interactive,
      });

      const mapInstance = map.current;

      // =======================================================================
      // MAP LOAD — Configure 3D Terrain, Lighting, Atmosphere
      // =======================================================================

      mapInstance.on('style.load', () => {
        // ----- 3D TERRAIN -----
        // Add terrain source (Mapbox DEM)
        if (!mapInstance.getSource('mapbox-dem')) {
          mapInstance.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
        }

        // Enable 3D terrain with 1.5 exaggeration for Atlas Mountains
        mapInstance.setTerrain({
          source: 'mapbox-dem',
          exaggeration: 1.5,
        });

        // ----- DUSK LIGHTING PRESET -----
        // "Golden Hour" aesthetic for high-end editorial feel
        try {
          mapInstance.setConfigProperty('basemap', 'lightPreset', 'dusk');
        } catch {
          // Fallback for older style versions
          console.log('Light preset not available on this style');
        }

        // ----- ATMOSPHERIC FOG -----
        // Professional hazy depth effect
        mapInstance.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(245, 245, 245)',
          'horizon-blend': 0.1,
          'space-color': 'rgb(250, 250, 250)',
          'star-intensity': 0,
        });

        // ----- CROSSHAIR CURSOR -----
        mapInstance.getCanvas().style.cursor = 'crosshair';

        // ----- ADD PARCEL LAYERS -----
        addParcelLayers(mapInstance);
        addMarkerLayer(mapInstance);
        addPropertyPolygonLayer(mapInstance);

        setIsMapLoaded(true);
      });

      // ----- INTERACTION HANDLERS -----
      if (interactive && onParcelClick) {
        mapInstance.on('click', 'parcels-fill', (e) => {
          if (e.features && e.features[0]) {
            const feature = e.features[0];
            const parcel = parcels.find(
              (p) => p.id === feature.properties?.id
            );
            if (parcel) {
              onParcelClick(parcel);
              flyToProperty({
                lng: e.lngLat.lng,
                lat: e.lngLat.lat,
              });
            }
          }
        });

        mapInstance.on('mouseenter', 'parcels-fill', () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', 'parcels-fill', () => {
          mapInstance.getCanvas().style.cursor = 'crosshair';
        });
      }

      return () => {
        mapInstance.remove();
        map.current = null;
      };
    }, [initialCoords, interactive, onParcelClick, parcels, flyToProperty]);

    // ==========================================================================
    // LAYER DEFINITIONS
    // ==========================================================================

    function addParcelLayers(mapInstance: mapboxgl.Map) {
      // Add parcels source
      if (!mapInstance.getSource('parcels')) {
        mapInstance.addSource('parcels', {
          type: 'geojson',
          data: parcelsToGeoJSON(parcels),
        });
      }

      // Fill layer with emissive strength — "Gold Nugget" glow effect
      if (!mapInstance.getLayer('parcels-fill')) {
        mapInstance.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels',
          slot: 'top', // Above 3D buildings, receives environmental lighting
          paint: {
            'fill-color': [
              'match',
              ['get', 'legal_status'],
              'Titled', '#000000',
              'In-Process', '#333333',
              'Melkia', '#666666',
              '#999999',
            ],
            'fill-opacity': 0.6,
            'fill-emissive-strength': 0.8, // GLOW EFFECT
          },
        });
      }

      // Outline layer
      if (!mapInstance.getLayer('parcels-outline')) {
        mapInstance.addLayer({
          id: 'parcels-outline',
          type: 'line',
          source: 'parcels',
          slot: 'top',
          paint: {
            'line-color': '#000000',
            'line-width': 1.5,
            'line-emissive-strength': 1.0,
          },
        });
      }
    }

    function addMarkerLayer(mapInstance: mapboxgl.Map) {
      if (!mapInstance.getSource('marker')) {
        mapInstance.addSource('marker', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }

      if (!mapInstance.getLayer('marker-point')) {
        mapInstance.addLayer({
          id: 'marker-point',
          type: 'circle',
          source: 'marker',
          slot: 'top',
          paint: {
            'circle-radius': 10,
            'circle-color': '#000000',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#FFFFFF',
            'circle-emissive-strength': 1.0,
          },
        });
      }
    }

    function addPropertyPolygonLayer(mapInstance: mapboxgl.Map) {
      if (!mapInstance.getSource('property-polygon')) {
        mapInstance.addSource('property-polygon', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }

      if (!mapInstance.getLayer('property-fill')) {
        mapInstance.addLayer({
          id: 'property-fill',
          type: 'fill',
          source: 'property-polygon',
          slot: 'top',
          paint: {
            'fill-color': '#000000',
            'fill-opacity': 0.5,
            'fill-emissive-strength': 0.8,
          },
        });
      }

      if (!mapInstance.getLayer('property-outline')) {
        mapInstance.addLayer({
          id: 'property-outline',
          type: 'line',
          source: 'property-polygon',
          slot: 'top',
          paint: {
            'line-color': '#000000',
            'line-width': 2,
            'line-emissive-strength': 1.0,
          },
        });
      }
    }

    // ==========================================================================
    // UPDATE SOURCES WHEN DATA CHANGES
    // ==========================================================================

    useEffect(() => {
      if (!map.current || !isMapLoaded) return;

      const source = map.current.getSource('parcels') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(parcelsToGeoJSON(parcels));
      }
    }, [parcels, isMapLoaded]);

    useEffect(() => {
      if (!map.current || !isMapLoaded) return;

      const source = map.current.getSource('marker') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(
          marker
            ? pointToGeoJSON(marker)
            : { type: 'FeatureCollection', features: [] }
        );
      }
    }, [marker, isMapLoaded]);

    useEffect(() => {
      if (!map.current || !isMapLoaded) return;

      const source = map.current.getSource('property-polygon') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(
          polygon
            ? polygonToGeoJSON(polygon)
            : { type: 'FeatureCollection', features: [] }
        );
      }
    }, [polygon, isMapLoaded]);

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
      <div
        className="relative"
        style={{
          height,
          border: '0.5px solid #000000', // Strict 0.5px black border
          boxShadow: 'none', // Zero shadows
        }}
      >
        {/* Map Container */}
        <div ref={mapContainer} className="h-full w-full" />

        {/* Crosshair Overlay — Targeting System */}
        {showCrosshair && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-black opacity-60" />
              {/* Horizontal line */}
              <div className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 bg-black opacity-60" />
            </div>
          </div>
        )}

        {/* Coordinates Display */}
        <div className="absolute bottom-4 left-4 font-mono text-xs tracking-wider opacity-50">
          <span>MOROCCO · 2026 CHARTER</span>
        </div>

        {/* Loading State */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F9F9F9]">
            <div className="flex flex-col items-center gap-2">
              <div className="h-4 w-4 animate-pulse bg-black" />
              <span className="font-mono text-xs uppercase tracking-widest">
                Initializing terrain...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// =============================================================================
// STATIC PROPERTY MAP — For Property Detail Pages
// =============================================================================

interface StaticMapProps {
  center: { lng: number; lat: number };
  marker?: GeoPoint | null | undefined;
  polygon?: GeoPolygon | null | undefined;
  height?: string;
}

export function StaticPropertyMap({
  center,
  marker,
  polygon,
  height = '400px',
}: StaticMapProps) {
  return (
    <CinematicMap
      initialCoords={center}
      marker={marker}
      polygon={polygon}
      height={height}
      showCrosshair={true}
      interactive={true}
      enableRealtime={false}
    />
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { CinematicMapProps, StaticMapProps };
