'use client';

import { useState } from 'react';

interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  width: number;
  height: number;
}

interface SelectedFile {
  file: File;
  preview: string;
}

export default function PhotoManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [formData, setFormData] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
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

    // Create previews for all files
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

    setIsUploading(true);
    setMessage(null);

    let successCount = 0;
    let errorCount = 0;

    // Upload files one by one
    for (let i = 0; i < selectedFiles.length; i++) {
      const { file } = selectedFiles[i];
      setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}...`);

      try {
        const formDataToSend = new FormData();
        formDataToSend.append('file', file);
        formDataToSend.append('title', file.name.replace(/\.[^/.]+$/, '')); // Use filename without extension as title
        formDataToSend.append('location', formData.location);
        formDataToSend.append('date', formData.date);

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
      } catch (error) {
        errorCount++;
      }
    }

    // Show final message
    if (successCount > 0 && errorCount === 0) {
      setMessage({ type: 'success', text: `Successfully uploaded ${successCount} photo(s)!` });
    } else if (successCount > 0 && errorCount > 0) {
      setMessage({ type: 'error', text: `Uploaded ${successCount} photo(s), ${errorCount} failed.` });
    } else {
      setMessage({ type: 'error', text: `Failed to upload ${errorCount} photo(s).` });
    }

    // Reset form
    setSelectedFiles([]);
    setFormData({
      location: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsUploading(false);
    setUploadProgress('');
  };

  return (
    <div style={{
      border: '1px solid var(--accent-gray)',
      padding: '1.5rem',
      marginTop: '2rem',
    }}>
      <div className="type-mono text-xs mb-4 opacity-60">
        PHOTO_MANAGER
      </div>

      <form onSubmit={handleUpload} style={{ display: 'grid', gap: '1.5rem' }}>
        {/* File Upload */}
        <div>
          <label className="type-mono text-xs mb-2 block opacity-60">
            SELECT_IMAGES
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            className="type-mono text-xs"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--accent-gray)',
              background: 'var(--background)',
            }}
          />
        </div>

        {/* Preview Grid */}
        {selectedFiles.length > 0 && (
          <div>
            <div className="type-mono text-xs mb-2 opacity-60">
              SELECTED: {selectedFiles.length} FILE(S)
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '1rem'
            }}>
              {selectedFiles.map((file, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={file.preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      border: '1px solid var(--accent-gray)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="type-mono text-xs"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'var(--accent-red)',
                      color: 'white',
                      border: 'none',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    ×
                  </button>
                  <div className="type-mono" style={{
                    fontSize: '9px',
                    marginTop: '4px',
                    opacity: 0.6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {file.file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="type-mono text-xs mb-2 block opacity-60">
              LOCATION (applies to all)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Location"
              disabled={isUploading}
              className="type-mono text-sm"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--accent-gray)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div>
            <label className="type-mono text-xs mb-2 block opacity-60">
              DATE (applies to all)
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={isUploading}
              className="type-mono text-sm"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--accent-gray)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </div>
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={selectedFiles.length === 0 || isUploading}
          className="type-mono text-xs uppercase tracking-wide hover-glitch"
          style={{
            padding: '0.75rem',
            border: `1px solid ${selectedFiles.length === 0 || isUploading ? 'var(--accent-gray)' : 'var(--accent-blue)'}`,
            background: 'transparent',
            color: selectedFiles.length === 0 || isUploading ? 'var(--accent-gray)' : 'var(--accent-blue)',
            cursor: selectedFiles.length === 0 || isUploading ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? uploadProgress : `UPLOAD ${selectedFiles.length} PHOTO(S)`}
        </button>

        {/* Messages */}
        {message && (
          <div
            className="type-mono text-xs"
            style={{
              padding: '0.75rem',
              border: `1px solid ${message.type === 'success' ? 'var(--accent-blue)' : 'var(--accent-red)'}`,
              color: message.type === 'success' ? 'var(--accent-blue)' : 'var(--accent-red)',
            }}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
