import React, { useCallback, useEffect, useState } from 'react';
import { Layers, Plus, Trash2, X, ZoomIn } from 'lucide-react';
import SideNav from '../components/SideNav';

interface Drawing {
  id: string;
  name: string;
  dataUrl: string;
  addedAt: string;
}

const STORAGE_KEY = 'handbook_fabrication_drawings';

const loadDrawings = (): Drawing[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Drawing[];
  } catch {
    return [];
  }
};

const saveDrawings = (drawings: Drawing[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drawings));
  } catch {
    // storage full or unavailable
  }
};

const HandbookFabricationScreen: React.FC = () => {
  const [drawings, setDrawings] = useState<Drawing[]>(loadDrawings);
  const [preview, setPreview] = useState<Drawing | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);

  useEffect(() => {
    saveDrawings(drawings);
  }, [drawings]);

  const handleAddFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const reads = files.map(
      (file) =>
        new Promise<Drawing>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              name: file.name.replace(/\.[^.]+$/, ''),
              dataUrl: reader.result as string,
              addedAt: new Date().toISOString(),
            });
          reader.onerror = () => reject(new Error('Read error'));
          reader.readAsDataURL(file);
        })
    );

    try {
      const next = await Promise.all(reads);
      setDrawings((prev) => [...next, ...prev]);
    } catch {
      // ignore
    }
    event.target.value = '';
  };

  const removeDrawing = (id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  const commitRename = useCallback(() => {
    if (!renaming) return;
    const name = renaming.value.trim();
    if (name) {
      setDrawings((prev) =>
        prev.map((d) => (d.id === renaming.id ? { ...d, name } : d))
      );
    }
    setRenaming(null);
  }, [renaming]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <div className="screen">
          <header className="screen-header">
            <div>
              <h1>
                <Layers className="icon" />
                Fabrication Handbook
              </h1>
              <p className="muted">9 Inch Differential drawings &amp; measurements</p>
            </div>
            <div className="header-actions">
              <label className="primary" style={{ cursor: 'pointer' }}>
                <Plus className="icon" />
                Add Drawing
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleAddFiles}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </header>

          {drawings.length === 0 ? (
            <div className="handbook-fab-empty">
              <Layers size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
              <p>No drawings yet.</p>
              <p className="muted">Click <strong>Add Drawing</strong> to upload images or PDFs.</p>
            </div>
          ) : (
            <div className="handbook-fab-grid">
              {drawings.map((d) => (
                <div className="handbook-fab-card" key={d.id}>
                  <div
                    className="handbook-fab-thumb-wrap"
                    onClick={() => setPreview(d)}
                    title="Click to view full size"
                  >
                    <img
                      src={d.dataUrl}
                      alt={d.name}
                      className="handbook-fab-thumb"
                    />
                    <div className="handbook-fab-zoom">
                      <ZoomIn size={20} />
                    </div>
                  </div>

                  <div className="handbook-fab-meta">
                    {renaming?.id === d.id ? (
                      <input
                        className="handbook-fab-rename"
                        value={renaming.value}
                        autoFocus
                        onChange={(e) =>
                          setRenaming({ id: d.id, value: e.target.value })
                        }
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') setRenaming(null);
                        }}
                      />
                    ) : (
                      <span
                        className="handbook-fab-name"
                        title="Click to rename"
                        onClick={() => setRenaming({ id: d.id, value: d.name })}
                      >
                        {d.name}
                      </span>
                    )}
                    <span className="handbook-fab-date">{formatDate(d.addedAt)}</span>
                  </div>

                  <button
                    type="button"
                    className="handbook-fab-remove"
                    title="Remove drawing"
                    onClick={() => removeDrawing(d.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Full-size preview lightbox */}
      {preview && (
        <div className="handbook-fab-lightbox" onClick={() => setPreview(null)}>
          <div className="handbook-fab-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <div className="handbook-fab-lightbox-header">
              <span>{preview.name}</span>
              <button
                type="button"
                className="handbook-fab-lightbox-close"
                onClick={() => setPreview(null)}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={preview.dataUrl}
              alt={preview.name}
              className="handbook-fab-lightbox-img"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HandbookFabricationScreen;
