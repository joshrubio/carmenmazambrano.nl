import Link from "next/link";

export function Masthead() {
  return (
    <header className="border-b-4 border-ink pt-6 pb-3">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top bar — UI font */}
        <div className="flex justify-between items-center border-b border-rule pb-2 mb-3">
          <span className="label text-muted font-normal normal-case tracking-wide">
            Rotterdam, Netherlands
          </span>
          <nav className="flex gap-6 label text-muted">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <Link href="/about" className="hover:text-accent transition-colors">About</Link>
            <Link href="/articles" className="hover:text-accent transition-colors">Articles</Link>
            <a href="mailto:carmenmazambrano@gmail.com" className="hover:text-accent transition-colors">Contact</a>
          </nav>
        </div>

        {/* Nameplate — display font */}
        <div className="text-center py-2">
          <Link href="/" className="no-underline">
            <h1 className="font-display text-6xl md:text-8xl font-black tracking-tight text-ink leading-none">
              Carmen Zambrano
            </h1>
            <p className="font-display text-sm tracking-[0.3em] uppercase text-muted font-normal italic mt-1">
              Social Communicator &amp; Journalist
            </p>
          </Link>
        </div>

        {/* Edition line */}
        <div className="flex justify-between items-center border-t border-ink mt-3 pt-2">
          <span className="label text-muted font-normal normal-case tracking-wide">
            Est. 30 Years of Journalism
          </span>
          <span className="label text-muted font-normal normal-case tracking-wide">
            carmenzambrano.nl
          </span>
        </div>
      </div>
    </header>
  );
}
