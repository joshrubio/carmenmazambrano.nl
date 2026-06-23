export function Footer() {
  return (
    <footer className="border-t-4 border-ink mt-12">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">

        {/* Main row: name + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <p className="font-display text-3xl font-black text-ink leading-none">
              Carmen Zambrano
            </p>
            <p className="font-display text-sm italic text-muted font-normal mt-1">
              Social Communicator &amp; Journalist · Rotterdam, Netherlands
            </p>
          </div>
          <a
            href="mailto:carmenmazambrano@gmail.com"
            className="label bg-accent text-inverse px-6 py-3 hover:opacity-90 transition-opacity whitespace-nowrap self-start sm:self-auto"
          >
            Contact via Email
          </a>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-rule pt-3">
          <p className="label text-dim font-normal normal-case tracking-normal">
            © {new Date().getFullYear()} carmenzambrano.nl
          </p>
        </div>

      </div>
    </footer>
  );
}
