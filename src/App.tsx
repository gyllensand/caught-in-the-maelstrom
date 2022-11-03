import { CSSProperties, Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Scene, { BORDER_COLOR, CAMERA_Z } from "./Scene";
import { Sampler } from "tone";

console.log(
  "%c * Computer Emotions * ",
  "color: #d80fe7; font-size: 14px; background-color: #000000;"
);

console.log(
  "%c http://www.computeremotions.com ",
  "font-size: 12px; background-color: #000000;"
);

const borderStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  position: "absolute",
  left: 0,
  top: 0,
  borderWidth: 12,
  borderStyle: "solid",
  pointerEvents: "none",
  zIndex: 1,
};

const baseUrl = `${process.env.PUBLIC_URL}/audio/`;

export interface Sample {
  index: number;
  sampler: Sampler;
}

export const CHORDS: Sample[] = [
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: `a3s.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 1,
    sampler: new Sampler({
      urls: {
        1: `a3s2.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 2,
    sampler: new Sampler({
      urls: {
        1: `c4.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 3,
    sampler: new Sampler({
      urls: {
        1: `d4s.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 4,
    sampler: new Sampler({
      urls: {
        1: `d4s2.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 5,
    sampler: new Sampler({
      urls: {
        1: `d4s2.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 6,
    sampler: new Sampler({
      urls: {
        1: `f4.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 7,
    sampler: new Sampler({
      urls: {
        1: `g3.mp3`,
      },
      baseUrl,
    }),
  },
  {
    index: 8,
    sampler: new Sampler({
      urls: {
        1: `g3s.mp3`,
      },
      baseUrl,
    }),
  },
];

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <>
      <div style={{ ...borderStyle, borderColor: BORDER_COLOR }}></div>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, CAMERA_Z], fov: 50, near: 1, far: 1000 }}
        dpr={window.devicePixelRatio}
      >
        <Suspense fallback={null}>
          <Scene canvasRef={canvasRef} />
        </Suspense>
      </Canvas>
    </>
  );
};

export default App;
