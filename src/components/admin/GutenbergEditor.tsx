import React, { useState } from 'react';
import { Post, Page, GutenbergBlock, BlockType, PostSEO, MediaItem } from '../../types/cms';
import { GutenbergBlockRenderer } from '../common/GutenbergBlockRenderer';
import { processUploadedFile, getPersistedMediaBlob } from '../../data/mediaStorage';

const EditorImagePreview: React.FC<{ src: string; alt?: string; className?: string; style?: React.CSSProperties }> = ({
  src,
  alt = '',
  className,
  style,
}) => {
  const [displaySrc, setDisplaySrc] = useState(src);

  React.useEffect(() => {
    setDisplaySrc(src);
    if (src && (src.startsWith('/uploads/') || src.startsWith('uploads/') || src.startsWith('/public/uploads/'))) {
      getPersistedMediaBlob(src)
        .then((blob) => {
          if (blob) setDisplaySrc(blob);
        })
        .catch(() => {});
    }
  }, [src]);

  return (
    <img
      src={displaySrc || src}
      alt={alt}
      className={className}
      style={style}
      onError={async () => {
        if (src) {
          const fallback = await getPersistedMediaBlob(src);
          if (fallback) setDisplaySrc(fallback);
        }
      }}
    />
  );
};
import { executeRealGitHubPublish, generateSlug, validateSlug } from '../../data/githubPublishService';
import { DeploymentSettings } from '../../types/cms';
import { MediaLibrary } from './MediaLibrary';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Settings,
  Eye,
  Save,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  FileText,
  Layers,
  Heading,
  Type,
  Quote as QuoteIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Columns as ColumnsIcon,
  Square as ButtonIcon,
  AlertCircle,
  HelpCircle,
  User,
  Minus,
  Sparkles,
  ArrowLeft,
  Calendar,
  Tag as TagIcon,
  Folder,
  Globe,
  Code2,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Zap,
  Key,
  ShieldCheck,
  Table as TableIcon,
  Download as DownloadIcon,
  FileDown,
} from 'lucide-react';
import {
  detectAndParseTable,
  tableDataToMarkdown,
  TableBlockData,
} from '../common/tableParser';

interface Props {
  initialItem: Post | Page;
  isPage?: boolean;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  authors: { id: string; name: string }[];
  mediaLibrary: MediaItem[];
  existingSlugs?: string[];
  deploymentSettings?: DeploymentSettings;
  sessionToken?: string;
  onAddMedia?: (item: MediaItem) => void;
  onUpdateMedia?: (id: string, updates: Partial<MediaItem>) => void;
  onDeleteMedia?: (id: string) => void;
  onSave: (item: any, isPublishAction?: boolean) => void;
  onClose: () => void;
}

