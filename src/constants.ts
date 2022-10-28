import { pickRandomHashDecimalFromInterval } from "./utils";

export const PITCH = [0, 1];

export const CIRCLE_ROUGHNESS = [
  ...new Array(3).fill(null).map(() => ({
    roughness: 0.4,
    metalness: 0.8,
  })),
  {
    roughness: pickRandomHashDecimalFromInterval(0.2, 0.6),
    metalness: pickRandomHashDecimalFromInterval(2, 5),
  },
];

// "#A2CCB6",
// "#FCEEB5",
// "#EE786E",
// "#e0feff",
// "lightpink",
// "lightblue",

export const LIGHT_COLORS = [
  "",
  "#ffffff",
  "#c06e86",
  "#0f9ebe",
  "#eb3434",
  "#ffce00",
  "#ff48e6",
  "#30f8a0",
];

export const DARK_COLORS = [
  "#000000",
  "#000080",
  "#004932",
  "#eb3434",
  "#c06e86",
  "#d54c1a",
];

export const DARK_BG_COLORS = [
  "#000080",
  "#004932",
  "#c91414",
  "#aa336a",
  "#fd6c00",
];

export const LIGHT_BG_COLORS = [
  "#ffffff",
  "#FCEEB5",
  "#fff6d1",
  "#d8ffdd",
  "#f7c8d3",
];
