import React, { useState, useEffect } from 'react';
import { MediaItem } from '../../types/cms';
import { processUploadedFile, getPersistedMediaBlob } from '../../data/mediaStorage';
import {
  Upload,
  Search,
  Grid,
  List,
  Trash2,
  Info,
  Check,
  Copy,
  Image as ImageIcon,
  FileText,
  Film,
  AlertCircle,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const MediaThumbnail: React.FC<{ item: MediaItem; className?: string; style?: React.CSSProperties }> = ({
  item,
  className,
  style,
}) => {
  const [displaySrc, setDisplaySrc] = useState<string>(item.originalUrl || item.url);

  useEffect(() => {
    let active = true;
    if (item.url && (item.url.startsWith('/uploads/') || item.url.startsWith('uploads/'))) {
      getPersistedMediaBlob(item.id || item.name).then((blobUrl) => {
        if (active && blobUrl) {
          setDisplaySrc(blobUrl);
        }
      }).catch(() => {});
    } else {
      setDisplaySrc(item.originalUrl || item.url);
    }
    return () => {
      active = false;
    };
  }, [item.url, item.id, item.name, item.originalUrl]);

  const handleImgError = async () => {
    try {
      const fallback = await getPersistedMediaBlob(item.id || item.name);
      if (fallback) {
        setDisplaySrc(fallback);
      }
    } catch {}
  };

  if (item.type === 'video') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300">
        <Film className="h-8 w-8 mb-1" />
        <span className="text-[10px] font-mono">Video</span>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={item.altText || item.name}
      onError={handleImgError}
      className={className || 'w-full h-full object-cover'}
      style={style}
      loading="lazy"
    />
  );
};

interface Props {
  media: MediaItem[];
  onAddMedia: (item: MediaItem) => void;
  onUpdateMedia?: (id: string, updates: Partial<MediaItem>) => void;
  onDeleteMedia: (id: string) => void;
  onSelectMedia?: (item: MediaItem) => void;
  isModalPicker?: boolean;
}

