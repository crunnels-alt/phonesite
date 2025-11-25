'use client';

import { useState } from 'react';

interface SelectedFile {
  file: File;
  preview: string;
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

export default function PhotoManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setMessage({
        type: 'error',
        text: `${invalidFiles.length} file(s) rejected. Only JPG, PNG, WebP, or GIF allowed.`
      });
      return;
    }

    setMessage(null);

    const filePromises = files.map(file => {
      return new Promise<SelectedFile>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            file,
            preview: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(newFiles => {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    if (!formData.groupName.trim()) {
      setMessage({ type: 'error', text: 'Group name is required' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const groupId = crypto.randomUUID();
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const { file } = selectedFiles[i];
      setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}...`);

      try {
        const formDataToSend = new FormData();
        formDataToSend.append('file', file);
        formDataToSend.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formDataToSend.append('description', formData.description);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('date', formData.date);
        formDataToSend.append('groupId', groupId);
        formDataToSend.append('groupName', formData.groupName.trim());

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formDataToSend,
        });

        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0 && errorCount === 0) {
      setMessage({ type: 'success', text: `Successfully uploaded ${successCount} photo(s)!` });
    } else if (successCount > 0 && errorCount > 0) {
      setMessage({ type: 'error', text: `Uploaded ${successCount} photo(s), ${errorCount} failed.` });
    } else {
      setMessage({ type: 'error', text: `Failed to upload ${errorCount} photo(s).` });
    }

    setSelectedFiles([]);
    setFormData({
      groupName: '',
      description: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsUploading(false);
    setUploadProgress('');
  };

  return (
    <div style={{ padding: '1.5rem', marginTop: '2rem' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '1.5rem' }}>Photo Upload</h2>

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

      <form onSubmit={handleUpload} style={{ padding: '1rem', border: '1px solid var(--border-light)' }}>
        {/* Group Name */}
        <div>
          <label style={labelStyle}>Group Name *</label>
          <input
            type="text"
            value={formData.groupName}
            onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
            placeholder="e.g., Tokyo 2024, Portraits, Street"
            disabled={isUploading}
            required
            style={inputStyle}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
            URL: /photos/{formData.groupName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'group-name'}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label style={labelStyle}>Select Images</label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            style={{ ...inputStyle, padding: '0.4rem' }}
          />
        </div>

        {/* Preview Grid */}
        {selectedFiles.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>{selectedFiles.length} file(s) selected</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.75rem',
              marginTop: '0.5rem'
            }}>
              {selectedFiles.map((file, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={file.preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      border: '1px solid var(--border-light)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label style={labelStyle}>Description (applies to all)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Caption or description for these photos"
            disabled={isUploading}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Location & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Where were these taken?"
              disabled={isUploading}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={isUploading}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={selectedFiles.length === 0 || isUploading || !formData.groupName.trim()}
          className="type-sans"
          style={{
            ...buttonStyle,
            width: '100%',
            marginTop: '0.5rem',
            background: selectedFiles.length === 0 || isUploading || !formData.groupName.trim()
              ? 'transparent'
              : 'var(--foreground)',
            color: selectedFiles.length === 0 || isUploading || !formData.groupName.trim()
              ? 'var(--text-tertiary)'
              : 'var(--background)',
            cursor: selectedFiles.length === 0 || isUploading || !formData.groupName.trim()
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          {isUploading ? uploadProgress : `Upload ${selectedFiles.length} Photo(s)`}
        </button>
      </form>
    </div>
  );
}
