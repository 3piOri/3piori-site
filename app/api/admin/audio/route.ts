import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { createR2PresignedUrl } from '@/lib/r2';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as { fileName?: string; contentType?: string } | null;
  const fileName = body?.fileName?.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!fileName || !/\.mp3$/i.test(fileName) || body?.contentType !== 'audio/mpeg') {
    return NextResponse.json({ error: 'Selecciona un archivo MP3 válido.' }, { status: 400 });
  }
  const publicUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL?.replace(/\/+$/, '');
  if (!publicUrl) {
    return NextResponse.json({ error: 'Configura NEXT_PUBLIC_AUDIO_BASE_URL para servir el audio.' }, { status: 500 });
  }
  try {
    const key = `sets/${crypto.randomUUID()}-${fileName}`;
    const uploadUrl = await createR2PresignedUrl('PUT', key);
    return NextResponse.json({ uploadUrl, audioUrl: `${publicUrl}/${key}`, audioKey: key });
  } catch (error) {
    console.error('Could not create R2 upload URL:', error);
    return NextResponse.json({ error: 'No se pudo preparar la subida a Cloudflare R2.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as { audioKey?: string } | null;
  if (!body?.audioKey || !/^sets\/[\w.-]+\.mp3$/i.test(body.audioKey)) {
    return NextResponse.json({ error: 'Clave de audio no válida.' }, { status: 400 });
  }
  try {
    const deleteUrl = await createR2PresignedUrl('DELETE', body.audioKey);
    const response = await fetch(deleteUrl, { method: 'DELETE' });
    if (!response.ok) throw new Error(`R2 respondió ${response.status}.`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Could not delete R2 audio:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el archivo de Cloudflare R2.' }, { status: 500 });
  }
}
