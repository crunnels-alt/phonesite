'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './admin.module.css';

type ContentType = 'photos' | 'projects' | 'writings';

interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  location: string;
  date: string;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  tech: string;
  year: string;
  status: string;
}

interface Writing {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  date: string;
  category: string;
}

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState<ContentType>('projects');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project | Writing | Photo>>({});

  // Create states
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<Project | Writing>>({});

  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTextarea, setActiveTextarea] = useState<'create' | 'edit' | null>(null);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/${activeTab}`);
      const data = await response.json();
      if (data.success) {
        if (activeTab === 'photos') setPhotos(data.photos);
        else if (activeTab === 'projects') setProjects(data.projects);
        else if (activeTab === 'writings') setWritings(data.writings);
      }
    } catch (error) {
      console.error(`Error loading ${activeTab}:`, error);
      setMessage({ type: 'error', text: `Failed to load ${activeTab}` });
    }
    setIsLoading(false);
  }, [activeTab]);

  useEffect(() => {
    loadContent();
    setEditingId(null);
    setIsCreating(false);
  }, [loadContent]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${activeTab}?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Deleted successfully' });
        loadContent();
      } else {
        setMessage({ type: 'error', text: data.error || 'Delete failed' });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage({ type: 'error', text: 'Delete failed' });
    }
  };

  const handleEdit = (item: Project | Writing | Photo) => {
    setEditingId(item.id);
    setEditForm(item);
    setIsCreating(false);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Updated successfully' });
        setEditingId(null);
        setEditForm({});
        loadContent();
      } else {
        setMessage({ type: 'error', text: data.error || 'Update failed' });
      }
    } catch (error) {
      console.error('Error updating:', error);
      setMessage({ type: 'error', text: 'Update failed' });
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`/api/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Created successfully' });
        setIsCreating(false);
        setCreateForm({});
        loadContent();
      } else {
        setMessage({ type: 'error', text: data.error || 'Create failed' });
      }
    } catch (error) {
      console.error('Error creating:', error);
      setMessage({ type: 'error', text: 'Create failed' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const markdown = `![](${data.url})`;

        // Insert into the appropriate form's excerpt
        if (activeTextarea === 'create') {
          const currentExcerpt = (createForm as Partial<Writing>).excerpt || '';
          setCreateForm({ ...createForm, excerpt: currentExcerpt + markdown });
        } else if (activeTextarea === 'edit') {
          const currentExcerpt = (editForm as Partial<Writing>).excerpt || '';
          setEditForm({ ...editForm, excerpt: currentExcerpt + markdown });
        }

        setMessage({ type: 'success', text: 'Image uploaded! Markdown inserted.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (error) {
      console.error('Error uploading:', error);
      setMessage({ type: 'error', text: 'Upload failed' });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderPhotoForm = (form: Partial<Photo>, setForm: (f: Partial<Photo>) => void, onSave: () => void, onCancel: () => void, photoUrl?: string) => (
    <div className={styles.formBox}>
      {photoUrl && (
        <img src={photoUrl} alt="Preview" className={styles.imagePreview} />
      )}
      <div>
        <label className={styles.label}>Title</label>
        <input
          className={styles.input}
          value={form.title || ''}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Photo title"
        />
      </div>
      <div>
        <label className={styles.label}>Description</label>
        <textarea
          className={styles.textarea}
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Caption or description for the photo"
        />
      </div>
      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label}>Location</label>
          <input
            className={styles.input}
            value={form.location || ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Where was this taken?"
          />
        </div>
        <div>
          <label className={styles.label}>Date</label>
          <input
            className={styles.input}
            value={form.date || ''}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            placeholder="2024-01-15"
          />
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button onClick={onSave} className={`type-sans ${styles.buttonPrimary}`}>
          Save
        </button>
        <button onClick={onCancel} className={`type-sans ${styles.button}`}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderPhotosList = () => (
    <div className={styles.listGrid}>
      {photos.length === 0 ? (
        <div className={`type-serif-italic ${styles.emptyState}`}>No photos found</div>
      ) : (
        photos.map((photo) => (
          <div key={photo.id}>
            {editingId === photo.id ? (
              renderPhotoForm(
                editForm as Partial<Photo>,
                (f) => setEditForm(f),
                handleSaveEdit,
                () => { setEditingId(null); setEditForm({}); },
                photo.url
              )
            ) : (
              <div className={styles.listItemWithImage}>
                <img src={photo.url} alt={photo.title} className={styles.listItemImage} />
                <div>
                  <div className={styles.listItemTitle}>{photo.title}</div>
                  {photo.description && (
                    <div className={styles.listItemBody}>{photo.description}</div>
                  )}
                  <div className={`type-sans ${styles.listItemMeta}`}>
                    {photo.location && `${photo.location} · `}{photo.date}
                  </div>
                </div>
                <button onClick={() => handleEdit(photo)} className={`type-sans ${styles.button}`}>
                  Edit
                </button>
                <button onClick={() => handleDelete(photo.id)} className={`type-sans ${styles.buttonDanger}`}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderProjectForm = (form: Partial<Project>, setForm: (f: Partial<Project>) => void, onSave: () => void, onCancel: () => void) => (
    <div className={styles.formBox}>
      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label}>Title *</label>
          <input
            className={styles.input}
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Project title"
          />
        </div>
        <div>
          <label className={styles.label}>Subtitle</label>
          <input
            className={styles.input}
            value={form.subtitle || ''}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Brief subtitle"
          />
        </div>
      </div>
      <div>
        <label className={styles.label}>Excerpt *</label>
        <textarea
          className={styles.textarea}
          value={form.excerpt || ''}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="Short description"
        />
      </div>
      <div className={styles.gridThree}>
        <div>
          <label className={styles.label}>Tech</label>
          <input
            className={styles.input}
            value={form.tech || ''}
            onChange={(e) => setForm({ ...form, tech: e.target.value })}
            placeholder="React, Node.js..."
          />
        </div>
        <div>
          <label className={styles.label}>Year</label>
          <input
            className={styles.input}
            value={form.year || ''}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            placeholder="2024"
          />
        </div>
        <div>
          <label className={styles.label}>Status</label>
          <select
            className={styles.input}
            value={form.status || 'ONGOING'}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button onClick={onSave} className={`type-sans ${styles.buttonPrimary}`}>
          Save
        </button>
        <button onClick={onCancel} className={`type-sans ${styles.button}`}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderWritingForm = (form: Partial<Writing>, setForm: (f: Partial<Writing>) => void, onSave: () => void, onCancel: () => void, mode: 'create' | 'edit') => (
    <div className={styles.formBox}>
      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label}>Title *</label>
          <input
            className={styles.input}
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Writing title"
          />
        </div>
        <div>
          <label className={styles.label}>Subtitle</label>
          <input
            className={styles.input}
            value={form.subtitle || ''}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Brief subtitle"
          />
        </div>
      </div>
      <div>
        <label className={styles.label}>Content (Markdown supported)</label>
        <textarea
          className={styles.monoTextarea}
          style={{ minHeight: '150px' }}
          value={form.excerpt || ''}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          onFocus={() => setActiveTextarea(mode)}
          placeholder="Write your content here. Supports **bold**, *italic*, [links](url), and ![images](url)"
        />
        <div className={styles.imageUploadRow}>
          <button
            type="button"
            onClick={() => {
              setActiveTextarea(mode);
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className={`type-sans ${styles.button} ${styles.buttonSmall}`}
          >
            {isUploading ? 'Uploading...' : '+ Image'}
          </button>
          <span className={styles.hint} style={{ alignSelf: 'center', marginTop: 0, marginBottom: 0 }}>
            Tip: Use ![](url) for images inline with text
          </span>
        </div>
      </div>
      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label}>Date</label>
          <input
            className={styles.input}
            value={form.date || ''}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            placeholder="2024.01.15"
          />
        </div>
        <div>
          <label className={styles.label}>Category</label>
          <select
            className={styles.input}
            value={form.category || 'GENERAL'}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="GENERAL">General</option>
            <option value="ESSAY">Essay</option>
            <option value="NOTES">Notes</option>
            <option value="REVIEW">Review</option>
          </select>
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button onClick={onSave} className={`type-sans ${styles.buttonPrimary}`}>
          Save
        </button>
        <button onClick={onCancel} className={`type-sans ${styles.button}`}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderProjectsList = () => (
    <div className={styles.listGrid}>
      {/* Create form */}
      {isCreating && renderProjectForm(
        createForm as Partial<Project>,
        (f) => setCreateForm(f),
        handleCreate,
        () => { setIsCreating(false); setCreateForm({}); }
      )}

      {projects.length === 0 && !isCreating ? (
        <div className={`type-serif-italic ${styles.emptyState}`}>No projects found</div>
      ) : (
        projects.map((project) => (
          <div key={project.id}>
            {editingId === project.id ? (
              renderProjectForm(
                editForm as Partial<Project>,
                (f) => setEditForm(f),
                handleSaveEdit,
                () => { setEditingId(null); setEditForm({}); }
              )
            ) : (
              <div className={styles.listItem}>
                <div>
                  <div className={styles.listItemTitle}>
                    {project.title}
                    <span className={`type-serif-italic ${styles.listItemSubtitle}`}>
                      {project.subtitle}
                    </span>
                  </div>
                  <div className={styles.listItemBody}>{project.excerpt}</div>
                  <div className={`type-sans ${styles.listItemMeta}`}>
                    {project.tech} · {project.year} · {project.status}
                  </div>
                </div>
                <button onClick={() => handleEdit(project)} className={`type-sans ${styles.button}`}>
                  Edit
                </button>
                <button onClick={() => handleDelete(project.id)} className={`type-sans ${styles.buttonDanger}`}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderWritingsList = () => (
    <div className={styles.listGrid}>
      {/* Create form */}
      {isCreating && renderWritingForm(
        createForm as Partial<Writing>,
        (f) => setCreateForm(f),
        handleCreate,
        () => { setIsCreating(false); setCreateForm({}); },
        'create'
      )}

      {writings.length === 0 && !isCreating ? (
        <div className={`type-serif-italic ${styles.emptyState}`}>No writings found</div>
      ) : (
        writings.map((writing) => (
          <div key={writing.id}>
            {editingId === writing.id ? (
              renderWritingForm(
                editForm as Partial<Writing>,
                (f) => setEditForm(f),
                handleSaveEdit,
                () => { setEditingId(null); setEditForm({}); },
                'edit'
              )
            ) : (
              <div className={styles.listItem}>
                <div>
                  <div className={styles.listItemTitle}>
                    {writing.title}
                    <span className={`type-serif-italic ${styles.listItemSubtitle}`}>
                      {writing.subtitle}
                    </span>
                  </div>
                  <div className={styles.listItemBody}>{writing.excerpt}</div>
                  <div className={`type-sans ${styles.listItemMeta}`}>
                    {writing.date} · {writing.category}
                  </div>
                </div>
                <button onClick={() => handleEdit(writing)} className={`type-sans ${styles.button}`}>
                  Edit
                </button>
                <button onClick={() => handleDelete(writing.id)} className={`type-sans ${styles.buttonDanger}`}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={styles.contentSection}>
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className={styles.hidden}
      />

      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>Content Manager</h2>
        {activeTab !== 'photos' && (
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); setCreateForm({}); }}
            className={`type-sans ${styles.buttonPrimary}`}
          >
            + New {activeTab.slice(0, -1)}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['projects', 'writings', 'photos'] as ContentType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`type-sans ${activeTab === tab ? styles.tabActive : styles.tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className={message.type === 'success' ? styles.messageSuccess : styles.messageError}>
          {message.text}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className={`type-serif-italic ${styles.emptyState}`}>Loading...</div>
      )}

      {/* Content Lists */}
      {!isLoading && (
        <>
          {activeTab === 'photos' && renderPhotosList()}
          {activeTab === 'projects' && renderProjectsList()}
          {activeTab === 'writings' && renderWritingsList()}
        </>
      )}
    </div>
  );
}
