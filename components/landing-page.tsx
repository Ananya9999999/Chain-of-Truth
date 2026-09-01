import { LandingNavbar } from "./landing-navbar";

export function LandingPage() {
  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes heroReveal {
          0% {
            opacity: 0;
            transform: translateY(50px);
            filter: blur(12px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes heroRevealSmall {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatingTitle {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes gridPulse {
          0%, 100% {
            opacity: 0.03;
          }

          50% {
            opacity: 0.10;
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.2;
          }

          50% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0.5;
          }
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes blink {
          0%, 45% {
            opacity: 1;
          }

          46%, 100% {
            opacity: 0;
          }
        }

        @keyframes statusPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.35;
            transform: scale(0.75);
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }

          20% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            transform: translateY(500%);
            opacity: 0;
          }
        }

        @keyframes alertPulse {
          0%, 100% {
            border-color: rgba(239, 68, 68, 0.25);
          }

          50% {
            border-color: rgba(239, 68, 68, 0.8);
          }
        }

        @keyframes nodePulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(124, 255, 107, 0);
          }

          50% {
            box-shadow: 0 0 25px rgba(124, 255, 107, 0.18);
          }
        }

        .hero-reveal {
          animation: heroReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-delay-1 {
          animation-delay: 0.15s;
        }

        .hero-delay-2 {
          animation-delay: 0.35s;
        }

        .hero-delay-3 {
          animation-delay: 0.6s;
        }

        .hero-delay-4 {
          animation-delay: 0.85s;
        }

        .hero-title {
          animation:
            heroReveal 1.3s cubic-bezier(0.16, 1, 0.3, 1) both,
            floatingTitle 7s ease-in-out 1.5s infinite;
        }

        .animated-grid {
          animation: gridPulse 5s ease-in-out infinite;
        }

        .animated-glow {
          animation: glowPulse 7s ease-in-out infinite;
        }

        .marquee-track {
          animation: marquee 28s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .cursor-blink {
          animation: blink 1s steps(1) infinite;
        }

        .status-pulse {
          animation: statusPulse 1.8s ease-in-out infinite;
        }

        .scan-box {
          position: relative;
          overflow: hidden;
        }

        .scan-box::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            #7cff6b,
            transparent
          );
          animation: scan 4s linear infinite;
          pointer-events: none;
        }

        .alert-box {
          animation: alertPulse 2s ease-in-out infinite;
        }

        .hash-node {
          animation: nodePulse 3s ease-in-out infinite;
        }

        .hash-node:nth-child(2) {
          animation-delay: 0.5s;
        }

        .hash-node:nth-child(3) {
          animation-delay: 1s;
        }

        .hash-node:nth-child(4) {
          animation-delay: 1.5s;
        }

        .premium-card {
          position: relative;
          overflow: hidden;
          transition:
            transform 500ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 400ms ease,
            background-color 400ms ease;
        }

        .premium-card::before {
          content: "";
          position: absolute;
          left: -100%;
          top: 0;
          width: 100%;
          height: 1px;
          background: #7cff6b;
          transition: left 600ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-card:hover {
          transform: translateY(-8px);
          border-color: rgba(124, 255, 107, 0.6);
          background-color: rgba(255,255,255,0.02);
        }

        .premium-card:hover::before {
          left: 100%;
        }

        .premium-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 300ms ease,
            color 300ms ease,
            background-color 300ms ease;
        }

        .premium-button:hover {
          transform: translateY(-4px);
        }

        .timeline-line {
          position: relative;
        }

        .timeline-line::before {
          content: "";
          position: absolute;
          left: 4px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.1);
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <main className="min-h-screen overflow-hidden bg-[#050505] text-white">

        <LandingNavbar />

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative min-h-screen px-6 pt-32 md:px-12 lg:px-20">

          {/* Animated grid */}

          <div className="animated-grid pointer-events-none absolute inset-0">

            <div
              className="h-full w-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />

          </div>


          {/* Green atmospheric glow */}

          <div className="animated-glow pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/5 blur-[120px]" />


          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col justify-center">

            <div className="hero-reveal hero-delay-1 font-mono text-sm text-[#7cff6b]">
              $ chain-of-truth --initialize
            </div>


            <h1 className="hero-title mt-8 font-black uppercase leading-[0.78] tracking-[-0.07em]">

              <span className="block text-[17vw] md:text-[12vw]">
                CHAIN
              </span>

              <span className="block text-[17vw] md:text-[12vw]">
                OF
              </span>

              <span className="block text-[17vw] md:text-[12vw]">
                TRUTH
                <span className="cursor-blink text-[#7cff6b]">
                  _
                </span>
              </span>

            </h1>


            <div className="hero-reveal hero-delay-3 mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

              <p className="max-w-xl font-mono text-sm leading-7 text-gray-400 md:text-base">
                AI-assisted evidence integrity &
                investigation system for police and judiciary.
              </p>


              <a
                href="#system"
                className="premium-button w-fit border border-white px-8 py-4 font-mono text-xs tracking-wider hover:bg-white hover:text-black"
              >
                ENTER SYSTEM →
              </a>

            </div>


            <div className="hero-reveal hero-delay-4 mt-20 grid border-t border-white/10 pt-5 font-mono text-[9px] text-gray-600 md:grid-cols-3">

              <span>
                CASE SYSTEM / ONLINE
              </span>

              <span className="hidden text-center md:block">
                EVIDENCE INTEGRITY / ACTIVE
              </span>

              <span className="mt-2 text-[#7cff6b] md:mt-0 md:text-right">
                ● HUMAN VERIFICATION REQUIRED
              </span>

            </div>

          </div>

        </section>


        {/* =====================================================
            MARQUEE
        ===================================================== */}

        <section className="overflow-hidden border-y border-white/10 py-6">

          <div className="marquee-track flex w-max">

            <div className="flex whitespace-nowrap font-mono text-xs text-gray-500 md:text-sm">

              {[
                "EVIDENCE",
                "VERIFIED",
                "AI-ASSISTED",
                "HUMAN-DECIDED",
                "AUDITABLE",
                "TAMPER-EVIDENT",
                "TRACEABLE",
                "EXPLAINABLE",
              ].map((item, index) => (
                <span key={index} className="mx-6">

                  {item}

                  <span className="ml-12 text-[#7cff6b]">
                    •
                  </span>

                </span>
              ))}


              {[
                "EVIDENCE",
                "VERIFIED",
                "AI-ASSISTED",
                "HUMAN-DECIDED",
                "AUDITABLE",
                "TAMPER-EVIDENT",
                "TRACEABLE",
                "EXPLAINABLE",
              ].map((item, index) => (
                <span key={`duplicate-${index}`} className="mx-6">

                  {item}

                  <span className="ml-12 text-[#7cff6b]">
                    •
                  </span>

                </span>
              ))}

            </div>

          </div>

        </section>


        {/* =====================================================
            PROBLEM
        ===================================================== */}

        <section
          id="problem"
          className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20"
        >

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-[#7cff6b]">
              01 / THE PROBLEM
            </div>


            <div className="mt-12 grid gap-16 lg:grid-cols-2">

              <h2 className="text-6xl font-black uppercase leading-[0.88] tracking-tight md:text-8xl">

                EVIDENCE
                <br />

                IS
                <br />

                SCATTERED
                <span className="text-[#7cff6b]">
                  .
                </span>

              </h2>


              <div className="flex flex-col justify-end">

                <p className="max-w-xl text-lg leading-8 text-gray-400">
                  A photo here. A witness statement there.
                  A forensic report weeks later.
                  Different officers. Different systems.
                  No single connected picture of what happened.
                </p>


                <p className="mt-8 max-w-xl font-mono text-xs leading-6 text-gray-600">
                  EXISTING SYSTEMS STORE RECORDS.
                  CHAIN OF TRUTH ADDS ACTIVE REASONING
                  ON TOP OF THEM.
                </p>

              </div>

            </div>


            {/* Evidence cards */}

            <div className="mt-24 grid grid-cols-2 gap-3 md:grid-cols-4">

              {[
                ["01", "PHOTO", "IMAGE"],
                ["02", "CCTV", "VIDEO"],
                ["03", "STATEMENT", "TEXT"],
                ["04", "FORENSICS", "REPORT"],
              ].map(([number, title, type]) => (

                <div
                  key={number}
                  className="premium-card group border border-white/10 p-6"
                >

                  <div className="flex justify-between font-mono text-[9px] text-gray-600">

                    <span>
                      EVIDENCE_{number}
                    </span>

                    <span>
                      {type}
                    </span>

                  </div>


                  <div className="mt-20 text-xl font-bold">
                    {title}
                  </div>


                  <div className="mt-6 h-px w-full bg-white/10 transition group-hover:bg-[#7cff6b]" />


                  <div className="mt-4 font-mono text-[9px] text-gray-600">
                    UNCONNECTED
                  </div>

                </div>

              ))}

            </div>

          </div>

        </section>


        {/* =====================================================
            SOLUTION
        ===================================================== */}

        <section
          id="features"
          className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20"
        >

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-[#7cff6b]">
              02 / THE SOLUTION
            </div>


            <h2 className="mt-12 max-w-5xl text-5xl font-black uppercase leading-[0.88] md:text-8xl">

              ONE CASE.
              <br />

              ONE TIMELINE.
              <br />

              ONE TRUTH
              <span className="text-[#7cff6b]">
                _
              </span>

            </h2>


            <div className="mt-24 grid gap-3 md:grid-cols-4">

              {[
                ["01", "EVIDENCE"],
                ["02", "HASH"],
                ["03", "AI ANALYSIS"],
                ["04", "HUMAN REVIEW"],
              ].map(([number, title], index) => (

                <div key={number} className="relative">

                  <div className="premium-card border border-white/10 p-7">

                    <div className="font-mono text-xs text-[#7cff6b]">
                      {number}
                    </div>

                    <div className="mt-14 font-bold">
                      {title}
                    </div>

                  </div>


                  {index !== 3 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden text-[#7cff6b] md:block">
                      →
                    </div>
                  )}

                </div>

              ))}

            </div>


            <p className="mt-16 max-w-2xl text-sm leading-7 text-gray-500">
              Every feature reads from and writes back to one shared,
              verified case timeline — making the investigation
              connected rather than a collection of disconnected tools.
            </p>

          </div>

        </section>


        {/* =====================================================
            WORKFLOW
        ===================================================== */}

        <section
          id="workflow"
          className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20"
        >

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-[#7cff6b]">
              03 / INVESTIGATION FLOW
            </div>


            <h2 className="mt-12 text-5xl font-black uppercase leading-[0.88] md:text-8xl">

              FROM
              <br />

              EVIDENCE
              <br />

              TO ACTION
              <span className="text-[#7cff6b]">
                .
              </span>

            </h2>


            <div className="mt-24">

              {[
                [
                  "01",
                  "COLLECT",
                  "Evidence is logged with timestamp, officer information, location and cryptographic fingerprint.",
                ],
                [
                  "02",
                  "PROTECT",
                  "SHA-256 hashing creates a tamper-evident record and links each entry to the previous one.",
                ],
                [
                  "03",
                  "UNDERSTAND",
                  "AI extracts who, what, when and where from incoming evidence.",
                ],
                [
                  "04",
                  "COMPARE",
                  "New evidence is compared against the existing case timeline.",
                ],
                [
                  "05",
                  "VERIFY",
                  "An officer confirms or dismisses AI findings before they become part of the verified record.",
                ],
              ].map(([number, title, description]) => (

                <div
                  key={number}
                  className="group grid gap-5 border-t border-white/10 py-10 md:grid-cols-[100px_250px_1fr] md:items-center"
                >

                  <div className="font-mono text-xs text-[#7cff6b]">
                    {number}
                  </div>


                  <div className="text-2xl font-bold transition group-hover:text-[#7cff6b]">
                    {title}
                  </div>


                  <div className="max-w-2xl text-sm leading-7 text-gray-500">
                    {description}
                  </div>

                </div>

              ))}

            </div>

          </div>

        </section>


        {/* =====================================================
            CORE SYSTEMS
        ===================================================== */}

        <section className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20">

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-[#7cff6b]">
              04 / CORE SYSTEMS
            </div>


            <h2 className="mt-12 text-5xl font-black uppercase leading-[0.88] md:text-8xl">

              THE
              <br />

              INVESTIGATION
              <br />

              LAYER
              <span className="text-[#7cff6b]">
                _
              </span>

            </h2>


            <div className="mt-24 grid gap-3 md:grid-cols-2">

              {[
                [
                  "01",
                  "TAMPER-PROOF EVIDENCE",
                  "Cryptographic hashing and chained records make unauthorized changes detectable.",
                ],
                [
                  "02",
                  "AI TIMELINE BUILDER",
                  "Evidence is organized by when events happened, not simply when files were uploaded.",
                ],
                [
                  "03",
                  "CONTRADICTION DETECTOR",
                  "Conflicting facts are surfaced with severity and confidence for human review.",
                ],
                [
                  "04",
                  "INVESTIGATION GUIDANCE",
                  "The AI suggests gaps and procedural next steps with links to the relevant rule or section.",
                ],
                [
                  "05",
                  "LOCATION ANALYSIS",
                  "A transparent geospatial scoring model helps prioritize investigative areas.",
                ],
                [
                  "06",
                  "CHARGESHEET CHECK",
                  "The final chargesheet can be compared against the verified evidence timeline.",
                ],
              ].map(([number, title, description]) => (

                <div
                  key={number}
                  className="premium-card border border-white/10 p-8"
                >

                  <div className="flex justify-between">

                    <span className="font-mono text-xs text-[#7cff6b]">
                      {number}
                    </span>

                    <span className="font-mono text-[9px] text-gray-700">
                      MODULE
                    </span>

                  </div>


                  <h3 className="mt-16 text-2xl font-bold">
                    {title}
                  </h3>


                  <p className="mt-5 max-w-lg text-sm leading-7 text-gray-500">
                    {description}
                  </p>


                  <div className="mt-10 font-mono text-[9px] text-gray-700 transition group-hover:text-[#7cff6b]">
                    ACCESS MODULE →
                  </div>

                </div>

              ))}

            </div>

          </div>

        </section>


        {/* =====================================================
            CONTRADICTION DETECTOR
        ===================================================== */}

        <section className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20">

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-red-400">
              05 / LIVE AI ALERT
            </div>


            <div className="mt-12 grid gap-16 lg:grid-cols-2">

              <div>

                <h2 className="text-5xl font-black uppercase leading-[0.88] md:text-7xl">

                  WHEN
                  <br />

                  FACTS
                  <br />

                  COLLIDE
                  <span className="text-red-400">
                    .
                  </span>

                </h2>


                <p className="mt-10 max-w-lg text-gray-500 leading-7">
                  Chain of Truth compares incoming evidence
                  against the existing timeline and surfaces
                  potential contradictions for human review.
                </p>

              </div>


              <div className="alert-box scan-box border border-red-500/30 bg-red-500/[0.02] p-8">

                <div className="flex items-start justify-between">

                  <div>

                    <div className="font-mono text-xs text-red-400">
                      ⚠ CONTRADICTION DETECTED
                    </div>

                    <div className="mt-4 text-xl font-bold">
                      Timeline conflict
                    </div>

                  </div>


                  <div className="text-right">

                    <div className="font-mono text-[8px] text-gray-600">
                      CONFIDENCE
                    </div>

                    <div className="mt-1 text-3xl font-black text-red-400">
                      92%
                    </div>

                  </div>

                </div>


                <div className="mt-10 grid gap-3 md:grid-cols-2">

                  <div className="border border-white/10 p-5">

                    <div className="font-mono text-[9px] text-gray-600">
                      SOURCE A
                    </div>

                    <div className="mt-5 font-bold">
                      Witness Statement
                    </div>

                    <div className="mt-2 font-mono text-sm text-red-400">
                      21:00
                    </div>

                  </div>


                  <div className="border border-white/10 p-5">

                    <div className="font-mono text-[9px] text-gray-600">
                      SOURCE B
                    </div>

                    <div className="mt-5 font-bold">
                      CCTV Metadata
                    </div>

                    <div className="mt-2 font-mono text-sm text-red-400">
                      21:17
                    </div>

                  </div>

                </div>


                <div className="mt-8 font-mono text-[9px] text-gray-600">
                  AI SUGGESTION — HUMAN REVIEW REQUIRED
                </div>


                <div className="mt-6 flex gap-3">

                  <button className="bg-[#7cff6b] px-6 py-3 font-mono text-[9px] text-black transition hover:scale-105">
                    CONFIRM
                  </button>

                  <button className="border border-white/20 px-6 py-3 font-mono text-[9px] transition hover:border-white">
                    DISMISS
                  </button>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            HASH CHAIN
        ===================================================== */}

        <section className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20">

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-[#7cff6b]">
              06 / EVIDENCE INTEGRITY
            </div>


            <h2 className="mt-12 text-5xl font-black uppercase leading-[0.88] md:text-8xl">

              EVERY FILE
              <br />

              LEAVES A
              <br />

              FINGERPRINT
              <span className="text-[#7cff6b]">
                .
              </span>

            </h2>


            <div className="mt-24 overflow-x-auto">

              <div className="flex min-w-[850px] items-center">

                {[
                  ["EV-001", "PHOTO"],
                  ["EV-002", "CCTV"],
                  ["EV-003", "STATEMENT"],
                  ["EV-004", "FORENSIC"],
                ].map(([id, type], index) => (

                  <div
                    key={id}
                    className="flex items-center"
                  >

                    <div className="hash-node w-48 border border-white/10 bg-[#050505] p-6">

                      <div className="font-mono text-[9px] text-[#7cff6b]">
                        {id}
                      </div>


                      <div className="mt-8 text-sm font-bold">
                        {type}
                      </div>


                      <div className="mt-6 truncate font-mono text-[8px] text-gray-600">
                        SHA256 / 8A3F91D2...
                      </div>


                      <div className="mt-3 font-mono text-[8px] text-gray-600">
                        ✓ VERIFIED
                      </div>

                    </div>


                    {index !== 3 && (
                      <div className="w-16 text-center font-mono text-[#7cff6b]">
                        →
                      </div>
                    )}

                  </div>

                ))}

              </div>

            </div>


            <p className="mt-10 max-w-2xl font-mono text-xs leading-6 text-gray-600">
              EACH ENTRY INCORPORATES THE PREVIOUS HASH.
              ALTERING A PAST ENTRY BREAKS THE CHAIN AFTER IT,
              MAKING TAMPERING DETECTABLE.
            </p>

          </div>

        </section>


        {/* =====================================================
            TIMELINE
        ===================================================== */}

        <section className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20">

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-[#7cff6b]">
              07 / CASE TIMELINE
            </div>


            <div className="mt-12 grid gap-16 lg:grid-cols-2">

              <div>

                <h2 className="text-5xl font-black uppercase leading-[0.88] md:text-7xl">

                  THE CASE
                  <br />

                  TELLS ITS
                  <br />

                  STORY
                  <span className="text-[#7cff6b]">
                    _
                  </span>

                </h2>


                <p className="mt-10 max-w-lg leading-7 text-gray-500">
                  Evidence is placed on a running timeline based
                  on when events happened, creating one connected
                  view of the investigation.
                </p>

              </div>


              <div className="timeline-line pl-8">

                {[
                  ["09:12", "Evidence collected", "VERIFIED"],
                  ["09:35", "Witness statement uploaded", "VERIFIED"],
                  ["10:02", "CCTV evidence uploaded", "VERIFIED"],
                  ["10:14", "Contradiction detected", "AI FLAG"],
                  ["10:21", "Officer review recorded", "CONFIRMED"],
                ].map(([time, title, status]) => (

                  <div
                    key={time}
                    className="relative border-t border-white/10 py-7"
                  >

                    <div className="absolute -left-[36px] top-8 h-2 w-2 rounded-full bg-[#7cff6b] shadow-[0_0_15px_rgba(124,255,107,0.6)]" />

                    <div className="font-mono text-xs text-gray-600">
                      {time}
                    </div>


                    <div className="mt-2 font-mono text-[9px] text-[#7cff6b]">
                      {status}
                    </div>


                    <div className="mt-2 font-bold">
                      {title}
                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            SECURITY
        ===================================================== */}

        <section className="border-b border-white/10 px-6 py-32 md:px-12 lg:px-20">

          <div className="mx-auto max-w-7xl">

            <div className="font-mono text-xs text-[#7cff6b]">
              08 / TRUST & SECURITY
            </div>


            <h2 className="mt-12 text-5xl font-black uppercase leading-[0.88] md:text-8xl">

              TRUST IS
              <br />

              PART OF THE
              <br />

              SYSTEM
              <span className="text-[#7cff6b]">
                .
              </span>

            </h2>


            <div className="mt-24 grid gap-3 md:grid-cols-2">

              {[
                [
                  "ROLE-BASED ACCESS",
                  "Investigation roles receive different levels of access to sensitive evidence.",
                ],
                [
                  "ENCRYPTION",
                  "Evidence and case data are protected during transmission and storage.",
                ],
                [
                  "AUDIT TRAIL",
                  "Important access and actions are recorded for accountability.",
                ],
                [
                  "DATA MINIMIZATION",
                  "Sensitive information is restricted to roles that need it.",
                ],
              ].map(([title, description]) => (

                <div
                  key={title}
                  className="premium-card border border-white/10 p-8"
                >

                  <div className="font-mono text-xs text-[#7cff6b]">
                    ✓ SYSTEM CONTROL
                  </div>


                  <h3 className="mt-10 text-xl font-bold">
                    {title}
                  </h3>


                  <p className="mt-5 text-sm leading-7 text-gray-500">
                    {description}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </section>


        {/* =====================================================
            HUMAN DECIDES
        ===================================================== */}

        <section className="relative overflow-hidden border-b border-white/10 px-6 py-40 md:px-12 lg:px-20">

          <div className="pointer-events-none absolute inset-0 opacity-20">

            <div
              className="h-full w-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(124,255,107,0.15) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(124,255,107,0.15) 1px, transparent 1px)
                `,
                backgroundSize: "80px 80px",
              }}
            />

          </div>


          <div className="relative mx-auto max-w-7xl text-center">

            <div className="font-mono text-xs text-[#7cff6b]">
              CORE DESIGN PRINCIPLE
            </div>


            <h2 className="mt-10 text-6xl font-black uppercase leading-[0.8] tracking-tight md:text-[10vw]">

              AI
              <br />

              ASSISTS
              <span className="text-[#7cff6b]">
                .
              </span>

            </h2>


            <h2 className="mt-8 text-6xl font-black uppercase leading-[0.8] tracking-tight text-gray-600 md:text-[10vw]">

              HUMANS
              <br />

              DECIDE
              <span className="text-white">
                .
              </span>

            </h2>


            <p className="mx-auto mt-14 max-w-2xl text-sm leading-7 text-gray-500">
              Every AI output remains a suggestion.
              Confidence, reasoning and source evidence
              are shown to the investigator, who must
              confirm or dismiss the result.
            </p>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section
          id="system"
          className="px-6 py-40 md:px-12 lg:px-20"
        >

          <div className="mx-auto max-w-7xl">

            <div className="scan-box border border-white/10 p-10 md:p-20">

              <div className="font-mono text-xs text-[#7cff6b]">
                $ system.ready()
              </div>


              <h2 className="mt-10 text-5xl font-black uppercase leading-[0.88] md:text-8xl">

                READY TO
                <br />

                INVESTIGATE
                <span className="text-[#7cff6b]">
                  ?
                </span>

              </h2>


              <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

                <p className="max-w-xl font-mono text-xs leading-6 text-gray-500">
                  CONNECT EVIDENCE.
                  FIND CONTRADICTIONS.
                  BUILD A VERIFIED CASE RECORD.
                </p>


                <a
                  href="/dashboard"
                  className="premium-button w-fit border border-[#7cff6b] px-8 py-4 font-mono text-xs text-[#7cff6b] hover:bg-[#7cff6b] hover:text-black"
                >
                  ENTER INVESTIGATION →
                </a>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="border-t border-white/10 px-6 py-10 md:px-12 lg:px-20">

          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 font-mono text-[9px] text-gray-600 md:flex-row">

            <span>
              CHAIN_OF_TRUTH_
            </span>

            <span>
              AI-ASSISTED EVIDENCE INTEGRITY SYSTEM
            </span>

            <span className="text-[#7cff6b]">
              ● SYSTEM ONLINE
            </span>

          </div>

        </footer>

      </main>
    </>
  );
}