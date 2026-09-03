import type { GeoFeature } from "../types/satquery";

export const selectedRegion: GeoFeature = {
  id: "odisha-region",
  name: "Selected Area",
  type: "boundary",
  coordinates: [
    [20.58, 85.12],
    [20.85, 85.76],
    [20.68, 86.32],
    [20.27, 86.55],
    [19.89, 86.16],
    [19.77, 85.56],
    [20.06, 85.02],
  ],
};

export const overlayFeatures: GeoFeature[] = [
  { id: "veg-1", name: "Dense vegetation", type: "vegetation", coordinates: [[20.11, 85.18], [20.34, 85.3], [20.29, 85.73], [19.98, 85.63]] },
  { id: "veg-2", name: "Forest belt", type: "vegetation", coordinates: [[20.38, 85.72], [20.57, 86.0], [20.32, 86.22], [20.14, 85.96]] },
  { id: "water-1", name: "Reservoir cluster", type: "water", coordinates: [[20.43, 85.47], [20.54, 85.62], [20.44, 85.83], [20.27, 85.71]] },
  { id: "water-2", name: "River wetland", type: "water", coordinates: [[20.03, 86.03], [20.18, 86.22], [20.05, 86.39], [19.9, 86.19]] },
  { id: "built-1", name: "Built-up zone", type: "built", coordinates: [[20.26, 85.73], [20.43, 85.87], [20.31, 86.07], [20.12, 85.92]] },
  { id: "built-2", name: "Urban fringe", type: "built", coordinates: [[20.49, 86.05], [20.64, 86.18], [20.52, 86.38], [20.35, 86.25]] },
  { id: "loss-1", name: "Vegetation decrease", type: "decrease", coordinates: [[20.08, 85.77], [20.24, 85.9], [20.15, 86.11], [19.96, 85.98]] },
  { id: "loss-2", name: "Cleared patch", type: "decrease", coordinates: [[20.42, 86.11], [20.58, 86.28], [20.43, 86.45], [20.26, 86.29]] },
  { id: "growth-1", name: "Construction increase", type: "increase", coordinates: [[20.56, 85.58], [20.72, 85.76], [20.61, 85.96], [20.41, 85.81]] },
];
