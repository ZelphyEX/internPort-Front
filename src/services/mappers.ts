// ============================================================================
// Mappers — chuyển đổi giữa shape API (đặc tả) và shape Frontend (types.ts)
// API dùng id number, full_name, avatar_url, content_url...
// FE dùng id string, name, avatar, downloadUrl... nên cần lớp trung gian này.
// ============================================================================

import type {
  ApiUser,
  ApiDocument,
  ApiDocType,
  ApiGroup,
} from './api';
import type {
  AuthUser,
  UserRole,
  DocumentResource,
  Group,
  GroupMember,
} from '../types';

// ---- User -----------------------------------------------------------------

/** ApiUser (server) -> AuthUser (frontend session). */
export function apiUserToAuthUser(u: ApiUser): AuthUser {
  return {
    id: String(u.id),
    name: u.full_name,
    email: u.email,
    role: u.role as UserRole,
    roleTitle:
      u.role === 'ADMIN'
        ? 'Quản trị viên / HR Manager'
        : u.role === 'MENTOR'
        ? 'Mentor Hướng dẫn Kỹ thuật'
        : 'Thực tập sinh Gimasys',
    avatar:
      u.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    internId: u.role === 'INTERN' ? String(u.id) : undefined,
  };
}

// ---- Document -------------------------------------------------------------

const API_TYPE_TO_FE_FILETYPE: Record<ApiDocType, DocumentResource['fileType']> = {
  PDF: 'PDF',
  ARTICLE: 'MD',
  LINK: 'MD',
  VIDEO: 'SLIDE',
};

/** ApiDocument (server) -> DocumentResource (frontend). */
export function apiDocumentToResource(d: ApiDocument): DocumentResource {
  return {
    id: String(d.id),
    title: d.title,
    category: (d.tags && d.tags[0]) || 'API Docs',
    author: 'Gimasys',
    updatedAt: d.created_at,
    fileType: API_TYPE_TO_FE_FILETYPE[d.type] || 'MD',
    fileSize: '—',
    downloadCount: 0,
    description: d.description,
    tags: d.tags || [],
  };
}

/** FE fileType -> API type (khi tạo tài liệu mới). */
export function feFileTypeToApiType(ft: DocumentResource['fileType']): ApiDocType {
  switch (ft) {
    case 'PDF':
      return 'PDF';
    case 'SLIDE':
      return 'VIDEO';
    case 'DOCX':
    case 'MD':
    default:
      return 'ARTICLE';
  }
}

// ---- Group ----------------------------------------------------------------

/** ApiGroup (server) -> Group (frontend). */
export function apiGroupToGroup(g: ApiGroup, createdBy = ''): Group {
  const members: GroupMember[] = (g.members || []).map((m) => ({
    userId: String(m.id),
    userName: m.full_name,
    userEmail: m.email,
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    role: (m.role || 'INTERN') as UserRole,
    status: 'Approved',
    joinedAt: new Date().toISOString(),
  }));
  return {
    id: String(g.id),
    name: g.name,
    code: g.cohort || '',
    createdBy,
    createdAt: new Date().toISOString(),
    members,
  };
}
