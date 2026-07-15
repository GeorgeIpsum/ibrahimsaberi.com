"use client";

import mlcontour from "maplibre-contour";
import maplibregl from "maplibre-gl";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const RMap = dynamic(
  () => import("maplibre-react-components").then((mod) => mod.RMap),
  {
    ssr: false,
  },
);
const RSource = dynamic(
  () => import("maplibre-react-components").then((mod) => mod.RSource),
  {
    ssr: false,
  },
);
const RLayer = dynamic(
  () => import("maplibre-react-components").then((mod) => mod.RLayer),
  {
    ssr: false,
  },
);

export const LibreMap: React.FC<React.ComponentProps<typeof RMap>> = (
  props,
) => {
  const hasMounted = useRef(false);
  const [demSource, setDemSource] = useState<InstanceType<
    typeof mlcontour.DemSource
  > | null>(null);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const demSourceInstance = new mlcontour.DemSource({
      url: "https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png",
      encoding: "mapbox",
      maxzoom: 12,
      // offload contour line computation to a web worker
      worker: true,
      cacheSize: 100,
      timeoutMs: 10_000,
    });
    setDemSource(demSourceInstance);
    demSourceInstance.setupMaplibre(maplibregl);
  }, []);

  return (
    <div className="h-[200px] w-full">
      {!!demSource && (
        <RMap
          {...props}
          // mapStyle={`https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json`}
          mapStyle={{
            version: 8,
            glyphs:
              "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
            zoom: 12,
            sources: {
              hillshadeSource: {
                type: "raster-dem",
                tiles: [demSource.sharedDemProtocolUrl],
                tileSize: 512,
                maxzoom: 12,
              },
              contourSourceFeet: {
                type: "vector",
                tiles: [
                  demSource.contourProtocolUrl({
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
                maxzoom: 14,
              },
            },
            layers: [
              {
                id: "hills",
                type: "hillshade",
                source: "hillshadeSource",
                layout: { visibility: "visible" },
                paint: { "hillshade-exaggeration": 0.25 },
              },
              {
                id: "contours",
                type: "line",
                source: "contourSourceFeet",
                "source-layer": "contours",
                paint: {
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
                  "text-halo-color": "white",
                  "text-halo-width": 1,
                },
                layout: {
                  "symbol-placement": "line",
                  "text-size": 10,
                  "text-field": [
                    "concat",
                    ["number-format", ["get", "ele"], {}],
                    "'",
                  ],
                  "text-font": ["Noto Sans Bold"],
                },
              },
            ],
          }}
          minZoom={12}
          initialZoom={12}
          maxZoom={12}
          // {...{""}}
        ></RMap>
      )}
    </div>
  );
};
