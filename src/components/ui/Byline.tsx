import { formatDate } from "@/lib/articles";

interface Props {
  author: string;
  date: string;
  category?: string;
}

export function Byline({ author, date, category }: Props) {
  return (
    <div className="flex items-center gap-3 text-xs font-sans text-[#555] border-t border-b border-[#ccc] py-2 my-3">
      <span className="font-semibold uppercase tracking-wide">{author}</span>
      <span className="text-[#ccc]">|</span>
      {category && (
        <>
          <span className="uppercase tracking-wide text-[#8B1A1A]">{category}</span>
          <span className="text-[#ccc]">|</span>
        </>
      )}
      <time dateTime={date}>{formatDate(date)}</time>
    </div>
  );
}
