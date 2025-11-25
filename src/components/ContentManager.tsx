'use client';

import { useState, useEffect } from 'react';

type ContentType = 'photos' | 'projects' | 'writings';

interface Photo {
  id: string;
  url: string;
  title: string;
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

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid var(--border-light)',
  background: 'var(--background)',
  fontFamily: 'inherit',
  fontSize: '14px',
  marginBottom: '0.75rem',
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '12px',
  color: 'var(--text-tertiary)',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  border: '1px solid var(--border-light)',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '13px',
  transition: 'all 0.2s',
};

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState<ContentType>('projects');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project | Writing>>({});

  // Create states
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<Project | Writing>>({});

  useEffect(() => {
    loadContent();
    setEditingId(null);
    setIsCreating(false);
  }, [activeTab]);

  const loadContent = async () => {
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
  };

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

  const handleEdit = (item: Project | Writing) => {
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

  const renderPhotosList = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {photos.length === 0 ? (
        <div className="type-serif-italic" style={{ color: 'var(--text-tertiary)' }}>No photos found</div>
      ) : (
        photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr auto',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid var(--border-light)',
              alignItems: 'center',
            }}
          >
            <img
              src={photo.url}
              alt={photo.title}
              style={{
                width: '80px',
                height: '60px',
                objectFit: 'cover',
              }}
            />
            <div>
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                {photo.title}
              </div>
              <div className="type-sans" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {photo.location && `${photo.location} · `}{photo.date}
              </div>
            </div>
            <button
              onClick={() => handleDelete(photo.id)}
              className="type-sans"
              style={{ ...buttonStyle, color: '#dc2626', borderColor: '#dc2626' }}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderProjectForm = (form: Partial<Project>, setForm: (f: Partial<Project>) => void, onSave: () => void, onCancel: () => void) => (
    <div style={{ padding: '1rem', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={inputStyle}
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Project title"
          />
        </div>
        <div>
          <label style={labelStyle}>Subtitle</label>
          <input
            style={inputStyle}
            value={form.subtitle || ''}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Brief subtitle"
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Excerpt *</label>
        <textarea
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          value={form.excerpt || ''}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="Short description"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Tech</label>
          <input
            style={inputStyle}
            value={form.tech || ''}
            onChange={(e) => setForm({ ...form, tech: e.target.value })}
            placeholder="React, Node.js..."
          />
        </div>
        <div>
          <label style={labelStyle}>Year</label>
          <input
            style={inputStyle}
            value={form.year || ''}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            placeholder="2024"
          />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            style={inputStyle}
            value={form.status || 'ONGOING'}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={onSave} className="type-sans" style={{ ...buttonStyle, background: 'var(--foreground)', color: 'var(--background)' }}>
          Save
        </button>
        <button onClick={onCancel} className="type-sans" style={buttonStyle}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderWritingForm = (form: Partial<Writing>, setForm: (f: Partial<Writing>) => void, onSave: () => void, onCancel: () => void) => (
    <div style={{ padding: '1rem', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={inputStyle}
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Writing title"
          />
        </div>
        <div>
          <label style={labelStyle}>Subtitle</label>
          <input
            style={inputStyle}
            value={form.subtitle || ''}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Brief subtitle"
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Excerpt *</label>
        <textarea
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          value={form.excerpt || ''}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="Short description or excerpt"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            style={inputStyle}
            value={form.date || ''}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            placeholder="2024.01.15"
          />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            style={inputStyle}
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
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={onSave} className="type-sans" style={{ ...buttonStyle, background: 'var(--foreground)', color: 'var(--background)' }}>
          Save
        </button>
        <button onClick={onCancel} className="type-sans" style={buttonStyle}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderProjectsList = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Create form */}
      {isCreating && renderProjectForm(
        createForm as Partial<Project>,
        (f) => setCreateForm(f),
        handleCreate,
        () => { setIsCreating(false); setCreateForm({}); }
      )}

      {projects.length === 0 && !isCreating ? (
        <div className="type-serif-italic" style={{ color: 'var(--text-tertiary)' }}>No projects found</div>
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '0.5rem',
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                    {project.title}
                    <span className="type-serif-italic" style={{ fontWeight: 400, marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                      {project.subtitle}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {project.excerpt}
                  </div>
                  <div className="type-sans" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {project.tech} · {project.year} · {project.status}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(project)}
                  className="type-sans"
                  style={buttonStyle}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="type-sans"
                  style={{ ...buttonStyle, color: '#dc2626', borderColor: '#dc2626' }}
                >
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
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Create form */}
      {isCreating && renderWritingForm(
        createForm as Partial<Writing>,
        (f) => setCreateForm(f),
        handleCreate,
        () => { setIsCreating(false); setCreateForm({}); }
      )}

      {writings.length === 0 && !isCreating ? (
        <div className="type-serif-italic" style={{ color: 'var(--text-tertiary)' }}>No writings found</div>
      ) : (
        writings.map((writing) => (
          <div key={writing.id}>
            {editingId === writing.id ? (
              renderWritingForm(
                editForm as Partial<Writing>,
                (f) => setEditForm(f),
                handleSaveEdit,
                () => { setEditingId(null); setEditForm({}); }
              )
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '0.5rem',
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                    {writing.title}
                    <span className="type-serif-italic" style={{ fontWeight: 400, marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                      {writing.subtitle}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {writing.excerpt}
                  </div>
                  <div className="type-sans" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {writing.date} · {writing.category}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(writing)}
                  className="type-sans"
                  style={buttonStyle}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(writing.id)}
                  className="type-sans"
                  style={{ ...buttonStyle, color: '#dc2626', borderColor: '#dc2626' }}
                >
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
    <div style={{ padding: '1.5rem', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 400 }}>Content Manager</h2>
        {activeTab !== 'photos' && (
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); setCreateForm({}); }}
            className="type-sans"
            style={{ ...buttonStyle, background: 'var(--foreground)', color: 'var(--background)' }}
          >
            + New {activeTab.slice(0, -1)}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        {(['projects', 'writings', 'photos'] as ContentType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="type-sans"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--foreground)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--foreground)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: '14px',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div
          style={{
            padding: '0.75rem 1rem',
            border: `1px solid ${message.type === 'success' ? '#16a34a' : '#dc2626'}`,
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
            marginBottom: '1rem',
            fontSize: '14px',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="type-serif-italic" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
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
