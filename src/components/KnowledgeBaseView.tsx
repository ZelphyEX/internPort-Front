import React, { useRef, useState } from 'react';
import {
  FolderGit2,
  Search,
  FileText,
  Download,
  Eye,
  Tag,
  User,
  Calendar,
  X,
  ExternalLink,
  Trash2,
  Plus,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { DocumentResource, UserRole } from '../types';
import { canManageContent } from '../services/permissions';
import { documentsApi, tokenStore, ApiError } from '../services/api';

interface KnowledgeBaseViewProps {
  documents: DocumentResource[];
  currentRole?: UserRole;
  onDeleteDocument?: (documentId: string) => void;
  onAddDocument?: (newDoc: DocumentResource) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ documents, currentRole, onDeleteDocument, onAddDocument }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewDoc, setPreviewDoc] = useState<DocumentResource | null>(null);

  // Admin chỉ xem thư viện; thêm/xoá tài liệu là việc của Mentor.
  const canManage = canManageContent(currentRole ?? 'INTERN');

  const handleDeleteClick = (e: React.MouseEvent, docId: string, docTitle: string) => {
    e.stopPropagation();
    if (!onDeleteDocument) return;
    const confirmed = window.confirm(`Xoá tài liệu "${docTitle}"?\nHành động này không thể hoàn tác.`);
    if (!confirmed) return;
    onDeleteDocument(docId);
  };

  // --- Thêm Tài Liệu Mới ---
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<DocumentResource['category']>('Onboarding');
  const [newDocAuthor, setNewDocAuthor] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocTags, setNewDocTags] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Backend giới hạn MAX_UPLOAD_MB (mặc định 25MB) -> chặn sớm ở client cho rõ lỗi.
  const MAX_UPLOAD_MB = 25;

  /** Đuôi file -> định dạng hiển thị. Suy ra từ file, KHÔNG để người dùng tự chọn. */
  const detectFileType = (fileName: string): DocumentResource['fileType'] => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'PDF';
    if (ext === 'doc' || ext === 'docx') return 'DOCX';
    if (ext === 'ppt' || ext === 'pptx') return 'SLIDE';
    return 'MD';
  };

  /** Số byte -> chuỗi dễ đọc ("845 KB", "2.4 MB"). */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetDocForm = () => {
    setIsAddingDoc(false);
    setNewDocTitle('');
    setNewDocCategory('Onboarding');
    setNewDocAuthor('');
    setNewDocDescription('');
    setNewDocTags('');
    setNewDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setNewDocFile(null);
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      alert(`File vượt quá giới hạn ${MAX_UPLOAD_MB}MB của hệ thống. Hãy chọn file nhỏ hơn.`);
      e.target.value = '';
      setNewDocFile(null);
      return;
    }
    setNewDocFile(file);
    // Chưa nhập tên thì lấy luôn tên file (bỏ phần đuôi) cho tiện.
    if (!newDocTitle.trim()) {
      setNewDocTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  // Tải file lên bucket trước (POST /documents/upload -> content_url), rồi mới tạo
  // bản ghi tài liệu. Định dạng + dung lượng lấy thẳng từ file, không nhập tay.
  const handleCreateDocument = async () => {
    if (!newDocTitle.trim() || !onAddDocument) return;
    if (!newDocFile) {
      alert('Hãy chọn file tài liệu để tải lên.');
      return;
    }
    if (!tokenStore.isAuthenticated()) {
      alert('Cần đăng nhập bằng tài khoản thật để tải tệp lên hệ thống.');
      return;
    }

    setUploading(true);
    try {
      const { content_url } = await documentsApi.upload(newDocFile);

      const newDoc: DocumentResource = {
        id: `DOC-${Date.now().toString().slice(-6)}`,
        title: newDocTitle.trim(),
        category: newDocCategory,
        author: newDocAuthor.trim() || 'Gimasys Team',
        updatedAt: new Date().toISOString().slice(0, 10),
        fileType: detectFileType(newDocFile.name),
        fileSize: formatFileSize(newDocFile.size),
        downloadCount: 0,
        description: newDocDescription.trim() || 'Tài liệu nội bộ Gimasys.',
        tags: newDocTags.split(',').map(t => t.trim()).filter(Boolean),
        contentUrl: content_url,
      };
      onAddDocument(newDoc);
      resetDocForm();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Tải tệp lên thất bại. Kiểm tra kết nối mạng rồi thử lại.');
    } finally {
      setUploading(false);
    }
  };

  /** Mở / tải file thật. Tài liệu cũ chưa có file thì báo rõ thay vì im lặng. */
  const openDocument = (doc: DocumentResource) => {
    if (!doc.contentUrl) {
      alert('Tài liệu này chưa đính kèm file. Hãy tạo lại tài liệu và tải file lên.');
      return;
    }
    window.open(doc.contentUrl, '_blank', 'noreferrer');
  };

  const categories = ['ALL', 'CCA-F Certificate', 'Coding Standard', 'Onboarding', 'Architecture', 'Template'];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesSearch = 
      !searchTerm ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getFileTypeBadge = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SLIDE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DOCX':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Thư viện Tài liệu & Quy trình Gimasys</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kho lưu trữ quy chuẩn coding, tài liệu kiến trúc, tài liệu onboarding và mẫu báo cáo chính thức
          </p>
        </div>

        {canManage && onAddDocument && (
          <button
            type="button"
            onClick={() => setIsAddingDoc(prev => !prev)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Liệu Mới</span>
          </button>
        )}
      </div>

      {/* FORM: Thêm Tài Liệu Mới */}
      {isAddingDoc && canManage && onAddDocument && (
        <div className="bg-blue-50/80 dark:bg-blue-950/20 border-2 border-blue-400 dark:border-blue-800 rounded-2xl p-5 shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-blue-950 dark:text-blue-200 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Thêm Tài Liệu Mới Vào Thư Viện</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingDoc(false)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tên Tài Liệu *</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="VD: Hướng dẫn Git Workflow chuẩn Gimasys"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Danh Mục</label>
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value as DocumentResource['category'])}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              >
                <option value="CCA-F Certificate">CCA-F Certificate</option>
                <option value="Coding Standard">Coding Standard</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Architecture">Architecture</option>
                <option value="Template">Template</option>
                <option value="API Docs">API Docs</option>
              </select>
            </div>

            {/* Chọn file: định dạng & dung lượng suy ra từ chính file, không nhập tay */}
            <div className="md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tệp Tài Liệu *</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handlePickFile}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-3 bg-white dark:bg-slate-900 border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 rounded-xl transition-colors text-left cursor-pointer"
              >
                <UploadCloud className="w-5 h-5 text-blue-600 shrink-0" />
                {newDocFile ? (
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-900 dark:text-slate-100 truncate">{newDocFile.name}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {detectFileType(newDocFile.name)} • {formatFileSize(newDocFile.size)} — bấm để chọn tệp khác
                    </span>
                  </span>
                ) : (
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-700 dark:text-slate-200">Chọn tệp để tải lên</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      PDF, Word, PowerPoint, ảnh... — tối đa {MAX_UPLOAD_MB}MB. Định dạng và dung lượng tự nhận từ tệp.
                    </span>
                  </span>
                )}
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tác Giả</label>
              <input
                type="text"
                value={newDocAuthor}
                onChange={(e) => setNewDocAuthor(e.target.value)}
                placeholder="VD: Gimasys Tech Team"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Mô Tả Nội Dung</label>
              <input
                type="text"
                value={newDocDescription}
                onChange={(e) => setNewDocDescription(e.target.value)}
                placeholder="VD: Quy trình chuẩn tạo nhánh, commit, review Pull Request tại Gimasys."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tags (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={newDocTags}
                onChange={(e) => setNewDocTags(e.target.value)}
                placeholder="VD: git, workflow, onboarding"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 pt-1">
            <button
              type="button"
              onClick={resetDocForm}
              disabled={uploading}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleCreateDocument}
              disabled={uploading || !newDocFile || !newDocTitle.trim()}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-xs inline-flex items-center gap-1.5"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{uploading ? 'Đang tải tệp lên...' : 'Tải Lên & Lưu Tài Liệu'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tài liệu, quy chuẩn, mẫu slide..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group"
          >
            {canManage && onDeleteDocument && (
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, doc.id, doc.title)}
                title="Xoá Tài Liệu Này"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between pr-6">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getFileTypeBadge(doc.fileType)}`}>
                  {doc.fileType} • {doc.fileSize}
                </span>
                <span className="text-[11px] font-bold text-slate-400">{doc.category}</span>
              </div>

              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-snug">{doc.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{doc.description}</p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {doc.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{doc.author}</p>
                <p className="text-[10px] text-slate-400">Cập nhật: {doc.updatedAt}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem</span>
                </button>

                <button
                  onClick={() => openDocument(doc)}
                  title={doc.contentUrl ? 'Mở tài liệu' : 'Tài liệu này chưa đính kèm file'}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Truy cập</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p><strong>Định dạng file:</strong> {previewDoc.fileType} ({previewDoc.fileSize})</p>
              <p><strong>Tác giả:</strong> {previewDoc.author}</p>
              <p><strong>Danh mục:</strong> {previewDoc.category}</p>
              <p><strong>Mô tả chi tiết:</strong> {previewDoc.description}</p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3">
              <span>Tài liệu nội bộ thuộc bản quyền Công ty Gimasys.</span>
              <button
                onClick={() => openDocument(previewDoc)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                {previewDoc.contentUrl ? 'Truy cập tài liệu' : 'Chưa có file'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
