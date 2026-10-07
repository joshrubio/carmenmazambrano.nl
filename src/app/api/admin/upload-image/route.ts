export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { ghPutBinary } from "@/lib/storage";

// Una imagen por petición (el cliente ya la comprime) para no superar
// el límite de 4,5 MB de cuerpo de las funciones de Vercel.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slug = formData.get("slug") as string | null;
    const name = formData.get("name") as string | null;

    if (!file || file.size === 0 || !slug || !name) {
      return NextResponse.json({ error: "Faltan datos de la imagen" }, { status: 400 });
    }
    if (!/^[a-z0-9-]+$/.test(slug) || !/^(cover|\d{1,3})$/.test(name)) {
      return NextResponse.json({ error: "Nombre de imagen no válido" }, { status: 400 });
    }

    const buffer = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = name === "cover" ? `${slug}-cover.webp` : `${slug}-${name}.webp`;
    await ghPutBinary(`public/images/${filename}`, buffer, `Add image ${filename}`);

    return NextResponse.json({ ok: true, src: `/images/${filename}` });
  } catch (err) {
    console.error("[upload-image]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
