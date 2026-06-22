interface Props {
  category: string;
}

export function CategoryBadge({ category }: Props) {
  return (
    <span className="inline-block bg-[#8B1A1A] text-[#FAF7F0] text-[10px] font-sans uppercase tracking-widest px-2 py-0.5">
      {category}
    </span>
  );
}
