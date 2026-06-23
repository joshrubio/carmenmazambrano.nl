import { formatDate } from "@/lib/articles";

interface Props {
  author: string;
  date: string;
  category?: string;
}

export function Byline({ author, date, category }: Props) {
  return (
    <div className="flex items-center gap-3 border-t border-b border-rule py-2 my-3">
      <span className="label text-ink">By {author}</span>
      <span className="text-rule select-none">|</span>
      {category && (
        <>
          <span className="label text-accent">{category}</span>
          <span className="text-rule select-none">|</span>
        </>
      )}
      <time dateTime={date} className="label text-dim font-normal normal-case tracking-wide">
        {formatDate(date)}
      </time>
    </div>
  );
}
