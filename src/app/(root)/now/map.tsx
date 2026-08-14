"use client";

import mlcontour from "maplibre-contour";
import maplibregl, {
  type DataDrivenPropertyValueSpecification,
  type StyleSpecification,
} from "maplibre-gl";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useTheme } from "@/features/theme";
import {
  autoRotateSpeed,
  bearingAfterDrag,
  normalizeBearing,
  RESUME_DELAY_MS,
} from "./map-camera";

const ZOOM = 15;
const PITCH = 60;
const TERRAIN_EXAGGERATION = 1.3;

type MapPalette = {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  buildingHighlight: string;
};

// Hex palettes derived from the `:root[data-theme]` block in globals.css —
// maplibre's color parser can't take the live vars (they resolve to lab()/
// color-mix() strings), so the base hexes come from the comments there and
// the mixed tokens are precomputed from the same color-mix ratios.
const PALETTES: Record<"light" | "dark", MapPalette> = {
  light: {
    background: "#fdf6fe", // --background
    foreground: "#341f3d", // --primary
    muted: "#ede5ef", // color-mix(bg 92%, primary)
    mutedForeground: "#3e2a47", // color-mix(primary 95%, bg)
    buildingHighlight: "#16175c", // --secondary
  },
  dark: {
    background: "#070b04",
    foreground: "#dbead3",
    muted: "#141810", // color-mix(bg 94%, primary)
    mutedForeground: "#869180", // color-mix(primary 60%, bg)
    buildingHighlight: "#96ace8",
  },
};

type DemSource = InstanceType<typeof mlcontour.DemSource>;

// maplibre-contour registers a global protocol handler; keep one instance
// across remounts (React StrictMode mounts effects twice in dev).
let demSource: DemSource | null = null;
function getDemSource(): DemSource {
  if (!demSource) {
    demSource = new mlcontour.DemSource({
      url: "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",
      encoding: "terrarium",
      maxzoom: 15,
      // offload contour line computation to a web worker
      worker: true,
      cacheSize: 100,
      timeoutMs: 10_000,
    });
    demSource.setupMaplibre(maplibregl);
  }
  return demSource;
}

function buildingColorRamp(
  palette: MapPalette,
): DataDrivenPropertyValueSpecification<string> {
  return [
    "interpolate",
    ["linear"],
    ["get", "render_height"],
    0,
    palette.muted,
    60,
    palette.buildingHighlight,
    200,
    palette.foreground,
  ];
}

function applyPalette(map: maplibregl.Map, palette: MapPalette) {
  map.setPaintProperty("bg", "background-color", palette.background);
  map.setPaintProperty(
    "3d-buildings",
    "fill-extrusion-color",
    buildingColorRamp(palette),
  );
  map.setPaintProperty("contours", "line-color", palette.mutedForeground);
  map.setPaintProperty("contour-text", "text-color", palette.foreground);
  map.setPaintProperty("contour-text", "text-halo-color", palette.background);
  map.setPaintProperty("place-labels", "text-color", palette.foreground);
  map.setPaintProperty("place-labels", "text-halo-color", palette.background);
}

