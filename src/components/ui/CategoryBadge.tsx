interface Props {
  label: string;
}

export function CategoryBadge({ label }: Props) {
  return (
    <span className="inline-block bg-accent text-inverse label px-2 py-0.5">
      {label}
    </span>
  );
}