export const MediaLibrary: React.FC<Props> = ({
  media,
  onAddMedia,
  onUpdateMedia,
  onDeleteMedia,
  onSelectMedia,
  isModalPicker = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(media[0] || null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync edit form with selected item
  React.useEffect(() => {
    if (selectedItem) {
      setEditName(selectedItem.name || '');
      setEditAlt(selectedItem.altText || '');
      const rawCap = selectedItem.caption || '';
      const cleanCap = (rawCap.toLowerCase().includes('webp optimized') || rawCap.toLowerCase().includes('saved ')) ? '' : rawCap;
      setEditCaption(cleanCap);
    }
  }, [selectedItem?.id, selectedItem?.name, selectedItem?.url]);

  const handleInsertAsset = (itemToInsert?: MediaItem | null) => {
    const target = itemToInsert || selectedItem;
    if (!target) return;
    const isCurrentSelected = !itemToInsert || itemToInsert.id === selectedItem?.id;
    const rawCaption = isCurrentSelected ? (editCaption.trim() || target.caption || '') : (target.caption || '');
    const cleanCaption = (rawCaption.toLowerCase().includes('webp optimized') || rawCaption.toLowerCase().includes('saved ')) ? '' : rawCaption;
    const targetName = isCurrentSelected ? (editName.trim() || target.name) : target.name;
    const targetAlt = isCurrentSelected ? (editAlt.trim() || target.altText || targetName) : (target.altText || targetName);
    const mediaUrl = target.url || target.originalUrl || (targetName ? `/uploads/${targetName}` : '');

    const finalItem: MediaItem = {
      ...target,
      id: target.id || targetName,
      name: targetName,
      altText: targetAlt,
      caption: cleanCaption,
      url: mediaUrl,
      originalUrl: target.originalUrl || mediaUrl,
    };
    if (onSelectMedia) {
      onSelectMedia(finalItem);
    }
  };

  const filteredMedia = media.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.altText && m.altText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.caption && m.caption.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatusMsg(`Processing ${files.length} file(s)...`);

    try {
      const existingNames = media.map((m) => m.name);
      let lastUploaded: MediaItem | null = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i + 1) / files.length) * 85));
        const newItem = await processUploadedFile(file, existingNames);
        existingNames.push(newItem.name);
        onAddMedia(newItem);
        lastUploaded = newItem;
      }

      setUploadProgress(100);
      setUploadStatusMsg(`Successfully uploaded ${files.length} asset(s) to persistent storage!`);
      if (lastUploaded) {
        setSelectedItem(lastUploaded);
        setEditName(lastUploaded.name);
        setEditAlt(lastUploaded.altText || '');
        setEditCaption('');
      }
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatusMsg(null);
      }, 2500);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadStatusMsg(`Upload error: ${err.message || 'Could not process media file'}`);
      setIsUploading(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveDetails = () => {
    if (!selectedItem) return;
    const updates: Partial<MediaItem> = {
      name: editName.trim() || selectedItem.name,
      altText: editAlt.trim(),
      caption: editCaption.trim(),
    };
    if (onUpdateMedia) {
      onUpdateMedia(selectedItem.id, updates);
    }
    setSelectedItem({ ...selectedItem, ...updates });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className={`space-y-6 ${isModalPicker ? 'max-w-full' : 'max-w-7xl mx-auto'}`}>
      {/* Header */}
      {!isModalPicker && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Media Library</span>
              <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                {media.length}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Persistent media assets with IndexedDB caching and Git-ready paths for AstroPress
            </p>
          </div>

          {/* Upload Button */}
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto">
            <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload Media'}</span>
            <input
              type="file"
              accept="image/*,video/*,application/pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Upload Progress Alert */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <span className="flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-blue-600 animate-bounce" />
              {uploadStatusMsg}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Success Alert */}
      {uploadStatusMsg && !isUploading && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

      {/* Toolbar: Filters, Search & View Toggles */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({media.length})
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'image' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'video' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Videos
            </button>
          </div>
        </div>

        {/* Search Input & Quick Upload */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          {isModalPicker && (
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer shrink-0 border border-slate-300 transition-colors">
                <Upload className="h-3.5 w-3.5 text-blue-600" />
                <span>Upload New</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => handleInsertAsset(selectedItem)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Insert Asset</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid / List with Inspector Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Items Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 min-h-[480px]">
          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
              <ImageIcon className="h-12 w-12 opacity-40 text-slate-300" />
              <p className="text-xs font-medium">No media assets match your query.</p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload an image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredMedia.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    onDoubleClick={() => handleInsertAsset(item)}
                    className={`group cursor-pointer rounded-xl overflow-hidden border aspect-square relative bg-slate-100 transition-all ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-md'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <MediaThumbnail item={item} />

                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
                      <span className="font-bold truncate">{item.name}</span>
                      <span className="text-slate-300">{item.size} • {item.dimensions || '1920x1080'}</span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-md">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Preview</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Dimensions</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMedia.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => handleInsertAsset(item)}
                      className={`hover:bg-slate-50 cursor-pointer ${
                        selectedItem?.id === item.id ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="p-3 w-14">
                        <MediaThumbnail
                          item={item}
                          className="h-10 w-10 rounded-lg object-cover border border-slate-200 bg-slate-100"
                        />
                      </td>
                      <td className="p-3 font-semibold text-slate-900 truncate max-w-[200px]">{item.name}</td>
                      <td className="p-3 text-slate-500">{item.size}</td>
                      <td className="p-3 text-slate-500">{item.dimensions || '1920x1080'}</td>
                      <td className="p-3 text-slate-500">{item.uploadDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Media Inspector (WordPress Attachment Details) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-blue-600" />
              <span>Attachment Details</span>
            </h3>
            {selectedItem && (
              <button
                onClick={() => {
                  if (confirm(`Permanently delete media file "${selectedItem.name}"?`)) {
                    onDeleteMedia(selectedItem.id);
                    setSelectedItem(null);
                  }
                }}
                className="text-rose-600 hover:text-rose-700 text-xs font-semibold p-1 transition-colors"
                title="Delete Asset"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {selectedItem ? (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center p-1">
                <MediaThumbnail
                  item={selectedItem}
                  className="max-h-44 object-contain rounded-lg"
                />
              </div>

              <div className="space-y-2 pb-3 border-b border-slate-100 text-slate-500">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Format:</span>
                  <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedItem.format || (selectedItem.name.toLowerCase().endsWith('.webp') ? 'webp' : 'image')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Optimized Size:</span>
                  <span className="font-bold text-slate-900">{selectedItem.size}</span>
                </div>

                {selectedItem.originalSize && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Original Size:</span>
                    <span className="line-through text-slate-400">{selectedItem.originalSize}</span>
                  </div>
                )}

                {selectedItem.savingsPercentage !== undefined && selectedItem.savingsPercentage > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span>WebP Payload Savings:</span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      Saved {selectedItem.savingsPercentage}%
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Dimensions:</span>
                  <span>{selectedItem.dimensions || '1920x1080'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Uploaded on:</span>
                  <span>{selectedItem.uploadDate}</span>
                </div>
              </div>

              {/* Editable Name, Alt Text & Caption */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alternative Text (Alt)</label>
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    placeholder="Describe image for accessibility & SEO..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Crucial for screen readers and search engine indexing.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Caption</label>
                  <textarea
                    rows={2}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Optional editorial caption displayed beneath the image..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleSaveDetails}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{savedSuccess ? 'Saved!' : 'Save Details'}</span>
                  </button>

                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer">
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>Replace Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  {isModalPicker && onSelectMedia && (
                    <button
                      type="button"
                      onClick={() => handleInsertAsset(selectedItem)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Insert Asset</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Asset URL</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={selectedItem.url}
                      className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-slate-100 font-mono text-slate-600 truncate"
                    />
                    <button
                      onClick={() => handleCopyLink(selectedItem.url)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs shrink-0 flex items-center gap-1 border border-slate-200"
                    >
                      {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">Select an asset from the library to inspect and edit its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
