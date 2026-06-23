export function Footer() {
  return (
    <footer className="border-t-4 border-ink mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-display font-bold text-ink">Carmen Zambrano</span>
        <span className="label text-muted font-normal normal-case tracking-normal">
          Social Communicator &amp; Journalist · Rotterdam, Netherlands
        </span>
        <div className="flex items-center gap-4">
          <a
            href="mailto:carmenmazambrano@gmail.com"
            className="label bg-accent text-inverse px-4 py-1.5 hover:opacity-90 transition-opacity"
          >
            Contact via Email
          </a>
          <span className="label text-dim font-normal normal-case tracking-normal">
            © {new Date().getFullYear()} carmenzambrano.nl
          </span>
        </div>
      </div>
    </footer>
  );
}
