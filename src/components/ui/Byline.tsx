import { formatDate } from "@/lib/articles";
import type { Locale } from "@/i18n/config";

interface Props {
  author: string;
  date: string;
  category?: string;
  lang: Locale;
  byLabel: string;
}

export function Byline({ author, date, category, lang, byLabel }: Props) {
  return (
    <div lang={lang} data-no-translate className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-b border-rule py-2 my-3">
      <span className="label text-ink">{byLabel} {author}</span>
      <span className="text-rule select-none">|</span>
      {category && (
        <>
          <span className="label text-accent">{category}</span>
          <span className="text-rule select-none">|</span>
        </>
      )}
      <time dateTime={date} className="label text-dim font-normal normal-case tracking-wide">
        {formatDate(date, lang)}
      </time>
    </div>
  );
}