function buildStyle(dem: DemSource, palette: MapPalette): StyleSpecification {
  return {
    version: 8,
    // self-hosted Platypi SDF glyphs (public/fonts/glyphs, generated via
    // maplibre/font-maker from the repo's own TTFs); buildStyle only runs
    // client-side so window is available
    glyphs: `${window.location.origin}/fonts/glyphs/{fontstack}/{range}.pbf`,
    terrain: { source: "terrainSource", exaggeration: TERRAIN_EXAGGERATION },
    sources: {
      terrainSource: {
        type: "raster-dem",
        tiles: [dem.sharedDemProtocolUrl],
        encoding: "terrarium",
        // AWS terrarium tiles are 256px — declaring 512 misreports resolution
        // and trips "cannot calculate elevation if elevation maxzoom > source.maxzoom"
        tileSize: 256,
        // matches openmaptiles' real maxzoom (14, from its TileJSON) — the
        // vector basemap layers are overscaled at our fixed zoom 15, and
        // maplibre's terrain code warns unless this source's maxzoom is <=
        // theirs (see Terrain.getTerrainData in maplibre-gl)
        maxzoom: 14,
      },
      hillshadeSource: {
        type: "raster-dem",
        tiles: [dem.sharedDemProtocolUrl],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 14,
      },
      contourSourceFeet: {
        type: "vector",
        tiles: [
          dem.contourProtocolUrl({
            // meters to feet
            multiplier: 3.28084,
            overzoom: 1,
            thresholds: {
              // zoom: [minor, major]
              11: [200, 1000],
              12: [100, 500],
              13: [100, 500],
              14: [50, 200],
              15: [20, 100],
            },
            elevationKey: "ele",
            levelKey: "level",
            contourLayer: "contours",
          }),
        ],
        maxzoom: 15,
      },
      openmaptiles: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
      },
    },
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": palette.background },
      },
      {
        id: "hills",
        type: "hillshade",
        source: "hillshadeSource",
        layout: { visibility: "visible" },
        paint: { "hillshade-exaggeration": 0.25 },
      },
      {
        id: "3d-buildings",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        filter: ["!=", ["get", "hide_3d"], true],
        paint: {
          "fill-extrusion-color": buildingColorRamp(palette),
          // zoom is locked at 15, so no zoom ramp — extrude directly
          "fill-extrusion-height": ["get", "render_height"],
          "fill-extrusion-base": ["get", "render_min_height"],
          "fill-extrusion-opacity": 0.8,
        },
      },
      {
        id: "contours",
        type: "line",
        source: "contourSourceFeet",
        "source-layer": "contours",
        paint: {
          "line-color": palette.mutedForeground,
          "line-opacity": 0.5,
          // "major" contours have level=1, "minor" have level=0
          "line-width": ["match", ["get", "level"], 1, 1, 0.5],
        },
      },
      {
        id: "contour-text",
        type: "symbol",
        source: "contourSourceFeet",
        "source-layer": "contours",
        filter: [">", ["get", "level"], 0],
        paint: {
          "text-color": palette.foreground,
          "text-halo-color": palette.background,
          "text-halo-width": 1,
        },
        layout: {
          "symbol-placement": "line",
          "text-size": 10,
          "text-field": ["concat", ["number-format", ["get", "ele"], {}], "'"],
          "text-font": ["Platypi Regular"],
        },
      },
      {
        id: "place-labels",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: [
          "in",
          ["get", "class"],
          [
            "literal",
            ["city", "town", "village", "suburb", "quarter", "neighbourhood"],
          ],
        ],
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Platypi Bold"],
          "text-size": ["match", ["get", "class"], "city", 16, "town", 14, 12],
          "text-letter-spacing": 0.05,
        },
        paint: {
          "text-color": palette.foreground,
          "text-halo-color": palette.background,
          "text-halo-width": 1.5,
        },
      },
    ],
  };
}

