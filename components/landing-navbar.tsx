export function LandingNavbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">

      <div className="flex items-center justify-between px-6 py-5 md:px-10">

        {/* LOGO */}

        <a
          href="#top"
          className="font-mono text-xs tracking-widest transition hover:text-[#7cff6b]"
        >
          CHAIN_OF_TRUTH_
        </a>


        {/* NAVIGATION */}

        <div className="hidden items-center gap-8 font-mono text-[10px] text-gray-400 md:flex">

          <a
            href="#problem"
            className="transition hover:text-[#7cff6b]"
          >
            01 / PROBLEM
          </a>

          <a
            href="#features"
            className="transition hover:text-[#7cff6b]"
          >
            02 / FEATURES
          </a>

          <a
            href="#workflow"
            className="transition hover:text-[#7cff6b]"
          >
            03 / WORKFLOW
          </a>

          <a
            href="#system"
            className="transition hover:text-[#7cff6b]"
          >
            04 / SYSTEM
          </a>

        </div>


        {/* STATUS */}

        <div className="font-mono text-[10px] text-[#7cff6b]">

          <span className="status-pulse mr-2 inline-block">
            ●
          </span>

          ONLINE

        </div>

      </div>

    </nav>
  );
}