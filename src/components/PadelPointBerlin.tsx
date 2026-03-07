"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function PadelPointBerlin() {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      // ── Initial state ────────────────────────────────────────────────────────

      gsap.set("#ppb-bg", { opacity: 0 });

      gsap.set("#ppb-line-v", {
        strokeDasharray: 510,
        strokeDashoffset: 510,
        opacity: 0,
      });

      gsap.set("#ppb-line-h", {
        strokeDasharray: 330,
        strokeDashoffset: 330,
        opacity: 0,
      });

      gsap.set(["#ppb-P", "#ppb-A", "#ppb-D", "#ppb-E", "#ppb-L"], {
        opacity: 0,
        y: -70,
      });

      gsap.set("#ppb-B", { opacity: 0, x: -60 });

      gsap.set(["#ppb-R", "#ppb-L2", "#ppb-I", "#ppb-N"], {
        opacity: 0,
        x: 60,
      });

      gsap.set("#ppb-point-wrapper", { opacity: 0 });

      // ── Intro timeline ───────────────────────────────────────────────────────

      const tl = gsap.timeline();

      tl.to("#ppb-bg", { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);

      tl.to(
        "#ppb-line-v",
        { strokeDashoffset: 0, opacity: 1, duration: 0.8, ease: "power2.inOut" },
        0.3,
      );

      tl.to(
        "#ppb-line-h",
        { strokeDashoffset: 0, opacity: 1, duration: 0.8, ease: "power2.inOut" },
        0.6,
      );

      tl.to(
        ["#ppb-P", "#ppb-A", "#ppb-D", "#ppb-E", "#ppb-L"],
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.12, ease: "back.out(1.7)" },
        1.1,
      );

      tl.fromTo(
        "#ppb-point-wrapper",
        { opacity: 0 },
        { opacity: 1, ease: "bounce.out" },
        1.6,
      );

      tl.to(
        "#ppb-B",
        { x: 0, opacity: 1, duration: 0.45, ease: "back.out(1.7)" },
        2.5,
      );

      tl.to(
        ["#ppb-R", "#ppb-L2", "#ppb-I", "#ppb-N"],
        { x: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: "back.out(1.7)" },
        2.5,
      );

      tl.fromTo(
        "#ppb-ball-spin",
        { y: -250 },
        { y: 0, duration: 1.2, ease: "bounce.out" },
        3,
      );
    },
    { scope: svgRef },
  );

  return (
    <svg
      ref={svgRef}
      viewBox="-60 -60 520 520"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
    >
      <defs>
        <filter id="ppb-shadow" x="-10%" y="-15%" width="130%" height="150%">
          <feFlood floodOpacity="0.498039" floodColor="rgb(0,0,0)" result="flood" />
          <feGaussianBlur stdDeviation="3" in="SourceGraphic" result="blur" />
          <feOffset dx="6" dy="6" in="blur" result="offset" />
          <feComposite operator="in" in="flood" in2="offset" result="comp1" />
          <feComposite operator="over" in="SourceGraphic" in2="comp1" />
        </filter>
        <clipPath id="ppb-circle-clip">
          <circle cx="200" cy="200" r="250" />
        </clipPath>
        <filter id="ppb-outer-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="22" floodColor="rgb(0,0,0)" floodOpacity="0.7" />
        </filter>
      </defs>

      <circle cx="200" cy="200" r="250" fill="var(--surface)" filter="url(#ppb-outer-shadow)" />

      <g clipPath="url(#ppb-circle-clip)">
        <rect id="ppb-bg" fill="var(--surface)" x="-60" y="-60" width="520" height="520" />

        <path id="ppb-line-v" stroke="var(--accent)" strokeWidth="8.84488" fill="none" d="M 139.93335,-55 V 455" />
        <path id="ppb-line-h" stroke="var(--accent)" strokeWidth="8.84488" fill="none" d="M 139.93335,236.28330 H 470" />

        {/* PADEL vertical letters */}
        <g id="ppb-P">
          <text x="97.935455" y="56.445992" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">P</text>
        </g>
        <g id="ppb-A">
          <text x="97.935455" y="139.55319" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">A</text>
        </g>
        <g id="ppb-D">
          <text x="97.935455" y="222.6604" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">D</text>
        </g>
        <g id="ppb-E">
          <text x="97.935455" y="305.76758" textAnchor="middle" fill="var(--accent)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">E</text>
        </g>
        <g id="ppb-L">
          <text x="97.935455" y="388.87479" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">L</text>
        </g>

        {/* BERLIN horizontal letters */}
        <g id="ppb-B">
          <text x="24.524096" y="307.15271" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">B</text>
        </g>
        <g id="ppb-R">
          <text x="176.88731" y="305.76758" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">R</text>
        </g>
        <g id="ppb-L2">
          <text x="246.14331" y="305.76758" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">L</text>
        </g>
        <g id="ppb-I">
          <text x="301.5481" y="305.76758" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">I</text>
        </g>
        <g id="ppb-N">
          <text x="370.80408" y="305.76758" textAnchor="middle" fill="var(--text)"
            style={{ fontWeight: "bold", fontSize: "69.256px", fontFamily: "Arial, sans-serif", stroke: "var(--bg)", strokeWidth: "1.8" }}
            transform="scale(1.0033142,0.99669674)">N</text>
        </g>

        {/* Point logo */}
        <g id="ppb-point-wrapper">
          <g transform="matrix(1.572456,0,0,1.572456,-171.16837,-55.120228)" filter="url(#ppb-shadow)">
            <g transform="matrix(0.50661928,0,0,0.50327781,135.13362,29.905848)">
              <text
                style={{ fontSize: "53.3333px", fill: "var(--accent)", fillOpacity: 1, strokeWidth: "1.38511" }}
                x="270.5806" y="126.92186"
                transform="matrix(1.9804106,0,0,1.9804107,-266.73604,-59.422147)"
              >
                <tspan style={{ fontStyle: "normal", fontVariant: "normal", fontWeight: "bold", fontStretch: "normal", fontSize: "53.3333px", fontFamily: "Helvetica Neue, Arial, sans-serif" }}>
                  int
                </tspan>
              </text>
            </g>
            <g transform="matrix(0.50661928,0,0,0.50327781,132.8246,32.503499)">
              <g id="ppb-ball-spin">
                <circle cx="261" cy="160" r="25" fill="#dbff00" stroke="#b8d600" strokeWidth="2" />
                <path fill="none" stroke="#5a6600" strokeWidth="2" d="m 246,144 q 15,16 0,32 m 30,-32 q -15,16 0,32" />
              </g>
            </g>
            <text
              style={{ fontStyle: "normal", fontVariant: "normal", fontWeight: "bold", fontStretch: "normal", fontSize: "53.3333px", fontFamily: "Helvetica Neue, Arial, sans-serif", fill: "var(--accent)", fillOpacity: 1, stroke: "var(--accent)", strokeOpacity: 1 }}
              x="226.26746" y="126.25068"
            >p</text>
          </g>
        </g>
      </g>

      <circle cx="200" cy="200" r="250" fill="none" stroke="var(--accent)" strokeWidth="14" />
    </svg>
  );
}
