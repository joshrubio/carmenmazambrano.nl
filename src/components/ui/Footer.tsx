export function Footer() {
  return (
    <footer className="border-t-4 border-[#1A1A1A] mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs font-sans text-[#555]">
        <span className="font-serif font-bold text-[#1A1A1A]">Carmen Zambrano</span>
        <span>Social Communicator &amp; Journalist · Rotterdam, Netherlands</span>
        <span>© {new Date().getFullYear()} carmenzambrano.nl</span>
      </div>
    </footer>
  );
}
