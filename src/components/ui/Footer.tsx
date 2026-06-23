export function Footer() {
  return (
    <footer className="border-t-4 border-ink mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-2 text-dim">
        <span className="font-display font-bold text-ink">Carmen Zambrano</span>
        <span className="label text-muted font-normal normal-case tracking-normal">
          Social Communicator &amp; Journalist · Rotterdam, Netherlands
        </span>
        <span className="label text-dim font-normal normal-case tracking-normal">
          © {new Date().getFullYear()} carmenzambrano.nl
        </span>
      </div>
    </footer>
  );
}