export const GutenbergEditor: React.FC<Props> = ({
  initialItem,
  isPage = false,
  categories,
  tags,
  authors,
  mediaLibrary,
  existingSlugs = [],
  deploymentSettings = {
    githubRepo: 'ipritamsingh/astropress',
    githubBranch: 'main',
    productionUrl: '',
    cloudflarePagesProject: '',
    cloudflareWorkerUrl: '',
    autoDeployOnPublish: false,
  },
  sessionToken = '',
  onAddMedia,
  onUpdateMedia,
  onDeleteMedia,
  onSave,
  onClose,
}) => {
  const [originalSlug] = useState<string>(initialItem.slug || '');
  const [originalId] = useState<string>(initialItem.id || '');
  const isExistingItem = Boolean(originalSlug || (initialItem.title && initialItem.title.trim()));
  const [itemId, setItemId] = useState<string>(
    initialItem.id || (isPage ? 'page-' : 'post-') + Date.now()
  );
  const [title, setTitle] = useState(initialItem.title || '');
  const [slug, setSlug] = useState(initialItem.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [status, setStatus] = useState<Post['status']>(initialItem.status || 'draft');
  const [blocks, setBlocks] = useState<GutenbergBlock[]>(
    initialItem.blocks && initialItem.blocks.length > 0
      ? initialItem.blocks
      : [
          {
            id: 'b-init-1',
            type: 'heading',
            content: 'Write your story headline...',
            settings: { level: 2 },
          },
          {
            id: 'b-init-2',
            type: 'paragraph',
            content:
              'Start writing your engaging article or paste your thoughts here. You can format this block or add columns, quotes, and media blocks.',
            settings: { fontSize: 'medium' },
          },
        ]
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    blocks[0]?.id || null
  );

  // Post-specific attributes
  const postItem = initialItem as Post;
  const [author, setAuthor] = useState(postItem.author || authors[0]?.name || 'Amit Singh');
  const [category, setCategory] = useState(postItem.category || categories[0]?.name || 'Technology');
  const [selectedTags, setSelectedTags] = useState<string[]>(postItem.tags || ['Astro', 'CMS']);
  const [featuredImage, setFeaturedImage] = useState(postItem.featuredImage || '');
  const [excerpt, setExcerpt] = useState(postItem.excerpt || '');
  const [template, setTemplate] = useState<Post['template']>(postItem.template || 'standard');

  // SEO
  const [seo, setSeo] = useState<PostSEO>(
    initialItem.seo || {
      metaTitle: initialItem.title || '',
      metaDescription: '',
      focusKeyword: '',
      robotsIndex: true,
      robotsFollow: true,
    }
  );

  // UI state
  const [activeSidebarTab, setActiveSidebarTab] = useState<'document' | 'block'>('document');
  const [showInserter, setShowInserter] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showMobileInspector, setShowMobileInspector] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [customCommitMsg, setCustomCommitMsg] = useState('');
  const [modalGithubToken, setModalGithubToken] = useState<string>(sessionToken || deploymentSettings.githubToken || '');
  const [deployProgressText, setDeployProgressText] = useState<string>('');
  const [realCommitUrl, setRealCommitUrl] = useState<string | null>(null);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{
    type: 'block' | 'featured';
    blockId?: string;
  } | null>(null);
  const [insertUrlInputs, setInsertUrlInputs] = useState<Record<string, string>>({});
  const [showUrlForm, setShowUrlForm] = useState<Record<string, boolean>>({});
  const [isUploadingImage, setIsUploadingImage] = useState<Record<string, boolean>>({});
  const [tablePasteBlockId, setTablePasteBlockId] = useState<string | null>(null);
  const [tablePasteRawText, setTablePasteRawText] = useState<string>('');
  const [tablePasteFeedback, setTablePasteFeedback] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  // Image Upload Handlers
  const handleBlockFileUpload = async (blockId: string, file: File) => {
    setIsUploadingImage((prev) => ({ ...prev, [blockId]: true }));
    try {
      const existingNames = mediaLibrary.map((m) => m.name);
      const newItem = await processUploadedFile(file, existingNames);
      if (onAddMedia) {
        onAddMedia(newItem);
      }
      updateBlock(blockId, {
        content: newItem.url,
        settings: {
          ...blocks.find((b) => b.id === blockId)?.settings,
          imageUrl: newItem.url,
          imageAlt: newItem.altText || newItem.name,
          imageCaption: newItem.caption || '',
          align: 'center',
        },
      });
    } catch (err) {
      console.error('Failed to upload image from block:', err);
    } finally {
      setIsUploadingImage((prev) => ({ ...prev, [blockId]: false }));
    }
  };

  const handleFeaturedImageUpload = async (file: File) => {
    try {
      const existingNames = mediaLibrary.map((m) => m.name);
      const newItem = await processUploadedFile(file, existingNames);
      if (onAddMedia) {
        onAddMedia(newItem);
      }
      setFeaturedImage(newItem.url);
    } catch (err) {
      console.error('Failed to upload featured image:', err);
    }
  };

  const openMediaPickerForBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setMediaPickerTarget({ type: 'block', blockId });
    setShowMediaPicker(true);
  };

  const openMediaPickerForFeatured = () => {
    setMediaPickerTarget({ type: 'featured' });
    setShowMediaPicker(true);
  };

  const handleSelectMediaAsset = (item: MediaItem) => {
    if (!item) return;
    const mediaUrl = item.url || item.originalUrl || (item.name ? `/uploads/${item.name}` : '');
    const cleanAlt = item.altText || item.name || '';
    const rawCaption = item.caption || '';
    const cleanCaption = (rawCaption.toLowerCase().includes('webp optimized') || rawCaption.toLowerCase().includes('saved ')) ? '' : rawCaption;

    const targetBlockId =
      mediaPickerTarget?.type === 'block' && mediaPickerTarget.blockId
        ? mediaPickerTarget.blockId
        : (!mediaPickerTarget && selectedBlockId && blocks.find((b) => b.id === selectedBlockId)?.type === 'image')
        ? selectedBlockId
        : null;

    if (targetBlockId) {
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) => {
          if (b.id === targetBlockId) {
            if (b.type === 'download-button') {
              const fileName = item.name || mediaUrl.split('/').pop() || 'file';
              return {
                ...b,
                content: b.content || item.name || 'Download File',
                settings: {
                  ...b.settings,
                  downloadUrl: mediaUrl,
                  downloadFileName: fileName,
                  downloadText: b.settings.downloadText || item.name || 'Download File',
                },
              };
            }
            return {
              ...b,
              content: mediaUrl,
              settings: {
                ...b.settings,
                imageUrl: mediaUrl,
                imageAlt: cleanAlt,
                imageCaption: cleanCaption,
              },
            };
          }
          return b;
        })
      );
      setSelectedBlockId(targetBlockId);
      setActiveSidebarTab('block');
    } else {
      setFeaturedImage(mediaUrl);
    }
    setShowMediaPicker(false);
    setMediaPickerTarget(null);
  };

  // Block inserter helper
  const addBlock = (type: BlockType) => {
    const newId = 'block-' + Date.now();
    let newBlock: GutenbergBlock;

    switch (type) {
      case 'heading':
        newBlock = {
          id: newId,
          type: 'heading',
          content: 'New Section Heading',
          settings: { level: 2, align: 'left' },
        };
        break;
      case 'paragraph':
        newBlock = {
          id: newId,
          type: 'paragraph',
          content: 'Add your narrative paragraph here. Customize typography and colors in the Block Inspector sidebar.',
          settings: { fontSize: 'medium', align: 'left' },
        };
        break;
      case 'quote':
        newBlock = {
          id: newId,
          type: 'quote',
          content: '“A compelling quote captures reader imagination instantly.”',
          settings: { imageCaption: 'Notable Authority' },
        };
        break;
      case 'code':
        newBlock = {
          id: newId,
          type: 'code',
          content: `// Astro Island Component\nexport default function AstroIsland() {\n  return <div>Rendered via Astro</div>;\n}`,
          settings: { codeLanguage: 'typescript' },
        };
        break;
      case 'image':
        newBlock = {
          id: newId,
          type: 'image',
          content: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
          settings: {
            imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
            imageAlt: 'Visual illustration',
            imageCaption: 'Astro and Sveltia CMS visual overview',
            align: 'center',
            borderRadius: '100%',
          },
        };
        break;
      case 'columns':
        newBlock = {
          id: newId,
          type: 'columns',
          content: '',
          settings: {
            columnLayout: '50-50',
            columns: [
              { id: 'c1', content: 'Left Column Content:\nEdit key highlights and benefits.' },
              { id: 'c2', content: 'Right Column Content:\nProvide secondary context or data.' },
            ],
          },
        };
        break;
      case 'button':
        newBlock = {
          id: newId,
          type: 'button',
          content: 'Read Full Documentation',
          settings: { buttonUrl: '#', buttonStyle: 'primary', align: 'left' },
        };
        break;
      case 'alert':
        newBlock = {
          id: newId,
          type: 'alert',
          content: 'Helpful contextual notice for your readers.',
          settings: { alertType: 'info' },
        };
        break;
      case 'accordion':
        newBlock = {
          id: newId,
          type: 'accordion',
          content: 'Frequently Asked Questions',
          settings: {
            accordionItems: [
              {
                title: 'What makes AstroPress different from classic WordPress?',
                content:
                  'AstroPress combines the best of WordPress-style editorial ergonomics (Gutenberg block visual builder, Media Library, Menus, SEO controls) with modern Astro static islands performance and Sveltia CMS Git persistence.',
              },
              {
                title: 'How does Sveltia CMS persist content to GitHub?',
                content:
                  'Sveltia CMS works natively with GitHub API and OAuth, saving Markdown files with YAML frontmatter in src/content/posts/ and image assets in public/images/.',
              },
            ],
          },
        };
        break;
      case 'author-box':
        newBlock = {
          id: newId,
          type: 'author-box',
          content: author,
          settings: {},
        };
        break;
      case 'divider':
        newBlock = {
          id: newId,
          type: 'divider',
          content: '',
          settings: {},
        };
        break;
      case 'table':
        newBlock = {
          id: newId,
          type: 'table',
          content: '',
          settings: {
            tableData: {
              headers: ['Header 1', 'Header 2'],
              rows: [
                ['Cell 1', 'Cell 2'],
                ['Cell 3', 'Cell 4'],
              ],
              alignments: ['left', 'left'],
              hasHeader: true,
              caption: '',
            },
          },
        };
        break;
      case 'download-button':
        newBlock = {
          id: newId,
          type: 'download-button',
          content: 'Download File',
          settings: {
            downloadText: 'Download File',
            downloadUrl: '',
            downloadFileName: '',
            downloadOpenInNewTab: false,
            buttonStyle: 'primary',
            align: 'left',
            downloadAlignment: 'left',
          },
        };
        break;
      default:
        newBlock = {
          id: newId,
          type: 'paragraph',
          content: 'Text content...',
          settings: {},
        };
    }

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newId);
    setActiveSidebarTab('block');
    setShowInserter(false);
  };

  const updateBlock = (id: string, updates: Partial<GutenbergBlock>) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((b) =>
        b.id === id
          ? {
              ...b,
              ...updates,
              content: updates.content !== undefined ? updates.content : b.content,
              settings: {
                ...b.settings,
                ...(updates.settings || {}),
              },
            }
          : b
      )
    );
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIdx, 0, moved);
    setBlocks(newBlocks);
  };

  const duplicateBlock = (index: number) => {
    const target = blocks[index];
    const duplicated: GutenbergBlock = {
      ...target,
      id: 'block-' + Date.now(),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicated);
    setBlocks(newBlocks);
    setSelectedBlockId(duplicated.id);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    if (selectedBlockId === id) {
      setSelectedBlockId(newBlocks[0]?.id || null);
    }
  };

  // FAQ / Accordion Item Helpers
  const addAccordionItem = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentItems = block.settings.accordionItems || [];
    const newItems = [
      ...currentItems,
      {
        title: `Question #${currentItems.length + 1}`,
        content: 'Add your clear, detailed answer explanation here.',
      },
    ];
    updateBlock(blockId, {
      settings: { ...block.settings, accordionItems: newItems },
    });
  };

  const updateAccordionItem = (
    blockId: string,
    itemIndex: number,
    field: 'title' | 'content',
    value: string
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentItems = [...(block.settings.accordionItems || [])];
    if (!currentItems[itemIndex]) return;
    currentItems[itemIndex] = {
      ...currentItems[itemIndex],
      [field]: value,
    };
    updateBlock(blockId, {
      settings: { ...block.settings, accordionItems: currentItems },
    });
  };

  const removeAccordionItem = (blockId: string, itemIndex: number) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentItems = (block.settings.accordionItems || []).filter((_, idx) => idx !== itemIndex);
    updateBlock(blockId, {
      settings: { ...block.settings, accordionItems: currentItems },
    });
  };

  const moveAccordionItem = (
    blockId: string,
    itemIndex: number,
    direction: 'up' | 'down'
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentItems = [...(block.settings.accordionItems || [])];
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentItems.length) return;
    const [moved] = currentItems.splice(itemIndex, 1);
    currentItems.splice(targetIndex, 0, moved);
    updateBlock(blockId, {
      settings: { ...block.settings, accordionItems: currentItems },
    });
  };

  // Table Block Helpers
  const getTableData = (block: GutenbergBlock): TableBlockData => {
    return (
      block.settings.tableData || {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Cell 1', 'Cell 2'],
          ['Cell 3', 'Cell 4'],
        ],
        alignments: ['left', 'left'],
        hasHeader: true,
        caption: '',
      }
    );
  };

  const addTableRow = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const td = getTableData(block);
    const colCount = Math.max(td.headers.length, td.rows[0]?.length || 2, 1);
    const newRow = new Array(colCount).fill('');
    updateBlock(blockId, {
      settings: {
        ...block.settings,
        tableData: {
          ...td,
          rows: [...td.rows, newRow],
        },
      },
    });
  };

  const deleteTableRow = (blockId: string, rowIndex: number) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const td = getTableData(block);
    if (td.rows.length <= 1) return;
    const newRows = td.rows.filter((_, idx) => idx !== rowIndex);
    updateBlock(blockId, {
      settings: {
        ...block.settings,
        tableData: {
          ...td,
          rows: newRows,
        },
      },
    });
  };

  const addTableColumn = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const td = getTableData(block);
    const newHeaders = [...td.headers, `Header ${td.headers.length + 1}`];
    const newRows = td.rows.map((row) => [...row, '']);
    const newAlignments = [...(td.alignments || td.headers.map(() => 'left' as const)), 'left' as const];
    updateBlock(blockId, {
      settings: {
        ...block.settings,
        tableData: {
          ...td,
          headers: newHeaders,
          rows: newRows,
          alignments: newAlignments,
        },
      },
    });
  };

  const deleteTableColumn = (blockId: string, colIndex: number) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const td = getTableData(block);
    if (td.headers.length <= 1) return;
    const newHeaders = td.headers.filter((_, idx) => idx !== colIndex);
    const newRows = td.rows.map((row) => row.filter((_, idx) => idx !== colIndex));
    const newAlignments = (td.alignments || []).filter((_, idx) => idx !== colIndex);
    updateBlock(blockId, {
      settings: {
        ...block.settings,
        tableData: {
          ...td,
          headers: newHeaders,
          rows: newRows,
          alignments: newAlignments,
        },
      },
    });
  };

  const updateTableHeader = (blockId: string, colIndex: number, value: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const td = getTableData(block);
    const newHeaders = [...td.headers];
    newHeaders[colIndex] = value;
    updateBlock(blockId, {
      settings: {
        ...block.settings,
        tableData: {
          ...td,
          headers: newHeaders,
        },
      },
    });
  };

  const updateTableCell = (blockId: string, rowIndex: number, colIndex: number, value: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const td = getTableData(block);
    const newRows = td.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      const updatedRow = [...row];
      updatedRow[colIndex] = value;
      return updatedRow;
    });
    updateBlock(blockId, {
      settings: {
        ...block.settings,
        tableData: {
          ...td,
          rows: newRows,
        },
      },
    });
  };

  const updateTableColAlignment = (blockId: string, colIndex: number, align: 'left' | 'center' | 'right') => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const td = getTableData(block);
    const newAlignments = [...(td.alignments || td.headers.map(() => 'left' as const))];
    newAlignments[colIndex] = align;
    updateBlock(blockId, {
      settings: {
        ...block.settings,
        tableData: {
          ...td,
          alignments: newAlignments,
        },
      },
    });
  };

  const handleApplyTablePaste = (blockId: string, rawText: string) => {
    const parsed = detectAndParseTable(rawText);
    if (parsed) {
      updateBlock(blockId, {
        settings: {
          ...(blocks.find((b) => b.id === blockId)?.settings || {}),
          tableData: parsed,
        },
      });
      setTablePasteFeedback({ id: blockId, msg: 'Table imported successfully!' });
      setTimeout(() => setTablePasteFeedback(null), 3000);
      setTablePasteBlockId(null);
      setTablePasteRawText('');
      return true;
    } else {
      setTablePasteFeedback({
        id: blockId,
        msg: 'Could not detect a valid Markdown or HTML table. Please check syntax.',
        isError: true,
      });
      setTimeout(() => setTablePasteFeedback(null), 4000);
      return false;
    }
  };

  // Compile Markdown Body
  const compileBlocksToMarkdown = (): string => {
    return blocks
      .map((b) => {
        if (b.type === 'heading') {
          const hashes = '#'.repeat(b.settings?.level || 2);
          return `${hashes} ${b.content}`;
        }
        if (b.type === 'paragraph') return b.content;
        if (b.type === 'quote') return `> ${b.content}\n>\n> — ${b.settings?.imageCaption || 'Notable Author'}`;
        if (b.type === 'code') return `\`\`\`${b.settings?.codeLanguage || 'typescript'}\n${b.content}\n\`\`\``;
        if (b.type === 'image') return `![${b.settings?.imageAlt || ''}](${b.settings?.imageUrl || b.content})`;
        if (b.type === 'gallery') return b.content || '![Gallery Image](' + (b.settings?.imageUrl || '') + ')';
        if (b.type === 'list') {
          return (b.content || '')
            .split('\n')
            .map((line) => (line.trim().startsWith('-') ? line : `- ${line}`))
            .join('\n');
        }
        if (b.type === 'columns') {
          return (b.settings?.columns || []).map((col) => col.content).join('\n\n');
        }
        if (b.type === 'button') return `[${b.content}](${b.settings?.buttonUrl || '#'})`;
        if (b.type === 'alert') return `> **Notice**: ${b.content}`;
        if (b.type === 'divider') return `---`;
        if (b.type === 'accordion') {
          return (b.settings?.accordionItems || [])
            .map((item) => `### ${item.title}\n${item.content}`)
            .join('\n\n');
        }
        if (b.type === 'author-box') return `**Author:** ${b.content}`;
        if (b.type === 'embed') return `[Embedded Resource](${b.content})`;
        if (b.type === 'table') {
          const td = b.settings?.tableData;
          if (td) return tableDataToMarkdown(td);
          return b.content || '';
        }
        if (b.type === 'download-button') {
          const text = b.settings?.downloadText || b.content || 'Download File';
          const url = b.settings?.downloadUrl || '#';
          return `[Download: ${text}](${url})`;
        }
        return b.content || '';
      })
      .filter(Boolean)
      .join('\n\n');
  };

  const generateYamlFrontmatter = (targetStatus?: Post['status']): string => {
    const activeStatus = targetStatus || status || 'draft';
    const cleanSlug = slug || originalSlug || generateSlug(title);
    const cleanDate = (initialItem as Post).pubDate || new Date().toISOString();

    if (isPage) {
      return `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${cleanSlug}"
pubDate: ${cleanDate}
template: "${(initialItem as Page).template || 'default'}"
draft: ${activeStatus === 'draft'}
blocks: ${JSON.stringify(blocks || [])}
---

${compileBlocksToMarkdown()}`;
    }

    return `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${cleanSlug}"
pubDate: ${cleanDate}
status: "${activeStatus}"
draft: ${activeStatus === 'draft'}
author: "${author}"
category: "${category}"
tags: [${selectedTags.map((t) => `"${t}"`).join(', ')}]
featuredImage: "${featuredImage}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
readingTime: ${Math.max(1, Math.ceil(blocks.length * 0.8))}
template: "${template}"
blocks: ${JSON.stringify(blocks || [])}
seo:
  metaTitle: "${seo.metaTitle.replace(/"/g, '\\"')}"
  metaDescription: "${seo.metaDescription.replace(/"/g, '\\"')}"
  focusKeyword: "${seo.focusKeyword}"
  robotsIndex: ${seo.robotsIndex}
  robotsFollow: ${seo.robotsFollow}
---

${compileBlocksToMarkdown()}`;
  };

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    setPublishError(null);
    const finalSlug = slug || originalSlug || generateSlug(title);
    const markdownBody = compileBlocksToMarkdown();

    if (isPage) {
      const pageToSave: Page = {
        id: originalId || itemId,
        title: title || 'Untitled Page',
        slug: finalSlug,
        originalSlug: originalSlug || undefined,
        status: status || 'draft',
        template: (initialItem as Page).template || 'default',
        featuredImage,
        blocks,
        body: markdownBody,
        seo,
      };
      onSave(pageToSave, false);
    } else {
      const postToSave: Post = {
        id: originalId || itemId,
        title: title || 'Untitled Post',
        slug: finalSlug,
        originalSlug: originalSlug || undefined,
        pubDate: (initialItem as Post).pubDate || new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        status: status || 'draft',
        author,
        category,
        tags: selectedTags,
        featuredImage,
        excerpt: excerpt || title,
        readingTime: Math.max(1, Math.ceil(blocks.length * 0.8)),
        template,
        blocks,
        body: markdownBody,
        seo,
      };
      onSave(postToSave, false);
    }

    setLastDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setIsSavingDraft(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleInitiatePublish = () => {
    setPublishError(null);
    if (!title.trim()) {
      setPublishError('Please enter an article title before publishing.');
      return;
    }

    const finalSlug = slug || originalSlug || generateSlug(title);
    const otherSlugs = existingSlugs.filter((s) => s !== originalSlug && s !== initialItem.slug);
    const slugValidation = validateSlug(finalSlug, otherSlugs);
    if (!slugValidation.valid) {
      setPublishError(slugValidation.error || 'Invalid URL slug.');
      return;
    }

    const defaultMsg = `feat(content): publish ${isPage ? 'page' : 'post'} "${title.trim()}"`;
    setCustomCommitMsg(defaultMsg);
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    if (isPublishing) return; // Prevent duplicate clicks

    setIsPublishing(true);
    setPublishError(null);
    setDeployProgressText('Preparing content for deployment...');
    setStatus('published');

    const finalSlug = slug || originalSlug || generateSlug(title);
    const fullYamlMarkdown = generateYamlFrontmatter('published');
    const markdownBody = compileBlocksToMarkdown();

    const itemToPublish: any = isPage
      ? {
          id: originalId || itemId,
          title: title.trim(),
          slug: finalSlug,
          originalSlug: originalSlug || undefined,
          status: 'published',
          template: (initialItem as Page).template || 'default',
          featuredImage,
          blocks,
          body: markdownBody,
          seo,
        }
      : {
          id: originalId || itemId,
          title: title.trim(),
          slug: finalSlug,
          originalSlug: originalSlug || undefined,
          pubDate: (initialItem as Post).pubDate || new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          status: 'published',
          author,
          category,
          tags: selectedTags,
          featuredImage,
          excerpt: excerpt || title.trim(),
          readingTime: Math.max(1, Math.ceil(blocks.length * 0.8)),
          template,
          blocks,
          body: markdownBody,
          seo,
        };

    try {
      const activeToken = modalGithubToken.trim() || sessionToken || deploymentSettings.githubToken || '';
      // Persist published item in CMS state immediately so local state & localStorage have it
      onSave(itemToPublish, true);
      setStatus('published');

      const effectiveDeploymentSettings: DeploymentSettings = {
        ...deploymentSettings,
        githubToken: activeToken || deploymentSettings.githubToken,
      };

      // Execute publish: pushes atomically to GitHub if token is present, stages in Preview if not
      const result = await executeRealGitHubPublish(
        itemToPublish,
        isPage,
        fullYamlMarkdown,
        effectiveDeploymentSettings,
        activeToken,
        customCommitMsg.trim() || undefined,
        (progress) => {
          setDeployProgressText(progress.filePath || 'Deploying changes to GitHub...');
        }
      );

      if (!result.success) {
        setPublishError(result.message || 'GitHub Publication failed.');
        return;
      }

      setPublishSuccessMsg(result.message);
      setRealCommitUrl(result.commitUrl || null);
      setShowPublishModal(false);
      setTimeout(() => setPublishSuccessMsg(null), 8000);
    } catch (err: any) {
      setPublishError(err?.message || 'Error occurred during publishing. Draft was saved safely.');
    } finally {
      setIsPublishing(false);
      setDeployProgressText('');
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // Inspector Content Component (shared across desktop aside and mobile drawer)
  const renderInspectorContent = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Sidebar Tabs: Document vs Block */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          onClick={() => setActiveSidebarTab('document')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeSidebarTab === 'document'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Document
        </button>
        <button
          onClick={() => setActiveSidebarTab('block')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeSidebarTab === 'block'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Block {selectedBlock ? `(${selectedBlock.type})` : ''}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 text-sm overscroll-y-contain pb-24 lg:pb-12">
        {/* DOCUMENT SETTINGS TAB */}
        {activeSidebarTab === 'document' && (
          <div className="space-y-6">
            {/* Status & Visibility */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Status & Visibility
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Publish Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="bg-slate-100 font-semibold text-slate-800 rounded px-2 py-1 border border-slate-200"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isPublishing}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {isSavingDraft ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleInitiatePublish}
                  disabled={isPublishing}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>{status === 'published' ? 'Update & Deploy' : 'Publish'}</span>
                </button>
              </div>

              {!isPage && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Author</span>
                  <select
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="bg-slate-100 font-semibold text-slate-800 rounded px-2 py-1 border border-slate-200 max-w-[140px]"
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isPage && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Template</span>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as any)}
                    className="bg-slate-100 font-semibold text-slate-800 rounded px-2 py-1 border border-slate-200"
                  >
                    <option value="standard">Standard Article</option>
                    <option value="cover-hero">Cover Hero</option>
                    <option value="minimal-editorial">Minimal Editorial</option>
                    <option value="sidebar-right">Sidebar Right</option>
                  </select>
                </div>
              )}
            </div>

            {/* Categories & Tags (Posts only) */}
            {!isPage && (
              <div className="space-y-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Primary Category
                  </span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Tags ({selectedTags.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                      >
                        <span>{t}</span>
                        <button
                          onClick={() => setSelectedTags(selectedTags.filter((tag) => tag !== t))}
                          className="hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <select
                      onChange={(e) => {
                        if (e.target.value && !selectedTags.includes(e.target.value)) {
                          setSelectedTags([...selectedTags, e.target.value]);
                        }
                      }}
                      value=""
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700"
                    >
                      <option value="">+ Add existing tag...</option>
                      {tags.map((tg) => (
                        <option key={tg.id} value={tg.name}>
                          {tg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Featured Image */}
            {!isPage && (
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Featured Image
                </span>
                {featuredImage ? (
                  <div className="space-y-2">
                    <div className="overflow-hidden rounded-xl border border-slate-200 max-h-36 bg-slate-100 flex items-center justify-center">
                      <EditorImagePreview src={featuredImage} alt="Featured" className="w-full h-auto object-cover max-h-36" />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={openMediaPickerForFeatured}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeaturedImage('')}
                        className="text-xs text-rose-600 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      onClick={openMediaPickerForFeatured}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs text-slate-600 font-semibold block">Choose from Media Library</span>
                      <span className="text-[10px] text-slate-400">Click to browse library</span>
                    </div>
                    <label className="w-full py-2 px-3 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5 text-blue-600" />
                      <span>Upload From Computer</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFeaturedImageUpload(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Excerpt */}
            {!isPage && (
              <div className="space-y-2 pb-4 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Excerpt / Summary
                </span>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder="Write an excerpt (optional for cards)..."
                  className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* SEO Snippet Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  SEO & Meta Tags
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                  Google Preview
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">SEO Title</label>
                <input
                  type="text"
                  value={seo.metaTitle}
                  onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                  placeholder={title || 'Page title...'}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Meta Description</label>
                <textarea
                  value={seo.metaDescription}
                  onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                  rows={2}
                  placeholder="Search engine meta description..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Focus Keyword</label>
                <input
                  type="text"
                  value={seo.focusKeyword}
                  onChange={(e) => setSeo({ ...seo, focusKeyword: e.target.value })}
                  placeholder="e.g. Astro Sveltia CMS"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* BLOCK SETTINGS TAB */}
        {activeSidebarTab === 'block' && (
          <div>
            {selectedBlock ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                      Block Settings
                    </span>
                    <span className="text-sm font-bold text-slate-900 capitalize">
                      {selectedBlock.type} Block
                    </span>
                  </div>
                  <button
                    onClick={() => deleteBlock(selectedBlock.id)}
                    className="text-xs text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"
                    title="Delete Block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Dedicated Accordion / FAQ Block Settings in Inspector */}
                {selectedBlock.type === 'accordion' && (
                  <div className="space-y-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4 text-purple-600" />
                        <span>FAQ Items ({(selectedBlock.settings.accordionItems || []).length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => addAccordionItem(selectedBlock.id)}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200"
                      >
                        + Add Question
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(selectedBlock.settings.accordionItems || []).map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">Q#{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveAccordionItem(selectedBlock.id, idx, 'up')}
                                className="p-0.5 hover:text-slate-800 disabled:opacity-20"
                                title="Move Up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (selectedBlock.settings.accordionItems?.length || 1) - 1}
                                onClick={() => moveAccordionItem(selectedBlock.id, idx, 'down')}
                                className="p-0.5 hover:text-slate-800 disabled:opacity-20"
                                title="Move Down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAccordionItem(selectedBlock.id, idx)}
                                className="p-0.5 hover:text-rose-600"
                                title="Delete Question"
                              >
                                <Trash2 className="h-3 w-3 text-rose-500" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateAccordionItem(selectedBlock.id, idx, 'title', e.target.value)}
                            placeholder="Question title..."
                            className="w-full text-xs font-semibold p-1.5 rounded border border-slate-200 bg-white"
                          />
                          <textarea
                            rows={2}
                            value={item.content}
                            onChange={(e) => updateAccordionItem(selectedBlock.id, idx, 'content', e.target.value)}
                            placeholder="Answer content..."
                            className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Google FAQPage Schema.org JSON-LD will be automatically generated.</span>
                    </div>
                  </div>
                )}

                {/* Dedicated Image Block Settings in Inspector */}
                {selectedBlock.type === 'image' && (
                  <div className="space-y-4 pb-4 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Image Settings
                    </span>

                    {selectedBlock.settings.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-36 flex items-center justify-center p-1">
                        <EditorImagePreview
                          src={selectedBlock.settings.imageUrl}
                          alt={selectedBlock.settings.imageAlt || ''}
                          className="max-h-32 object-contain rounded"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <label className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-center text-xs font-semibold cursor-pointer border border-blue-200">
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBlockFileUpload(selectedBlock.id, file);
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => openMediaPickerForBlock(selectedBlock.id)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
                      >
                        Browse Library
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Alternative Text (Alt Text)
                      </label>
                      <textarea
                        rows={2}
                        value={selectedBlock.settings.imageAlt || ''}
                        onChange={(e) =>
                          updateBlock(selectedBlock.id, {
                            settings: { ...selectedBlock.settings, imageAlt: e.target.value },
                          })
                        }
                        placeholder="Describe purpose of the image..."
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 resize-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Essential for visually impaired users and SEO rankings.
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Image Caption</label>
                      <input
                        type="text"
                        value={selectedBlock.settings.imageCaption || ''}
                        onChange={(e) =>
                          updateBlock(selectedBlock.id, {
                            settings: { ...selectedBlock.settings, imageCaption: e.target.value },
                          })
                        }
                        placeholder="Caption below image..."
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Image Width Size</label>
                      <div className="grid grid-cols-4 gap-1">
                        {['25%', '50%', '75%', '100%'].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() =>
                              updateBlock(selectedBlock.id, {
                                settings: { ...selectedBlock.settings, borderRadius: w },
                              })
                            }
                            className={`py-1 rounded text-xs font-semibold border ${
                              selectedBlock.settings.borderRadius === w ||
                              (!selectedBlock.settings.borderRadius && w === '100%')
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Link URL (Optional)</label>
                      <input
                        type="url"
                        value={selectedBlock.settings.buttonUrl || ''}
                        onChange={(e) =>
                          updateBlock(selectedBlock.id, {
                            settings: { ...selectedBlock.settings, buttonUrl: e.target.value },
                          })
                        }
                        placeholder="https://..."
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                      />
                    </div>
                  </div>
                )}

                {/* Dedicated Table Block Settings in Inspector */}
                {selectedBlock.type === 'table' && (() => {
                  const td = getTableData(selectedBlock);
                  return (
                    <div className="space-y-4 pb-4 border-b border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Table Settings
                      </span>
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span>Grid Dimensions</span>
                        <span className="font-bold text-slate-800">{td.rows.length} Rows × {td.headers.length} Columns</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addTableRow(selectedBlock.id)}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
                        >
                          + Add Row
                        </button>
                        <button
                          type="button"
                          onClick={() => addTableColumn(selectedBlock.id)}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
                        >
                          + Add Column
                        </button>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Table Caption</label>
                        <input
                          type="text"
                          value={td.caption || ''}
                          onChange={(e) =>
                            updateBlock(selectedBlock.id, {
                              settings: {
                                ...selectedBlock.settings,
                                tableData: { ...td, caption: e.target.value },
                              },
                            })
                          }
                          placeholder="Table description / source..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Dedicated Download Button Settings in Inspector */}
                {selectedBlock.type === 'download-button' && (
                  <div className="space-y-4 pb-4 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Download Settings
                    </span>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Button Label</label>
                      <input
                        type="text"
                        value={selectedBlock.settings.downloadText || selectedBlock.content || ''}
                        onChange={(e) =>
                          updateBlock(selectedBlock.id, {
                            content: e.target.value,
                            settings: { ...selectedBlock.settings, downloadText: e.target.value },
                          })
                        }
                        placeholder="Download Technical Specs (PDF)"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">File URL / Download Link</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={selectedBlock.settings.downloadUrl || ''}
                          onChange={(e) =>
                            updateBlock(selectedBlock.id, {
                              settings: { ...selectedBlock.settings, downloadUrl: e.target.value },
                            })
                          }
                          placeholder="https://... or /uploads/..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => openMediaPickerForBlock(selectedBlock.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shrink-0"
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Download Filename (Optional)</label>
                      <input
                        type="text"
                        value={selectedBlock.settings.downloadFileName || ''}
                        onChange={(e) =>
                          updateBlock(selectedBlock.id, {
                            settings: { ...selectedBlock.settings, downloadFileName: e.target.value },
                          })
                        }
                        placeholder="report-2026.pdf"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Button Alignment</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['left', 'center', 'right'] as const).map((alignOpt) => (
                          <button
                            key={alignOpt}
                            type="button"
                            onClick={() =>
                              updateBlock(selectedBlock.id, {
                                settings: {
                                  ...selectedBlock.settings,
                                  align: alignOpt,
                                  downloadAlignment: alignOpt,
                                },
                              })
                            }
                            className={`py-1 text-[11px] font-semibold rounded border uppercase ${
                              (selectedBlock.settings.downloadAlignment || selectedBlock.settings.align || 'left') === alignOpt
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {alignOpt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Button Style Preset</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['primary', 'secondary', 'outline'] as const).map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() =>
                              updateBlock(selectedBlock.id, {
                                settings: { ...selectedBlock.settings, buttonStyle: style },
                              })
                            }
                            className={`py-1 text-[11px] font-semibold rounded border uppercase ${
                              (selectedBlock.settings.buttonStyle || 'primary') === style
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Typography & Alignment Controls */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">Typography & Alignment</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() =>
                        updateBlock(selectedBlock.id, {
                          settings: { ...selectedBlock.settings, align: 'left' },
                        })
                      }
                      className={`py-1 text-xs font-medium rounded ${
                        selectedBlock.settings.align === 'left' ? 'bg-white shadow-2xs font-bold' : ''
                      }`}
                    >
                      Left
                    </button>
                    <button
                      onClick={() =>
                        updateBlock(selectedBlock.id, {
                          settings: { ...selectedBlock.settings, align: 'center' },
                        })
                      }
                      className={`py-1 text-xs font-medium rounded ${
                        selectedBlock.settings.align === 'center' ? 'bg-white shadow-2xs font-bold' : ''
                      }`}
                    >
                      Center
                    </button>
                    <button
                      onClick={() =>
                        updateBlock(selectedBlock.id, {
                          settings: { ...selectedBlock.settings, align: 'right' },
                        })
                      }
                      className={`py-1 text-xs font-medium rounded ${
                        selectedBlock.settings.align === 'right' ? 'bg-white shadow-2xs font-bold' : ''
                      }`}
                    >
                      Right
                    </button>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Font Size</label>
                    <select
                      value={selectedBlock.settings.fontSize || 'medium'}
                      onChange={(e) =>
                        updateBlock(selectedBlock.id, {
                          settings: { ...selectedBlock.settings, fontSize: e.target.value as any },
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="small">Small (14px)</option>
                      <option value="medium">Medium (16px)</option>
                      <option value="large">Large (20px)</option>
                      <option value="huge">Huge (24px)</option>
                    </select>
                  </div>
                </div>

                {/* Color Settings */}
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <span className="text-xs font-bold text-slate-700 block">Color Palette</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Text Color</span>
                      <input
                        type="color"
                        value={selectedBlock.settings.textColor || '#1e293b'}
                        onChange={(e) =>
                          updateBlock(selectedBlock.id, {
                            settings: { ...selectedBlock.settings, textColor: e.target.value },
                          })
                        }
                        className="h-7 w-7 rounded cursor-pointer border-0"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Background Color</span>
                      <input
                        type="color"
                        value={selectedBlock.settings.backgroundColor || '#ffffff'}
                        onChange={(e) =>
                          updateBlock(selectedBlock.id, {
                            settings: { ...selectedBlock.settings, backgroundColor: e.target.value },
                          })
                        }
                        className="h-7 w-7 rounded cursor-pointer border-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional CSS Classes */}
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <span className="text-xs font-bold text-slate-700 block">Advanced</span>
                  <label className="text-xs text-slate-500 block">Additional CSS Classes</label>
                  <input
                    type="text"
                    value={selectedBlock.settings.customClasses || ''}
                    onChange={(e) =>
                      updateBlock(selectedBlock.id, {
                        settings: { ...selectedBlock.settings, customClasses: e.target.value },
                      })
                    }
                    placeholder="my-custom-class shadow-lg"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No block selected. Click any block in the canvas to edit settings.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-sans overflow-hidden h-screen h-[100dvh] min-h-0 w-screen w-[100dvw]">
      {/* ========================================================================= */}
      {/* 1. TOP RESPONSIVE EDITOR HEADER                                            */}
      {/* ========================================================================= */}
      <header className="h-14 min-h-[56px] bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-30">
        {/* Left: Back & Block Inserter (+) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Close Editor"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Block Inserter Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowInserter(!showInserter)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus className="h-4 w-4 text-blue-400" />
              <span className="hidden sm:inline">Add Block</span>
            </button>

            {/* Inserter Dropdown Panel */}
            {showInserter && (
              <div className="absolute top-12 left-0 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    Gutenberg Block Library
                  </span>
                  <button onClick={() => setShowInserter(false)} className="text-slate-400 hover:text-slate-700">
                    ×
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Text & Content</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addBlock('heading')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <Heading className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Heading</span>
                      </button>
                      <button
                        onClick={() => addBlock('paragraph')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <Type className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Paragraph</span>
                      </button>
                      <button
                        onClick={() => addBlock('quote')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <QuoteIcon className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Quote</span>
                      </button>
                      <button
                        onClick={() => addBlock('code')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <CodeIcon className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Code Snippet</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Media & Layout</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addBlock('image')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <ImageIcon className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Image Banner</span>
                      </button>
                      <button
                        onClick={() => addBlock('columns')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <ColumnsIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>2-3 Columns</span>
                      </button>
                      <button
                        onClick={() => addBlock('table')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <TableIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Table</span>
                      </button>
                      <button
                        onClick={() => addBlock('download-button')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <DownloadIcon className="h-4 w-4 text-sky-600 shrink-0" />
                        <span>Download Button</span>
                      </button>
                      <button
                        onClick={() => addBlock('divider')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <Minus className="h-4 w-4 text-slate-600 shrink-0" />
                        <span>Divider</span>
                      </button>
                      <button
                        onClick={() => addBlock('alert')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span>Notice Alert</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Interactive & SEO FAQ</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addBlock('accordion')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold text-left transition-colors col-span-2"
                      >
                        <HelpCircle className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>FAQ / Accordion Block (Schema JSON-LD)</span>
                      </button>
                      <button
                        onClick={() => addBlock('button')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <ButtonIcon className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>Button CTA</span>
                      </button>
                      <button
                        onClick={() => addBlock('author-box')}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-colors"
                      >
                        <User className="h-4 w-4 text-teal-600 shrink-0" />
                        <span>Author Box</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => addBlock('image')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-800 text-xs font-semibold shadow-2xs transition-colors"
            title="Insert Image Block"
          >
            <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden md:inline">Insert Image</span>
          </button>
        </div>

        {/* Center: Device / Live Preview Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setIsLivePreview(false);
              setPreviewDevice('desktop');
            }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              !isLivePreview ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Edit Canvas"
          >
            Edit Canvas
          </button>
          <button
            onClick={() => setIsLivePreview(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isLivePreview ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>

          {isLivePreview && (
            <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-200 pl-1 ml-1">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-white text-blue-600' : 'text-slate-500'}`}
                title="Desktop View"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-white text-blue-600' : 'text-slate-500'}`}
                title="Tablet View"
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-white text-blue-600' : 'text-slate-500'}`}
                title="Mobile View"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Action Tools: Settings Drawer toggle (mobile), YAML, Save Draft, Publish */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Inspector Toggle */}
          <button
            onClick={() => setShowMobileInspector(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs"
            title="Document & Block Settings"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden xs:inline">Settings</span>
          </button>

          <button
            onClick={() => setShowYamlModal(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            title="View Markdown & Sveltia YAML Frontmatter"
          >
            <Code2 className="h-3.5 w-3.5 text-slate-500" />
            <span>YAML</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* SAVE DRAFT BUTTON (Isolated to browser storage, 0 Git commits, 0 Cloudflare builds) */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isPublishing}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Save draft locally without triggering production Git commits"
          >
            {isSavingDraft ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-500" />
                <span>{lastDraftSavedAt ? `Draft (${lastDraftSavedAt})` : 'Save Draft'}</span>
              </>
            )}
          </button>

          {/* PUBLISH BUTTON (Batches all blocks, SEO, tags into 1 single production commit & 1 Cloudflare build) */}
          <button
            type="button"
            onClick={handleInitiatePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
            title="Push to production GitHub repository and deploy on Cloudflare Pages"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Publishing...</span>
              </>
            ) : saveSuccess && status === 'published' ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Published!</span>
              </>
            ) : (
              <>
                <GitBranch className="h-3.5 w-3.5 text-blue-200" />
                <span>{status === 'published' ? 'Update & Deploy' : 'Publish'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* PUBLISH / SAVE NOTIFICATION BANNER */}
      {publishSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shrink-0 z-20 animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <Check className="h-4 w-4 text-emerald-200 shrink-0" />
            <span>{publishSuccessMsg}</span>
            {realCommitUrl && (
              <a
                href={realCommitUrl}
                target="_blank"
                rel="noreferrer"
                className="underline text-emerald-100 hover:text-white font-bold inline-flex items-center gap-1 ml-2"
              >
                <span>View Commit on GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button onClick={() => setPublishSuccessMsg(null)} className="text-emerald-200 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {publishError && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shrink-0 z-20 animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-200 shrink-0" />
            <span>{publishError}</span>
          </div>
          <button onClick={() => setPublishError(null)} className="text-rose-200 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE (Independent Scroll Canvas + Desktop Sidebar)             */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-row overflow-hidden min-h-0 relative h-full w-full">
        {/* EDITING / PREVIEW CANVAS — Single Continuous Canvas that Naturally Expands */}
        <main className="flex-1 min-h-0 h-full w-full overflow-y-auto overflow-x-hidden p-3 sm:p-6 md:p-8 flex flex-col items-center bg-slate-100/70 pb-52 lg:pb-36 scroll-smooth overscroll-y-contain">
          <div
            className={`transition-all duration-200 bg-white rounded-2xl shadow-sm border border-slate-200 min-h-full h-auto flex flex-col p-4 sm:p-8 md:p-12 pb-16 sm:pb-24 box-border shrink-0 ${
              previewDevice === 'mobile'
                ? 'w-full max-w-[390px]'
                : previewDevice === 'tablet'
                ? 'w-full max-w-[768px]'
                : 'w-full max-w-4xl'
            }`}
          >
            {/* Post Title & Slug Header */}
            {!isLivePreview ? (
              <div className="mb-8 space-y-3 pb-6 border-b border-slate-100">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    // For brand-new posts only (not existing posts), auto-derive slug while user types title,
                    // unless user has explicitly customized the slug.
                    if (!originalSlug && !isExistingItem && !isSlugManuallyEdited) {
                      setSlug(
                        newTitle
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      );
                    }
                  }}
                  placeholder="Add Title..."
                  className="w-full text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 border-none outline-none focus:ring-0 placeholder-slate-300 font-serif-custom"
                />
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-mono-custom bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-400">Permalink:</span>
                  <span className="text-slate-400">{isPage ? '/' : '/posts/'}</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true);
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, '-')
                      );
                    }}
                    className="bg-transparent border-b border-slate-300 focus:border-blue-600 outline-none px-1 text-blue-600 font-medium flex-1 min-w-[120px]"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-8 space-y-3 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  <span>{category}</span>
                  <span>•</span>
                  <span>{Math.max(1, Math.ceil(blocks.length * 0.8))} min read</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-custom">
                  {title || 'Untitled Story'}
                </h1>
                <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-800">By {author}</span>
                  <span>•</span>
                  <span>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {/* LIVE PREVIEW MODE OR EDIT BLOCKS CANVAS */}
            {isLivePreview ? (
              <div className="py-2 flex-1">
                <GutenbergBlockRenderer blocks={blocks} previewMode={true} />
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col space-y-4 min-h-0">
                {blocks.map((block, index) => {
                  const isSelected = selectedBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      onClick={() => {
                        setSelectedBlockId(block.id);
                        setActiveSidebarTab('block');
                      }}
                      className={`group relative rounded-2xl p-3 sm:p-5 transition-all border ${
                        isSelected
                          ? 'border-blue-600 bg-white ring-2 ring-blue-600/20 shadow-md'
                          : 'border-transparent hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Attached Block Action Toolbar */}
                      {isSelected && (
                        <div className="flex items-center justify-between gap-1 mb-3 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-md text-xs">
                          <div className="flex items-center gap-1 font-semibold">
                            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-mono">
                              {block.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-300">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveBlock(index, 'up');
                              }}
                              disabled={index === 0}
                              className="p-1 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                              title="Move Block Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveBlock(index, 'down');
                              }}
                              disabled={index === blocks.length - 1}
                              className="p-1 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                              title="Move Block Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateBlock(index);
                              }}
                              className="p-1 hover:text-white rounded hover:bg-slate-800"
                              title="Duplicate Block"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(block.id);
                              }}
                              className="p-1 hover:text-rose-400 rounded hover:bg-slate-800"
                              title="Delete Block"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* --- BLOCK TYPE CANVASES --- */}

                      {block.type === 'heading' && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          className={`w-full font-bold tracking-tight text-slate-900 border-none outline-none focus:ring-0 bg-transparent font-serif-custom ${
                            block.settings.level === 1
                              ? 'text-3xl'
                              : block.settings.level === 3
                              ? 'text-xl'
                              : 'text-2xl'
                          }`}
                          style={{
                            color: block.settings.textColor,
                            textAlign: block.settings.align || 'left',
                          }}
                          placeholder="Heading text..."
                        />
                      )}

                      {block.type === 'paragraph' && (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          rows={Math.max(2, Math.ceil(block.content.length / 80))}
                          className={`w-full text-slate-800 border-none outline-none focus:ring-0 resize-none bg-transparent leading-relaxed ${
                            block.settings.fontSize === 'large'
                              ? 'text-lg'
                              : block.settings.fontSize === 'huge'
                              ? 'text-xl font-light'
                              : 'text-base'
                          }`}
                          style={{
                            color: block.settings.textColor,
                            textAlign: block.settings.align || 'left',
                          }}
                          placeholder="Start writing paragraph narrative..."
                        />
                      )}

                      {block.type === 'quote' && (
                        <div className="border-l-4 border-blue-600 pl-4 py-2 bg-slate-50 rounded-r-xl space-y-2">
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            rows={2}
                            className="w-full text-lg italic text-slate-800 font-serif-custom border-none outline-none resize-none bg-transparent"
                            placeholder="Quote text..."
                          />
                          <input
                            type="text"
                            value={block.settings.imageCaption || ''}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                settings: { ...block.settings, imageCaption: e.target.value },
                              })
                            }
                            placeholder="— Citation Author / Authority"
                            className="w-full text-xs font-semibold uppercase tracking-wider text-slate-500 border-none outline-none bg-transparent"
                          />
                        </div>
                      )}

                      {block.type === 'code' && (
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono-custom text-xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                            <input
                              type="text"
                              value={block.settings.codeLanguage || 'typescript'}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  settings: { ...block.settings, codeLanguage: e.target.value },
                                })
                              }
                              className="bg-transparent border-none outline-none text-slate-300 font-bold uppercase text-xs w-28"
                            />
                            <span>Editable Code</span>
                          </div>
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            rows={5}
                            className="w-full bg-transparent text-emerald-300 border-none outline-none resize-none font-mono-custom leading-relaxed"
                          />
                        </div>
                      )}

                      {block.type === 'image' && (
                        <div className="space-y-3">
                          {!block.settings.imageUrl && !block.content ? (
                            /* WordPress Gutenberg Image Placeholder */
                            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-8 bg-slate-50/80 text-center transition-all hover:bg-slate-50 hover:border-blue-400">
                              <div className="max-w-md mx-auto space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                                  <ImageIcon className="h-6 w-6" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800">Image</h4>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Upload an image file from your computer, choose from the Media Library, or insert a web URL.
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                  {/* Upload from Device */}
                                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors">
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>{isUploadingImage[block.id] ? 'Uploading...' : 'Upload Image'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleBlockFileUpload(block.id, file);
                                      }}
                                      className="hidden"
                                      disabled={isUploadingImage[block.id]}
                                    />
                                  </label>

                                  {/* Media Library */}
                                  <button
                                    type="button"
                                    onClick={() => openMediaPickerForBlock(block.id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
                                  >
                                    <Folder className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Media Library</span>
                                  </button>

                                  {/* Insert from URL */}
                                  <button
                                    type="button"
                                    onClick={() => setShowUrlForm((prev) => ({ ...prev, [block.id]: !prev[block.id] }))}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs transition-colors"
                                  >
                                    <Globe className="h-3.5 w-3.5" />
                                    <span>Insert from URL</span>
                                  </button>
                                </div>

                                {/* Expandable URL Input Form */}
                                {showUrlForm[block.id] && (
                                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                                    <input
                                      type="url"
                                      placeholder="https://example.com/image.jpg"
                                      value={insertUrlInputs[block.id] || ''}
                                      onChange={(e) => setInsertUrlInputs((prev) => ({ ...prev, [block.id]: e.target.value }))}
                                      className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = insertUrlInputs[block.id]?.trim();
                                        if (url) {
                                          updateBlock(block.id, {
                                            content: url,
                                            settings: {
                                              ...block.settings,
                                              imageUrl: url,
                                              imageAlt: 'External image',
                                              align: 'center',
                                            },
                                          });
                                          setShowUrlForm((prev) => ({ ...prev, [block.id]: false }));
                                        }
                                      }}
                                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Configured Image with Attached Gutenberg Toolbar */
                            <div className="space-y-2">
                              {/* Attached Toolbar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-900 text-white rounded-xl text-xs shadow-md">
                                {/* Alignment */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase px-1">Align:</span>
                                  <button
                                    type="button"
                                    onClick={() => updateBlock(block.id, { settings: { ...block.settings, align: 'left' } })}
                                    className={`p-1 rounded ${block.settings.align === 'left' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
                                    title="Align Left"
                                  >
                                    <AlignLeft className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateBlock(block.id, { settings: { ...block.settings, align: 'center' } })}
                                    className={`p-1 rounded ${!block.settings.align || block.settings.align === 'center' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
                                    title="Align Center"
                                  >
                                    <AlignCenter className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateBlock(block.id, { settings: { ...block.settings, align: 'right' } })}
                                    className={`p-1 rounded ${block.settings.align === 'right' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
                                    title="Align Right"
                                  >
                                    <AlignRight className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                {/* Width Presets */}
                                <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Size:</span>
                                  {['25%', '50%', '75%', '100%'].map((w) => (
                                    <button
                                      key={w}
                                      type="button"
                                      onClick={() => updateBlock(block.id, { settings: { ...block.settings, borderRadius: w } })}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        block.settings.borderRadius === w || (!block.settings.borderRadius && w === '100%')
                                          ? 'bg-blue-600 text-white'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {w}
                                    </button>
                                  ))}
                                </div>

                                {/* Actions: Replace, Library, Clear */}
                                <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
                                  <label className="cursor-pointer text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800">
                                    <Upload className="h-3 w-3" />
                                    <span>Replace</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleBlockFileUpload(block.id, file);
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => openMediaPickerForBlock(block.id)}
                                    className="text-[11px] font-semibold text-slate-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800"
                                  >
                                    Library
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateBlock(block.id, {
                                        content: '',
                                        settings: { ...block.settings, imageUrl: '' },
                                      });
                                    }}
                                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-slate-800"
                                    title="Remove Image"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              {/* The Image Element */}
                              <div
                                className={`overflow-hidden rounded-xl bg-slate-100 border border-slate-200 transition-all ${
                                  block.settings.align === 'left'
                                    ? 'mr-auto'
                                    : block.settings.align === 'right'
                                    ? 'ml-auto'
                                    : 'mx-auto'
                                }`}
                                style={{
                                  maxWidth:
                                    block.settings.borderRadius === '25%'
                                      ? '25%'
                                      : block.settings.borderRadius === '50%'
                                      ? '50%'
                                      : block.settings.borderRadius === '75%'
                                      ? '75%'
                                      : '100%',
                                }}
                              >
                                <EditorImagePreview
                                  src={block.settings.imageUrl || block.content}
                                  alt={block.settings.imageAlt || ''}
                                  className="w-full h-auto object-cover max-h-[500px]"
                                />
                              </div>

                              {/* Inline Inputs for Caption and Alt */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                <input
                                  type="text"
                                  value={block.settings.imageCaption || ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      settings: { ...block.settings, imageCaption: e.target.value },
                                    })
                                  }
                                  placeholder="Write caption (visible below image)..."
                                  className="text-xs text-slate-600 italic bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 py-1 px-1 outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.settings.imageAlt || ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      settings: { ...block.settings, imageAlt: e.target.value },
                                    })
                                  }
                                  placeholder="Alternative text (for accessibility & SEO)..."
                                  className="text-xs text-slate-500 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 py-1 px-1 outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- REBUILT FAQ / ACCORDION BLOCK CANVAS --- */}
                      {block.type === 'accordion' && (
                        <div className="space-y-3 bg-purple-50/40 p-3 sm:p-5 rounded-2xl border border-purple-200/80">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-5 w-5 text-purple-600" />
                              <span className="font-bold text-sm text-purple-950">
                                Frequently Asked Questions (FAQ)
                              </span>
                              <span className="text-[11px] bg-purple-200/80 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                                {(block.settings.accordionItems || []).length} Q&A
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addAccordionItem(block.id);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white border border-purple-200 hover:border-purple-300 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Question</span>
                            </button>
                          </div>

                          {!block.settings.accordionItems || block.settings.accordionItems.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-purple-200">
                              <HelpCircle className="h-8 w-8 mx-auto mb-1 text-purple-300" />
                              <p className="text-xs font-semibold text-slate-600">No FAQ questions added yet.</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Click "Add Question" to insert your first Question & Answer.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {block.settings.accordionItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white rounded-xl border border-purple-100 shadow-2xs p-3.5 space-y-2.5 transition-all hover:border-purple-300"
                                >
                                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
                                    <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">
                                        {idx + 1}
                                      </span>
                                      <span>Question #{idx + 1}</span>
                                    </span>
                                    <div className="flex items-center gap-1 text-slate-400">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveAccordionItem(block.id, idx, 'up');
                                        }}
                                        className="p-1 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                                        title="Move Up"
                                      >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === (block.settings.accordionItems?.length || 1) - 1}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveAccordionItem(block.id, idx, 'down');
                                        }}
                                        className="p-1 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                                        title="Move Down"
                                      >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeAccordionItem(block.id, idx);
                                        }}
                                        className="p-1 hover:text-rose-600 rounded hover:bg-rose-50"
                                        title="Delete Question"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                      Question Headline
                                    </label>
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) => updateAccordionItem(block.id, idx, 'title', e.target.value)}
                                      placeholder="Enter FAQ Question..."
                                      className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-slate-50/70 border border-slate-200 rounded-lg p-2 focus:bg-white focus:border-purple-500 outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                      Answer Explanation
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={item.content}
                                      onChange={(e) => updateAccordionItem(block.id, idx, 'content', e.target.value)}
                                      placeholder="Enter detailed answer..."
                                      className="w-full text-xs text-slate-700 bg-slate-50/70 border border-slate-200 rounded-lg p-2 focus:bg-white focus:border-purple-500 outline-none resize-none leading-relaxed"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-purple-700 pt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                              <span>Auto-generates Google FAQPage Schema.org JSON-LD</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addAccordionItem(block.id);
                              }}
                              className="font-bold hover:underline"
                            >
                              + Add Another
                            </button>
                          </div>
                        </div>
                      )}

                      {block.type === 'columns' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(block.settings.columns || []).map((col, cIdx) => (
                            <div key={col.id || cIdx} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                                Column {cIdx + 1}
                              </span>
                              <textarea
                                value={col.content}
                                onChange={(e) => {
                                  const newCols = [...(block.settings.columns || [])];
                                  newCols[cIdx] = { ...newCols[cIdx], content: e.target.value };
                                  updateBlock(block.id, {
                                    settings: { ...block.settings, columns: newCols },
                                  });
                                }}
                                rows={3}
                                className="w-full text-xs text-slate-700 bg-transparent border-none outline-none resize-none leading-relaxed"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {block.type === 'alert' && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm">
                          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            className="w-full bg-transparent border-none outline-none font-medium"
                            placeholder="Alert message content..."
                          />
                        </div>
                      )}

                      {block.type === 'button' && (
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Button Label"
                            className="font-bold text-sm bg-blue-600 text-white px-4 py-2 rounded-xl outline-none"
                          />
                          <input
                            type="text"
                            value={block.settings.buttonUrl || ''}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                settings: { ...block.settings, buttonUrl: e.target.value },
                              })
                            }
                            placeholder="https://example.com/target-url"
                            className="text-xs border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]"
                          />
                        </div>
                      )}

                      {block.type === 'download-button' && (
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <DownloadIcon className="h-4 w-4 text-sky-600" />
                            <span>Download Button Block</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Button Label</label>
                              <input
                                type="text"
                                value={block.settings.downloadText || block.content || ''}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    content: e.target.value,
                                    settings: { ...block.settings, downloadText: e.target.value },
                                  })
                                }
                                placeholder="e.g., Download Technical Report (PDF)"
                                className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Download URL / File Link</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={block.settings.downloadUrl || ''}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      settings: { ...block.settings, downloadUrl: e.target.value },
                                    })
                                  }
                                  placeholder="https://.../document.pdf or /uploads/..."
                                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => openMediaPickerForBlock(block.id)}
                                  className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg shrink-0"
                                  title="Pick file from media library"
                                >
                                  Library
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Custom Download Filename</label>
                              <input
                                type="text"
                                value={block.settings.downloadFileName || ''}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    settings: { ...block.settings, downloadFileName: e.target.value },
                                  })
                                }
                                placeholder="e.g. AstroPress-Guide-2026.pdf"
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Button Alignment</label>
                              <div className="grid grid-cols-3 gap-1">
                                {(['left', 'center', 'right'] as const).map((al) => (
                                  <button
                                    key={al}
                                    type="button"
                                    onClick={() =>
                                      updateBlock(block.id, {
                                        settings: {
                                          ...block.settings,
                                          align: al,
                                          downloadAlignment: al,
                                        },
                                      })
                                    }
                                    className={`py-1.5 text-xs font-semibold rounded-lg border uppercase tracking-wider text-[10px] ${
                                      (block.settings.downloadAlignment || block.settings.align || 'left') === al
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {al}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Button Style</label>
                              <div className="grid grid-cols-3 gap-1">
                                {(['primary', 'secondary', 'outline'] as const).map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      updateBlock(block.id, {
                                        settings: { ...block.settings, buttonStyle: st },
                                      })
                                    }
                                    className={`py-1.5 text-xs font-semibold rounded-lg border uppercase tracking-wider text-[10px] ${
                                      (block.settings.buttonStyle || 'primary') === st
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Live Visual Alignment Preview in Canvas */}
                          <div className={`pt-2 border-t border-slate-200/60 ${
                            (block.settings.downloadAlignment || block.settings.align || 'left') === 'center'
                              ? 'text-center'
                              : (block.settings.downloadAlignment || block.settings.align || 'left') === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}>
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-2xs pointer-events-none ${
                              (block.settings.buttonStyle || 'primary') === 'secondary'
                                ? 'bg-slate-800 text-white'
                                : (block.settings.buttonStyle || 'primary') === 'outline'
                                ? 'border-2 border-slate-300 text-slate-700 bg-white'
                                : 'bg-blue-600 text-white'
                            }`}>
                              <DownloadIcon className="h-3.5 w-3.5" />
                              <span>{block.settings.downloadText || block.content || 'Download File'}</span>
                              {block.settings.downloadFileName && (
                                <span className="text-[10px] opacity-75 font-normal">({block.settings.downloadFileName})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {block.type === 'table' && (() => {
                        const td = getTableData(block);
                        const alignments = td.alignments || [];
                        return (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <TableIcon className="h-4 w-4 text-emerald-600" />
                                <span>Interactive Table ({td.rows.length} rows × {td.headers.length} cols)</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => addTableRow(block.id)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3 text-slate-500" />
                                  <span>Add Row</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addTableColumn(block.id)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3 text-slate-500" />
                                  <span>Add Column</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTablePasteBlockId(block.id);
                                    setTablePasteRawText('');
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                                >
                                  <Sparkles className="h-3 w-3 text-blue-600" />
                                  <span>Import / Paste</span>
                                </button>
                              </div>
                            </div>

                            {/* Table Paste/Import Dialog */}
                            {tablePasteBlockId === block.id && (
                              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span>Paste Markdown or HTML Table</span>
                                  <button
                                    type="button"
                                    onClick={() => setTablePasteBlockId(null)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <textarea
                                  value={tablePasteRawText}
                                  onChange={(e) => setTablePasteRawText(e.target.value)}
                                  rows={4}
                                  placeholder="| Col 1 | Col 2 |\n|---|---|\n| Data 1 | Data 2 |"
                                  className="w-full text-xs font-mono-custom p-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 outline-none resize-none"
                                />
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-slate-400">
                                    Supports GitHub Markdown (|) and HTML &lt;table&gt;
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyTablePaste(block.id, tablePasteRawText)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Apply Table Data
                                  </button>
                                </div>
                              </div>
                            )}

                            {tablePasteFeedback?.id === block.id && (
                              <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                                tablePasteFeedback.isError
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {tablePasteFeedback.msg}
                              </div>
                            )}

                            {/* Table Grid Canvas */}
                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                              <table className="w-full border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    {td.headers.map((h, cIdx) => (
                                      <th key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0">
                                        <div className="space-y-1">
                                          <input
                                            type="text"
                                            value={h}
                                            onChange={(e) => updateTableHeader(block.id, cIdx, e.target.value)}
                                            className="w-full font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 outline-none px-1 py-0.5"
                                            placeholder={`Header ${cIdx + 1}`}
                                          />
                                          <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-0.5">
                                              {(['left', 'center', 'right'] as const).map((a) => (
                                                <button
                                                  key={a}
                                                  type="button"
                                                  onClick={() => updateTableColAlignment(block.id, cIdx, a)}
                                                  className={`p-0.5 rounded text-[10px] uppercase font-mono ${
                                                    alignments[cIdx] === a || (!alignments[cIdx] && a === 'left')
                                                      ? 'bg-blue-600 text-white font-bold'
                                                      : 'text-slate-400 hover:text-slate-700'
                                                  }`}
                                                  title={`Align ${a}`}
                                                >
                                                  {a[0].toUpperCase()}
                                                </button>
                                              ))}
                                            </div>
                                            {td.headers.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => deleteTableColumn(block.id, cIdx)}
                                                className="text-slate-300 hover:text-rose-600 p-0.5"
                                                title="Delete Column"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </th>
                                    ))}
                                    <th className="w-8 p-2 bg-slate-50"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {td.rows.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-1.5 border-r border-slate-100 last:border-r-0">
                                          <input
                                            type="text"
                                            value={cell}
                                            onChange={(e) => updateTableCell(block.id, rIdx, cIdx, e.target.value)}
                                            className={`w-full p-1 text-slate-700 bg-transparent rounded outline-none focus:bg-blue-50/50 ${
                                              alignments[cIdx] === 'center'
                                                ? 'text-center'
                                                : alignments[cIdx] === 'right'
                                                ? 'text-right'
                                                : 'text-left'
                                            }`}
                                            placeholder="—"
                                          />
                                        </td>
                                      ))}
                                      <td className="w-8 p-1 text-center">
                                        {td.rows.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => deleteTableRow(block.id, rIdx)}
                                            className="text-slate-300 hover:text-rose-600 p-1"
                                            title="Delete Row"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Caption */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-slate-400">Caption:</span>
                              <input
                                type="text"
                                value={td.caption || ''}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    settings: {
                                      ...block.settings,
                                      tableData: {
                                        ...td,
                                        caption: e.target.value,
                                      },
                                    },
                                  })
                                }
                                placeholder="Optional table caption or source..."
                                className="flex-1 text-xs italic text-slate-600 border-b border-slate-200 focus:border-blue-400 bg-transparent outline-none py-0.5"
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {block.type === 'author-box' && (
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
                          <User className="h-8 w-8 text-blue-600 bg-blue-100 p-1.5 rounded-full" />
                          <div className="flex-1">
                            <span className="text-xs text-slate-400 font-semibold block">Author Showcase Block</span>
                            <span className="font-bold text-slate-800 text-sm">{author}</span>
                          </div>
                        </div>
                      )}

                      {block.type === 'divider' && (
                        <div className="py-2">
                          <hr className="border-slate-300" />
                          <span className="text-[10px] text-slate-400 block text-center mt-1">Divider Block</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* In-Canvas Quick Add Block Trigger inside the Continuous Canvas */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInserter(true)}
                    className="w-full py-3.5 px-4 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-all group"
                  >
                    <Plus className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                    <span>Add Block to Canvas</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ========================================================================= */}
        {/* 3. DESKTOP BLOCK INSPECTOR SIDEBAR (Independent Scroll on Desktop)        */}
        {/* ========================================================================= */}
        <aside className="hidden lg:flex w-80 xl:w-96 bg-white border-l border-slate-200 flex-col shrink-0 h-full min-h-0 overflow-hidden">
          {renderInspectorContent()}
        </aside>

        {/* ========================================================================= */}
        {/* 4. MOBILE / TABLET INSPECTOR DRAWER (Slide-Over Sheet)                   */}
        {/* ========================================================================= */}
        {showMobileInspector && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
            <div className="w-full sm:w-96 bg-white h-full min-h-0 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50 shrink-0">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                  <span>Document & Block Settings</span>
                </span>
                <button
                  onClick={() => setShowMobileInspector(false)}
                  className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">{renderInspectorContent()}</div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MOBILE BOTTOM ACTIONS TOOLBAR                                          */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center justify-between gap-1 shadow-lg">
        <button
          onClick={() => setShowInserter(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          <Plus className="h-3.5 w-3.5 text-blue-400" />
          <span>Add</span>
        </button>

        <button
          onClick={() => addBlock('image')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold"
        >
          <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
          <span>Image</span>
        </button>

        <button
          onClick={() => setShowMobileInspector(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
          <span>Settings</span>
        </button>

        <button
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isPublishing}
          className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold disabled:opacity-50"
        >
          {isSavingDraft ? 'Saving...' : 'Draft'}
        </button>

        <button
          onClick={handleInitiatePublish}
          disabled={isPublishing}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs disabled:opacity-50"
        >
          {isPublishing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin text-white" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>{status === 'published' ? 'Update' : 'Publish'}</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 6. PUBLISH CONFIRMATION & GITHUB ATOMIC COMMIT MODAL                      */}
      {/* ========================================================================= */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <GitBranch className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-base">Confirm Production Publish</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Target Destination Info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Target GitHub Repo:</span>
                <span className="font-mono font-bold text-slate-900">
                  {deploymentSettings.githubRepo || 'ipritamsingh/astropress'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Production Branch:</span>
                <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold font-mono">
                  {deploymentSettings.githubBranch || 'main'}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Content File:</span>
                <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold font-mono truncate max-w-[280px]">
                  {isPage ? `src/content/pages/${slug || generateSlug(title)}.md` : `src/content/posts/${slug || generateSlug(title)}.md`}
                </code>
              </div>
            </div>

            {/* Article Snapshot */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Article Title:</span>
                <span className="font-bold text-slate-900 truncate max-w-[260px]">{title}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Blocks Count:</span>
                <span className="font-bold text-slate-900">{blocks.length} blocks</span>
              </div>
              {!isPage && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Category & Tags:</span>
                  <span className="font-bold text-slate-900">{category} ({selectedTags.length} tags)</span>
                </div>
              )}
            </div>

            {/* Commit Message Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5 text-purple-600" />
                <span>Git Commit Message</span>
              </label>
              <input
                type="text"
                value={customCommitMsg}
                onChange={(e) => setCustomCommitMsg(e.target.value)}
                placeholder="e.g. feat(content): publish new guide"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-none focus:border-blue-500"
              />
            </div>

            {/* GitHub Token Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-blue-600" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {modalGithubToken ? 'Token configured' : 'Optional for live GitHub sync'}
                </span>
              </label>
              <input
                type="password"
                value={modalGithubToken}
                onChange={(e) => setModalGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-none focus:border-blue-500"
              />
            </div>

            {/* Token Notice */}
            {!modalGithubToken && !sessionToken && !deploymentSettings.githubToken && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">No GitHub Token Entered</span>
                  <p className="text-[11px] leading-relaxed">
                    Changes will be saved to your local Astro collections. To push directly to your live GitHub repository and trigger Cloudflare Pages deployment, enter your PAT above or configure it in <strong>Admin &gt; GitHub &amp; Deployment</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Batch Deployment Protection Note */}
            {modalGithubToken || sessionToken || deploymentSettings.githubToken ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">1 Atomic Commit &amp; 1 Push Deployment</span>
                  <p className="text-[11px] leading-relaxed">
                    All accumulated updates and this article will be bundled into <strong>exactly 1 Git commit</strong> and <strong>1 push</strong>, triggering only 1 Cloudflare Pages build.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Push Batching Protection Active</span>
                  <p className="text-[11px] leading-relaxed">
                    This post will be published and staged in Preview immediately with 0 GitHub pushes. Enter your token above or deploy all accumulated changes later in <strong>Admin &gt; GitHub &amp; Deployment</strong>.
                  </p>
                </div>
              </div>
            )}

            {isPublishing && deployProgressText && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5 animate-pulse">
                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                <span className="font-mono text-[11px] font-medium">{deployProgressText}</span>
              </div>
            )}

            {publishError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{publishError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{deployProgressText || 'Deploying to GitHub...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    <span>
                      {modalGithubToken || sessionToken || deploymentSettings.githubToken
                        ? 'Confirm & Deploy to GitHub (1 Push)'
                        : 'Confirm & Publish to Preview (Stage for Push)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MEDIA SELECTOR MODAL (Full Integrated Media Library)                   */}
      {/* ========================================================================= */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  <span>Choose or Upload Media Asset</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select an existing image from your library or upload a new asset directly to persistent storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMediaPicker(false);
                  setMediaPickerTarget(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-2xl p-1 leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <MediaLibrary
                media={mediaLibrary}
                onAddMedia={onAddMedia || (() => {})}
                onUpdateMedia={onUpdateMedia}
                onDeleteMedia={onDeleteMedia || (() => {})}
                onSelectMedia={handleSelectMediaAsset}
                isModalPicker={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. GIT MARKDOWN & SVELTIA YAML PREVIEW MODAL                              */}
      {/* ========================================================================= */}
      {showYamlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 text-slate-100 rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Git-Backed File Preview (Sveltia + Astro Markdown)</h3>
              </div>
              <button
                onClick={() => setShowYamlModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-slate-400">
              This exact content is compiled and committed to your GitHub repository at{' '}
              <code className="text-emerald-400">src/content/posts/{slug}.md</code>. Sveltia CMS and Astro read this file seamlessly.
            </p>
            <pre className="flex-1 overflow-auto bg-slate-900 p-4 rounded-xl text-xs font-mono-custom text-emerald-300 leading-relaxed border border-slate-800">
              {generateYamlFrontmatter()}
            </pre>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateYamlFrontmatter());
                  alert('Copied Markdown + Frontmatter to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Copy YAML Frontmatter
              </button>
              <button
                onClick={() => setShowYamlModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
