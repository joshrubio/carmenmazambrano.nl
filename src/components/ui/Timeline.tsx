interface ExperienceItem {
  title: string;
  org: string;
  location: string;
  from: string;
  to: string;
  description: string;
}

interface Props {
  items: readonly ExperienceItem[];
}

export function Timeline({ items }: Props) {
  return (
    <div className="relative">
      {/* Vertical rule */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-rule md:left-[calc(28%-1px)]" />

      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-[28%_1fr] gap-0">

            {/* Date column */}
            <div className="md:pr-8 md:text-right pb-2 md:pb-0 pl-6 md:pl-0 pt-1">
              <p className="label text-accent font-normal normal-case tracking-wide">
                {item.from} — {item.to}
              </p>
              <p className="font-body text-xs text-muted mt-0.5">{item.location}</p>
            </div>

            {/* Dot */}
            <div className="absolute left-0 top-2 w-[15px] h-[15px] rounded-full border-2 border-accent bg-paper md:left-[calc(28%-7px)]" />

            {/* Content */}
            <div className="pl-8 pb-10 md:pl-8 border-l-0">
              <h3 className="font-display text-lg font-bold text-ink leading-snug">
                {item.title}
              </h3>
              <p className="font-body text-sm text-accent font-medium mt-0.5">
                {item.org}
              </p>
              <p className="font-body text-sm text-muted mt-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
