'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { MusicSet, SiteSettings } from '@/lib/sets';
import { defaultSettings } from '@/lib/sets';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type SetDraft = {
  id: string | null;
  title: string;
  subtitle: string;
  published_at: string;
  duration_label: string;
  genre: string;
  cover_url: string;
  cover_path: string;
  audio_url: string;
  audio_key: string;
  featured: boolean;
  published: boolean;
};

const emptyDraft: SetDraft = {
  id: null,
  title: '',
  subtitle: '',
  published_at: new Date().toISOString().slice(0, 10),
  duration_label: '',
  genre: '',
  cover_url: '/covers/orion-001.svg',
  cover_path: '',
  audio_url: '',
  audio_key: '',
  featured: false,
  published: false,
};

function messageOf(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

function safeFileName(name: string) {
  return name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminPanel() {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sets, setSets] = useState<MusicSet[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [draft, setDraft] = useState<SetDraft>(emptyDraft);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [artistFile, setArtistFile] = useState<File | null>(null);
  const [artistPreview, setArtistPreview] = useState('');
  const [removeAudio, setRemoveAudio] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) {
        setAuthorized(false);
        setUserEmail('');
        return;
      }
      setUserEmail(user.email);
      const { data: isAdmin, error: roleError } = await supabase.rpc('is_site_admin');
      if (roleError) throw roleError;
      if (!isAdmin) {
        setAuthorized(false);
        setErrorMessage('Esta cuenta no tiene permisos de administración. Añade su correo en public.site_admins.');
        return;
      }
      setAuthorized(true);
      const [setsResult, settingsResult] = await Promise.all([
        supabase.from('sets').select('*').order('published_at', { ascending: false }),
        supabase.from('site_settings').select('*').eq('id', true).maybeSingle(),
      ]);
      if (setsResult.error) throw setsResult.error;
      if (settingsResult.error) throw settingsResult.error;
      setSets((setsResult.data || []) as MusicSet[]);
      if (settingsResult.data) setSettings({ ...defaultSettings, ...settingsResult.data });
    } catch (error) {
      setAuthorized(false);
      setErrorMessage(messageOf(error));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ error }) => {
      if (error && active) {
        setErrorMessage(error.message);
        setLoading(false);
      } else if (active) {
        void loadData();
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (active) void loadData();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadData, supabase]);

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  useEffect(() => () => {
    if (artistPreview) URL.revokeObjectURL(artistPreview);
  }, [artistPreview]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage('');
    setNotice('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMessage(error.message);
    else {
      setPassword('');
      await loadData();
    }
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setErrorMessage(error.message);
    setAuthorized(false);
    setUserEmail('');
    setSets([]);
    setBusy(false);
  }

  async function uploadCover(file: File) {
    if (!file.type.startsWith('image/')) throw new Error('Elige un archivo de imagen válido.');
    const path = `sets/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from('covers').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('covers').getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  async function uploadArtistImage(file: File) {
    if (!file.type.startsWith('image/')) throw new Error('Elige un archivo de imagen válido.');
    const path = `artist/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from('covers').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('covers').getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  async function requestAudioUpload(file: File) {
    if (!/\.mp3$/i.test(file.name)) throw new Error('Solo se pueden subir archivos MP3.');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');
    const response = await fetch('/api/admin/audio', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: 'audio/mpeg' }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo preparar la subida.');
    const uploadResponse = await fetch(result.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'audio/mpeg' },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error(`Cloudflare R2 rechazó la subida (${uploadResponse.status}).`);
    return { url: result.audioUrl as string, key: result.audioKey as string };
  }

  async function deleteAudio(key: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');
    const response = await fetch('/api/admin/audio', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioKey: key }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo eliminar el archivo de audio.');
  }

  function startNewSet() {
    setDraft({ ...emptyDraft, published_at: new Date().toISOString().slice(0, 10) });
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview('');
    setRemoveAudio(false);
    setRemoveCover(false);
    setNotice('');
    setErrorMessage('');
  }

  function editSet(set: MusicSet) {
    setDraft({
      id: set.id,
      title: set.title,
      subtitle: set.subtitle || '',
      published_at: set.published_at,
      duration_label: set.duration_label,
      genre: set.genre,
      cover_url: set.cover_url,
      cover_path: set.cover_path || '',
      audio_url: set.audio_url,
      audio_key: set.audio_key || '',
      featured: Boolean(set.featured),
      published: Boolean(set.published),
    });
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview('');
    setRemoveAudio(false);
    setRemoveCover(false);
    setNotice('');
    setErrorMessage('');
    document.getElementById('set-editor')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function saveSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setErrorMessage('');
    let uploadedAudioKey = '';
    let uploadedCoverPath = '';
    let failureMessage = '';
    let databaseSaved = false;
    try {
      if (!draft.title.trim() || !draft.genre.trim() || !draft.duration_label.trim()) {
        throw new Error('Completa el título, género y duración.');
      }
      let next = { ...draft };
      if (audioFile) {
        const uploaded = await requestAudioUpload(audioFile);
        next.audio_url = uploaded.url;
        next.audio_key = uploaded.key;
        uploadedAudioKey = uploaded.key;
      } else if (removeAudio) {
        next.audio_url = '';
        next.audio_key = '';
      }
      if (coverFile) {
        const uploaded = await uploadCover(coverFile);
        next.cover_url = uploaded.url;
        next.cover_path = uploaded.path;
        uploadedCoverPath = uploaded.path;
      } else if (removeCover) {
        next.cover_url = '/covers/orion-001.svg';
        next.cover_path = '';
      }

      const previous = draft.id ? sets.find((set) => set.id === draft.id) : undefined;
      const id = draft.id || `${safeFileName(draft.title.toLowerCase()).slice(0, 50) || 'session'}-${Date.now()}`;
      const { error } = await supabase.from('sets').upsert({
        ...next,
        id,
        title: next.title.trim(),
        subtitle: next.subtitle.trim(),
        genre: next.genre.trim(),
        cover_path: next.cover_path || null,
        audio_key: next.audio_key || null,
      });
      if (error) throw error;
      databaseSaved = true;

      if (previous?.audio_key && previous.audio_key !== next.audio_key) await deleteAudio(previous.audio_key);
      if (previous?.cover_path && previous.cover_path !== next.cover_path) {
        const { error: storageError } = await supabase.storage.from('covers').remove([previous.cover_path]);
        if (storageError) throw storageError;
      }
      setNotice('Sesión guardada correctamente.');
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview('');
      setRemoveAudio(false);
      setRemoveCover(false);
      await loadData();
      const saved = sets.find((set) => set.id === id);
      if (!saved) setDraft({ ...next, id });
    } catch (error) {
      failureMessage = messageOf(error);
      if (!databaseSaved && uploadedAudioKey) {
        try { await deleteAudio(uploadedAudioKey); } catch (cleanupError) {
          failureMessage = `${failureMessage} También falló la limpieza del audio subido: ${messageOf(cleanupError)}`;
        }
      }
      if (!databaseSaved && uploadedCoverPath) {
        const { error: cleanupError } = await supabase.storage.from('covers').remove([uploadedCoverPath]);
        if (cleanupError) failureMessage = `${failureMessage} También falló la limpieza de la portada: ${cleanupError.message}`;
      }
      if (databaseSaved) failureMessage = `La sesión se guardó, pero falló la limpieza del archivo anterior: ${failureMessage}`;
      setErrorMessage(failureMessage);
    } finally {
      setBusy(false);
    }
  }

  async function removeSet(set: MusicSet) {
    if (!window.confirm(`¿Eliminar la sesión «${set.title}»? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      const { error } = await supabase.from('sets').delete().eq('id', set.id);
      if (error) throw error;
      if (set.audio_key) await deleteAudio(set.audio_key);
      if (set.cover_path) {
        const { error: storageError } = await supabase.storage.from('covers').remove([set.cover_path]);
        if (storageError) throw storageError;
      }
      if (draft.id === set.id) startNewSet();
      setNotice('Sesión eliminada.');
      await loadData();
    } catch (error) {
      setErrorMessage(messageOf(error));
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage('');
    setNotice('');
    let uploadedPath = '';
    let databaseSaved = false;
    let failureMessage = '';
    try {
      let nextSettings = { ...settings };
      if (artistFile) {
        const image = await uploadArtistImage(artistFile);
        nextSettings.artist_image_path = image.path;
        nextSettings.artist_image_url = image.url;
        uploadedPath = image.path;
      }
      const { error } = await supabase.from('site_settings').upsert({
        ...nextSettings,
        id: true,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      databaseSaved = true;
      setSettings(nextSettings);
      setArtistFile(null);
      setArtistPreview('');
      if (artistFile && settings.artist_image_path) {
        const { error: storageError } = await supabase.storage.from('covers').remove([settings.artist_image_path]);
        if (storageError) throw storageError;
      }
      setNotice('Información general guardada correctamente.');
    } catch (error) {
      failureMessage = messageOf(error);
      if (!databaseSaved && uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from('covers').remove([uploadedPath]);
        if (cleanupError) failureMessage = `${failureMessage} También falló la limpieza de la imagen: ${cleanupError.message}`;
      }
      if (databaseSaved) failureMessage = `La información se guardó, pero falló la limpieza de la fotografía anterior: ${failureMessage}`;
      setErrorMessage(failureMessage);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="admin-shell"><p className="admin-loading">Cargando panel…</p></main>;

  if (!authorized) {
    return <main className="admin-shell">
      <a className="admin-brand" href="/">3<span>π</span> Ori <small>ADMIN</small></a>
      <section className="admin-login">
        <span className="admin-eyebrow">ACCESO PRIVADO</span>
        <h1>Administración</h1>
        <p>Inicia sesión con la cuenta autorizada para gestionar sesiones e información del sitio.</p>
        <form onSubmit={signIn}>
          <label>Correo electrónico<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Contraseña<div className="admin-password-field">
            <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className="admin-password-toggle" type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((visible) => !visible)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {showPassword
                  ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 9 5 9 7a8.6 8.6 0 01-2.1 3.2M6.2 6.2C3.9 7.7 2 10.2 2 12c0 2 4 7 10 7a10.7 10.7 0 004.1-.8" /></>
                  : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>}
              </svg>
            </button>
          </div></label>
          <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</button>
        </form>
        {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}
        <a className="admin-back" href="/">← Volver al sitio</a>
      </section>
    </main>;
  }

  return <main className="admin-shell admin-dashboard">
    <header className="admin-header">
      <a className="admin-brand" href="/">3<span>π</span> Ori <small>ADMIN</small></a>
      <div><span className="admin-user">{userEmail}</span><button className="admin-quiet-button" onClick={signOut} disabled={busy}>Cerrar sesión</button></div>
    </header>
    <div className="admin-main">
      <div className="admin-title-row"><div><span className="admin-eyebrow">PANEL PRIVADO</span><h1>Administración</h1><p>Gestiona las sesiones y la información pública de 3π Ori.</p></div><a className="admin-preview-link" href="/" target="_blank" rel="noreferrer">Ver sitio ↗</a></div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}

      <section className="admin-section">
        <div className="admin-section-heading"><div><span className="admin-eyebrow">BIBLIOTECA</span><h2>Sesiones <span>({sets.length})</span></h2></div><button className="admin-primary" onClick={startNewSet}>＋ Nueva sesión</button></div>
        {sets.length ? <div className="admin-set-list">{sets.map((set) => <article className="admin-set-row" key={set.id}>
          <img src={set.cover_url} alt="" />
          <div className="admin-set-copy"><strong>{set.title}</strong><span>{set.genre} · {set.duration_label}</span></div>
          <span className={`admin-status ${set.published ? 'is-published' : ''}`}>{set.published ? 'PUBLICADA' : 'OCULTA'}</span>
          {set.featured && <span className="admin-featured-tag">DESTACADA</span>}
          <button className="admin-quiet-button" onClick={() => editSet(set)}>Editar</button>
          <button className="admin-delete-button" onClick={() => void removeSet(set)} disabled={busy}>Eliminar</button>
        </article>)}</div> : <p className="admin-empty">Aún no hay sesiones guardadas.</p>}

        <form className="admin-form admin-set-form" id="set-editor" onSubmit={saveSet}>
          <div className="admin-form-heading"><h3>{draft.id ? 'Editar sesión' : 'Crear sesión'}</h3>{draft.id && <button className="admin-quiet-button" type="button" onClick={startNewSet}>Nueva sesión</button>}</div>
          <div className="admin-fields">
            <label>Título<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label>Género<input required value={draft.genre} onChange={(event) => setDraft({ ...draft, genre: event.target.value })} placeholder="Electronic mix" /></label>
            <label className="admin-field-wide">Descripción<textarea rows={3} value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} /></label>
            <label>Fecha de publicación<input required type="date" value={draft.published_at} onChange={(event) => setDraft({ ...draft, published_at: event.target.value })} /></label>
            <label>Duración<input required value={draft.duration_label} onChange={(event) => setDraft({ ...draft, duration_label: event.target.value })} placeholder="01:00:00" /></label>
            <label className="admin-field-wide">Audio MP3<input type="file" accept=".mp3,audio/mpeg" onChange={(event) => { setAudioFile(event.target.files?.[0] || null); if (event.target.files?.[0]) setRemoveAudio(false); }} /><small>Se sube a Cloudflare R2; reemplazar un archivo elimina el anterior al guardar.</small></label>
            {draft.audio_url && <div className="admin-current-file admin-field-wide"><a href={draft.audio_url} target="_blank" rel="noreferrer">Escuchar audio actual ↗</a><label className="admin-check"><input type="checkbox" checked={removeAudio} onChange={(event) => setRemoveAudio(event.target.checked)} /> Quitar audio de la sesión</label></div>}
            <label className="admin-field-wide">Portada<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0] || null; setCoverFile(file); setCoverPreview(file ? URL.createObjectURL(file) : ''); if (file) setRemoveCover(false); }} /><small>JPG, PNG, WebP o AVIF. Máximo 10 MB.</small></label>
            <div className="admin-cover-preview admin-field-wide"><img src={coverPreview || draft.cover_url} alt="Vista previa de portada" />{draft.cover_path && <label className="admin-check"><input type="checkbox" checked={removeCover} onChange={(event) => setRemoveCover(event.target.checked)} /> Quitar portada personalizada</label>}</div>
            <label className="admin-check"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /> Destacar sesión</label>
            <label className="admin-check"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Publicar sesión</label>
          </div>
          <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar sesión'}</button>
        </form>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading"><div><span className="admin-eyebrow">PERFIL Y CONTACTO</span><h2>Información general</h2></div></div>
        <form className="admin-form" onSubmit={saveSettings}>
          <div className="admin-fields">
            <label className="admin-field-wide">Biografía<textarea rows={5} value={settings.bio} onChange={(event) => setSettings({ ...settings, bio: event.target.value })} /></label>
            <label>Correo de contacto<input type="email" required value={settings.contact_email} onChange={(event) => setSettings({ ...settings, contact_email: event.target.value })} /></label>
            <label>Instagram<input type="url" value={settings.instagram_url} onChange={(event) => setSettings({ ...settings, instagram_url: event.target.value })} placeholder="https://instagram.com/…" /></label>
            <label>SoundCloud<input type="url" value={settings.soundcloud_url} onChange={(event) => setSettings({ ...settings, soundcloud_url: event.target.value })} placeholder="https://soundcloud.com/…" /></label>
            <label>Mixcloud<input type="url" value={settings.mixcloud_url} onChange={(event) => setSettings({ ...settings, mixcloud_url: event.target.value })} placeholder="https://mixcloud.com/…" /></label>
            <label className="admin-field-wide">Fotografía principal<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0] || null; setArtistFile(file); setArtistPreview(file ? URL.createObjectURL(file) : ''); }} /><small>JPG, PNG, WebP o AVIF. Máximo 10 MB.</small></label>
            {(artistPreview || settings.artist_image_url) && <div className="admin-artist-preview admin-field-wide"><img src={artistPreview || settings.artist_image_url} alt="Vista previa de imagen principal" /></div>}
          </div>
          <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar información'}</button>
        </form>
      </section>
    </div>
  </main>;
}
