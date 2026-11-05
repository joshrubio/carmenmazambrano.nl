import { SubscribeForm } from "./SubscribeForm";

interface Props {
  label: string;
  title: string;
  text: string;
  source: "footer" | "page";
  headingId: string;
  as?: "h1" | "h2";
}

// Bloque burdeos de suscripción: título a un lado y formulario al otro, con una "N" de fondo.
export function NewsletterCard({ label, title, text, source, headingId, as: Heading = "h2" }: Props) {
  return (
    <div className="relative overflow-hidden bg-accent text-inverse shadow-soft px-6 py-8 sm:px-10 sm:py-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-6 -bottom-16 font-display font-black text-[16rem] leading-none text-white/[0.06]"
      >
        N
      </span>
      <div className="relative md:col-span-6">
        <span className="label text-inverse/80">{label}</span>
        <Heading id={headingId} className="font-display text-3xl sm:text-4xl font-black leading-[1.05] mt-2">
          {title}
        </Heading>
        <p className="font-body text-inverse/80 mt-3 text-sm sm:text-base">{text}</p>
      </div>
      <div className="relative md:col-span-6">
        <SubscribeForm source={source} tone="accent" />
      </div>
    </div>
  );
}
