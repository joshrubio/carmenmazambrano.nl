interface Props {
  category: string;
}

export function CategoryBadge({ category }: Props) {
  return (
    <span className="inline-block bg-accent text-inverse label px-2 py-0.5">
      {category}
    </span>
  );
}
