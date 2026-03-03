"use client";

import { PadelPointBerlin } from "./PadelPointBerlin";

export default function Stage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ height: "90%" }}>
        <PadelPointBerlin />
      </div>
    </div>
  );
}
