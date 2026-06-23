"use client";

import { useEffect, useRef, useState } from "react";

interface SkillItem {
  name: string;
  level?: string;
  pct: number;
}

interface Props {
  languages: readonly SkillItem[];
  tools: readonly SkillItem[];
}

function Bar({ name, level, pct }: SkillItem) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWidth(pct);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div ref={ref} className="mb-4">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-body text-sm text-ink">{name}</span>
        <span className="label text-accent font-normal normal-case tracking-wide">
          {level ?? `${pct}%`}
        </span>
      </div>
      <div className="h-[3px] bg-rule w-full">
        <div
          className="h-full bg-accent transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function SkillBars({ languages, tools }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
      {/* Languages */}
      <div>
        <p className="label text-accent mb-4">Languages</p>
        {languages.map((s) => (
          <Bar key={s.name} {...s} />
        ))}
      </div>

      {/* Tools & Skills */}
      <div>
        <p className="label text-accent mb-4">Tools &amp; Skills</p>
        {tools.map((s) => (
          <Bar key={s.name} {...s} />
        ))}
      </div>
    </div>
  );
}
