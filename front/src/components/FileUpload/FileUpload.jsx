import { useState } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiPost } from '../../lib/api';

export default function FileUpload({ publicationId, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(''); // 'success' | 'error' | ''
  const [errorMessage, setErrorMessage] = useState('');
  const { token } = useAuth();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!publicationId) {
      setStatus('error');
      setErrorMessage('No publication selected to attach this file to.');
      return;
    }

    setIsUploading(true);
    setStatus('');
    setErrorMessage('');

    // Mapping directly to the ERD 'FILE' table attributes.
    const fileMetadata = {
      FILE_NAME: selectedFile.name,
      FILE_TYPE: selectedFile.type || 'unknown',
      FILE_SIZE: selectedFile.size,
      PUBLICATION_ID: publicationId,
    };

    try {
      const result = await apiPost('/api/files', fileMetadata, token);
      setStatus('success');
      if (onUploadSuccess) onUploadSuccess(result.data);
    } catch (err) {
      console.error('File upload error:', err);
      setStatus('error');
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Upload Manuscript / Assets</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Attach documents to register file metadata in the database.
          Only the metadata is stored &mdash; the ERD&apos;s FILE table has no binary column.
        </p>
      </div>
      
      {!selectedFile ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition hover:bg-slate-100 hover:border-indigo-300 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-indigo-600 mb-3 group-hover:scale-105 transition">
            <UploadCloud size={24} />
          </div>
          <span className="text-sm font-semibold text-slate-700">Click to browse files</span>
          <span className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, ZIP up to 50MB</span>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <File size={20} />
            </div>
            <div className="truncate">
              <p className="truncate text-sm font-semibold text-slate-800">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Document'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {status === 'success' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={16} /> Uploaded
              </span>
            ) : (
              <>
                <button 
                  onClick={() => setSelectedFile(null)} 
                  disabled={isUploading}
                  className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:text-error"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={handleUpload} 
                  disabled={isUploading} 
                  className="btn btn-primary btn-sm gap-1"
                >
                  {isUploading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Uploading...
                    </>
                  ) : (
                    'Upload File'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 p-2.5 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage || 'Upload failed. Please check your network or token and try again.'}</span>
        </div>
      )}
    </div>
  );
}