export const LibreMap: React.FC<{
  initialCoords: [number, number];
  rotate?: number;
}> = ({ initialCoords, rotate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // flips true once the style JSON is parsed — the point after which
  // setPaintProperty is safe (isStyleLoaded() is unreliable here: it goes
  // false again whenever tiles load, which is almost always on this map)
  const styleReadyRef = useRef(false);
  const { resolvedTheme } = useTheme();
  // creation reads the theme through a ref so theme flips never recreate the
  // map — the palette effect below restyles it in place
  const themeRef = useRef(resolvedTheme);
  themeRef.current = resolvedTheme;
  const [lng, lat] = initialCoords;

  // biome-ignore lint/correctness/useExhaustiveDependencies: do not expect this to change ever
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: buildStyle(getDemSource(), PALETTES[themeRef.current]),
      center: [lng, lat],
      zoom: ZOOM,
      pitch: PITCH,
      bearing: 0,
      // all interaction is the custom drag-to-spin below; pitch/zoom/center
      // stay locked forever
      interactive: false,
      attributionControl: false,
    });
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        // © OpenStreetMap contributors · © OpenFreeMap ·
        customAttribution: "Terrain: Mapzen/AWS Open Data",
      }),
    );
    mapRef.current = map;
    styleReadyRef.current = false;
    map.once("styledata", () => {
      styleReadyRef.current = true;
    });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let dragging = false;
    let lastX = 0;
    // timestamp after which auto-rotation runs; Infinity = never
    let resumeAt = reduceMotion ? Number.POSITIVE_INFINITY : 0;
    let lastFrame: number | null = null;

    // rotating repaints the whole terrain+extrusion scene, so don't do it
    // when the map is scrolled out of view
    let visible = true;
    const io = new IntersectionObserver((entries) => {
      // entries are batched oldest-first — only the newest state matters
      visible = entries.at(-1)?.isIntersecting ?? true;
    });
    io.observe(container);

    // cap rotation updates at ~60fps — 120Hz repaints double GPU load for
    // imperceptible smoothness gain at 6°/s (-0.5ms tolerance so 60Hz
    // displays' natural jitter doesn't halve them to 30fps)
    const MIN_FRAME_MS = 1000 / 60 - 0.5;

    let raf = 0;
    if (!reduceMotion)
      raf = requestAnimationFrame(function frame(now: number) {
        raf = requestAnimationFrame(frame);
        if (lastFrame === null) {
          lastFrame = now;
          return;
        }
        const dt = now - lastFrame;
        if (dt < MIN_FRAME_MS) return;
        lastFrame = now;
        if (dragging || !visible || now < resumeAt) return;
        const degPerSec = autoRotateSpeed(now - resumeAt, rotate);
        if (degPerSec > 0) {
          map.setBearing(
            normalizeBearing(map.getBearing() + (degPerSec * dt) / 1000),
          );
        } else if ((rotate ?? 0) < 0 && degPerSec < 0) {
          map.setBearing(
            normalizeBearing(map.getBearing() + (degPerSec * dt) / 1000),
          );
        }
      });

    const closeAttribution = () => {
      const attrib = container.querySelector<HTMLElement>(
        "details.maplibregl-compact",
      );
      // mirrors the attribution control's own close transition
      // (AttributionControl._toggleAttribution's show -> hide branch),
      // which sets (not removes) the `open` attribute when it drops the
      // `-show` class
      attrib?.setAttribute("open", "");
      attrib?.classList.remove("maplibregl-compact-show");
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;
      // clicks on map controls (attribution ⓘ, its links) are theirs, not drags
      if ((e.target as HTMLElement | null)?.closest(".maplibregl-ctrl")) return;
      // grabbing the map dismisses the attribution popup
      closeAttribution();
      dragging = true;
      lastX = e.clientX;
      container.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      map.setBearing(bearingAfterDrag(map.getBearing(), e.clientX - lastX));
      lastX = e.clientX;
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      resumeAt = reduceMotion
        ? Number.POSITIVE_INFINITY
        : performance.now() + RESUME_DELAY_MS;
    };
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", endDrag);
      container.removeEventListener("pointercancel", endDrag);
      mapRef.current = null;
      map.remove();
    };
  }, [lng, lat]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => applyPalette(map, PALETTES[resolvedTheme]);
    if (styleReadyRef.current) {
      apply();
      return;
    }
    map.once("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [resolvedTheme]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: needs to re-fire on theme change
  useEffect(() => {
    const timeout = setTimeout(() => {
      const attribDetails =
        containerRef.current?.querySelector<HTMLDetailsElement>(
          "details.maplibregl-compact",
        );
      if (attribDetails?.open) {
        if (attribDetails.classList.contains("maplibregl-compact-show"))
          attribDetails.classList.remove("maplibregl-compact-show");
        attribDetails.open = false;
      }
    }, 4800);
    return () => clearTimeout(timeout);
  }, [resolvedTheme]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2.4, ease: "easeInOut" }}
    >
      <div
        ref={containerRef}
        className="h-[240px] w-full cursor-grab touch-pan-y select-none"
        role="img"
        aria-label="Slowly rotating 3D terrain map of where I am right now"
      />
    </motion.div>
  );
};
