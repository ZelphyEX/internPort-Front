import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { DocumentResource } from '../types';

interface KnowledgeBaseViewProps {
  documents: DocumentResource[];
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ documents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewDoc, setPreviewDoc] = useState<DocumentResource | null>(null);

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
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Thư viện Tài liệu & Quy trình Gimasys</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kho lưu trữ quy chuẩn coding, tài liệu kiến trúc, tài liệu onboarding và mẫu báo cáo chính thức
        </p>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tài liệu, quy chuẩn, mẫu slide..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
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
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getFileTypeBadge(doc.fileType)}`}>
                  {doc.fileType} • {doc.fileSize}
                </span>
                <span className="text-[11px] font-bold text-slate-400">{doc.category}</span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base leading-snug">{doc.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{doc.description}</p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {doc.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">{doc.author}</p>
                <p className="text-[10px] text-slate-400">Cập nhật: {doc.updatedAt}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem</span>
                </button>

                <button
                  onClick={() => alert(`Đang tải xuống tài liệu: ${doc.title}`)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p><strong>Định dạng file:</strong> {previewDoc.fileType} ({previewDoc.fileSize})</p>
              <p><strong>Tác giả:</strong> {previewDoc.author}</p>
              <p><strong>Danh mục:</strong> {previewDoc.category}</p>
              <p><strong>Mô tả chi tiết:</strong> {previewDoc.description}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
              <span>Tài liệu nội bộ thuộc bản quyền Công ty Gimasys.</span>
              <button
                onClick={() => {
                  alert(`Đã kích hoạt tải file ${previewDoc.title}`);
                  setPreviewDoc(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Tải xuống bản chính thức
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
