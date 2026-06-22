import Link from "next/link";

export function Masthead() {
  return (
    <header className="border-b-4 border-[#1A1A1A] pt-6 pb-3">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex justify-between items-center text-xs font-serif text-[#555] border-b border-[#ccc] pb-2 mb-3">
          <span>Rotterdam, Netherlands</span>
          <nav className="flex gap-6 uppercase tracking-widest text-[10px] font-sans">
            <Link href="/" className="hover:text-[#8B1A1A] transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-[#8B1A1A] transition-colors">
              About
            </Link>
            <Link href="/articles" className="hover:text-[#8B1A1A] transition-colors">
              Articles
            </Link>
            <Link href="/contact" className="hover:text-[#8B1A1A] transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        {/* Nameplate */}
        <div className="text-center py-2">
          <Link href="/" className="no-underline">
            <h1 className="font-serif text-5xl md:text-7xl font-black tracking-tight text-[#1A1A1A] leading-none">
              Carmen Zambrano
            </h1>
            <p className="font-serif text-sm tracking-[0.3em] uppercase text-[#555] mt-1">
              Social Communicator &amp; Journalist
            </p>
          </Link>
        </div>

        {/* Edition line */}
        <div className="flex justify-between items-center border-t border-[#1A1A1A] mt-3 pt-2 text-[10px] font-sans uppercase tracking-widest text-[#555]">
          <span>Est. 30 Years of Journalism</span>
          <span>carmenzambrano.nl</span>
        </div>
      </div>
    </header>
  );
}
