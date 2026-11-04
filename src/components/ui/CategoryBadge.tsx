interface Props {
  label: string;
}

// Etiqueta de categoría: píldora con el burdeos de la marca en tono suave
export function CategoryBadge({ label }: Props) {
  return (
    <span className="inline-block text-accent bg-accent/10 label px-3 py-1 rounded-full">
      {label}
    </span>
  );
}
