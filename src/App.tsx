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
  borderWidth: 15,
  borderStyle: "solid",
  pointerEvents: "none",
  zIndex: 1,
};

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
