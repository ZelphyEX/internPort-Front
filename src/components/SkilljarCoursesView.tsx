import React, { useState } from 'react';
import { 
  GraduationCap, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Edit2, 
  Search, 
  Award, 
  BookOpen, 
  Link as LinkIcon, 
  X,
  Sparkles,
  TrendingUp,
  Layers,
  MessageSquare,
  Users,
  Send,
  Code2,
  Check,
  Bell,
  Eye,
  Filter,
  UserCheck
} from 'lucide-react';
import { Department, TrainingModule, CourseMajorTask, CourseSection, UserRole, CourseComment, AuthUser, Intern } from '../types';

interface SkilljarCoursesViewProps {
  modules: TrainingModule[];
  onUpdateModules: (updatedModules: TrainingModule[]) => void;
  onNavigateToTab?: (tab: any) => void;
  currentRole: UserRole;
  currentUser?: AuthUser | null;
  interns?: Intern[];
}

export const SkilljarCoursesView: React.FC<SkilljarCoursesViewProps> = ({
  modules,
  onUpdateModules,
  onNavigateToTab,
  currentRole,
  currentUser,
  interns = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'tracking'>('courses');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing Skilljar URL State
  const [editingSkilljarTaskId, setEditingSkilljarTaskId] = useState<{ moduleId: string; taskId: string } | null>(null);
  const [skilljarUrlInput, setSkilljarUrlInput] = useState<string>('');

  // Modal / Form state for Adding New Major Course Task
  const [addingTaskForModuleId, setAddingTaskForModuleId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskSkilljarUrl, setNewTaskSkilljarUrl] = useState<string>('https://anthropic.skilljar.com/');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');

  // Form state for Adding New Section
  const [addingSectionForTaskId, setAddingSectionForTaskId] = useState<{ moduleId: string; taskId: string } | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');
  const [newSectionMinutes, setNewSectionMinutes] = useState<number>(25);

  // Q&A / Discussion State per task
  const [expandedCommentsTaskId, setExpandedCommentsTaskId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [taskId: string]: { text: string; code: string; showCodeInput: boolean } }>({});

  // Mentor Tracker State
  const [selectedInternForDetails, setSelectedInternForDetails] = useState<Intern | null>(null);
  const [trackerToast, setTrackerToast] = useState<string | null>(null);

  // Create New Dự Án / Module State (Mentor tự tạo module đào tạo mới, không bị giới hạn dữ liệu mẫu)
  const [isAddingModule, setIsAddingModule] = useState<boolean>(false);
  const [newModuleTitle, setNewModuleTitle] = useState<string>('');
  const [newModuleTrack, setNewModuleTrack] = useState<Department>('Cloud & DevOps');
  const [newModuleWeek, setNewModuleWeek] = useState<number>(1);
  const [newModuleDuration, setNewModuleDuration] = useState<string>('2 tuần');
  const [newModuleDescription, setNewModuleDescription] = useState<string>('');

  const trackOptions: Department[] = ['Cloud & DevOps', 'Java Back-End', 'React Front-End', 'AI & Data Science', 'Salesforce / ERP'];

  const tracks = ['ALL', 'Cloud & DevOps', 'Java Back-End', 'React Front-End', 'AI & Data Science', 'Salesforce / ERP'];

  // Toggle Section Completion Checkbox
  const handleToggleSection = (moduleId: string, taskId: string, sectionId: string) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        const updatedSections = task.sections.map(sec => {
          if (sec.id !== sectionId) return sec;
          return { ...sec, completed: !sec.completed };
        });
        const allCompleted = updatedSections.length > 0 && updatedSections.every(s => s.completed);
        return { ...task, sections: updatedSections, completed: allCompleted };
      });
      return { ...mod, majorTasks: updatedTasks };
    });
    onUpdateModules(updated);
  };

  // Save Skilljar URL
  const handleSaveSkilljarUrl = (moduleId: string, taskId: string) => {
    if (!skilljarUrlInput.trim()) return;
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        return { ...task, skilljarUrl: skilljarUrlInput.trim() };
      });
      return { ...mod, majorTasks: updatedTasks };
    });
    onUpdateModules(updated);
    setEditingSkilljarTaskId(null);
    setSkilljarUrlInput('');
  };

  // Create Major Course Task
  const handleCreateMajorTask = (moduleId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: CourseMajorTask = {
      id: `MJT-${Date.now().toString().slice(-4)}`,
      title: newTaskTitle.trim(),
      skilljarUrl: newTaskSkilljarUrl.trim() || 'https://anthropic.skilljar.com/',
      description: newTaskDescription.trim() || 'Nội dung khóa học & thực hành trên hệ thống Anthropic Skilljar LMS.',
      completed: false,
      sections: [
        { id: `SEC-${Date.now()}-1`, title: 'Section 1.1: Lý thuyết Tổng quan trên Anthropic Skilljar', completed: false, estimatedMinutes: 20 },
        { id: `SEC-${Date.now()}-2`, title: 'Section 1.2: Lab Thực hành & Quiz Đánh giá', completed: false, estimatedMinutes: 30 }
      ]
    };

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        majorTasks: [...(mod.majorTasks || []), newTask]
      };
    });
    onUpdateModules(updated);

    setAddingTaskForModuleId(null);
    setNewTaskTitle('');
    setNewTaskSkilljarUrl('https://anthropic.skilljar.com/');
    setNewTaskDescription('');
  };

  // Create Section
  const handleCreateSection = (moduleId: string, taskId: string) => {
    if (!newSectionTitle.trim()) return;
    const newSec: CourseSection = {
      id: `SEC-${Date.now().toString().slice(-4)}`,
      title: newSectionTitle.trim(),
      completed: false,
      estimatedMinutes: Number(newSectionMinutes) || 25
    };

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          sections: [...task.sections, newSec]
        };
      });
      return { ...mod, majorTasks: updatedTasks };
    });
    onUpdateModules(updated);

    setAddingSectionForTaskId(null);
    setNewSectionTitle('');
    setNewSectionMinutes(25);
  };

  // Add Comment/Q&A
  const handleAddComment = (moduleId: string, taskId: string) => {
    const input = commentInputs[taskId];
    if (!input || !input.text.trim()) return;

    const newComment: CourseComment = {
      id: `CMT-${Date.now()}`,
      courseTaskId: taskId,
      authorId: currentUser?.id || 'USR-ANON',
      authorName: currentUser?.name || (currentRole === 'INTERN' ? 'Học viên (Intern)' : 'Mentor Gimasys'),
      authorRole: currentRole,
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      content: input.text.trim(),
      createdAt: 'Mới xong',
      codeSnippet: input.code.trim() || undefined,
      isResolved: false
    };

    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        const existingComments = task.comments || [];
        return { ...task, comments: [...existingComments, newComment] };
      });
      return { ...mod, majorTasks: updatedTasks };
    });

    onUpdateModules(updated);
    setCommentInputs(prev => ({
      ...prev,
      [taskId]: { text: '', code: '', showCodeInput: false }
    }));
  };

  // Toggle Resolve Comment
  const handleToggleResolveComment = (moduleId: string, taskId: string, commentId: string) => {
    const updated = modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        const updatedComments = (task.comments || []).map(cmt => {
          if (cmt.id !== commentId) return cmt;
          return { ...cmt, isResolved: !cmt.isResolved };
        });
        return { ...task, comments: updatedComments };
      });
      return { ...mod, majorTasks: updatedTasks };
    });
    onUpdateModules(updated);
  };

  // Create New Dự Án / Module (Mentor tự tạo, không giới hạn ở dữ liệu mẫu có sẵn)
  const handleCreateModule = () => {
    if (!newModuleTitle.trim()) return;
    const newModule: TrainingModule = {
      id: `MOD-${Date.now().toString().slice(-6)}`,
      track: newModuleTrack,
      weekNumber: Number(newModuleWeek) || 1,
      title: newModuleTitle.trim(),
      duration: newModuleDuration.trim() || '2 tuần',
      description: newModuleDescription.trim() || 'Dự án / module đào tạo mới do Mentor tự khởi tạo.',
      keySkills: [],
      resourcesCount: 0,
      status: 'Not Started',
      majorTasks: []
    };

    onUpdateModules([...modules, newModule]);

    setIsAddingModule(false);
    setNewModuleTitle('');
    setNewModuleTrack('Cloud & DevOps');
    setNewModuleWeek(1);
    setNewModuleDuration('2 tuần');
    setNewModuleDescription('');
  };

  const handleSendReminder = (internName: string) => {
    setTrackerToast(`Đã gửi thông báo nhắc nhở học bài Skilljar thành công cho ${internName}!`);
    setTimeout(() => setTrackerToast(null), 3000);
  };

  // Calculate LMS Statistics across modules
  let totalCoursesCount = 0;
  let totalSectionsCount = 0;
  let completedSectionsCount = 0;

  modules.forEach(mod => {
    const tasks = mod.majorTasks || [];
    totalCoursesCount += tasks.length;
    tasks.forEach(t => {
      totalSectionsCount += t.sections.length;
      completedSectionsCount += t.sections.filter(s => s.completed).length;
    });
  });

  const overallProgressPercent = totalSectionsCount > 0 ? Math.round((completedSectionsCount / totalSectionsCount) * 100) : 0;

  // Filter Modules by Track & Search
  const filteredModules = modules.filter(mod => {
    const matchesTrack = selectedTrack === 'ALL' || mod.track === selectedTrack;
    if (!matchesTrack) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesModuleTitle = mod.title.toLowerCase().includes(query);
    const matchesTaskTitle = (mod.majorTasks || []).some(t => 
      t.title.toLowerCase().includes(query) || 
      (t.skilljarUrl && t.skilljarUrl.toLowerCase().includes(query)) ||
      t.sections.some(s => s.title.toLowerCase().includes(query))
    );
    return matchesModuleTitle || matchesTaskTitle;
  });

  return (
    <div className="p-6 space-y-6 pb-16">
      
      {/* Feature Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-orange-200">
              <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
              <span>Anthropic Skilljar LMS Portal</span>
            </span>
            {currentRole === 'INTERN' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase border border-emerald-300">
                Chế độ Học viên (Read-Only Course Edit)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase border border-blue-300">
                Chế độ Mentor / Admin (Full LMS Manager)
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Quản lý Khóa học & Bài học Anthropic Skilljar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chức năng liên kết trực tiếp các khoá học lớn từ <strong>anthropic.skilljar.com</strong> (Claude 101, Building API, CCA-F,...) với các Section nhỏ để học viên tự tick theo dõi tiến độ.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentRole !== 'INTERN' && (
            <button
              type="button"
              onClick={() => setIsAddingModule(prev => !prev)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-500"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Dự Án / Module Mới</span>
            </button>
          )}

          <a
            href="https://anthropic.skilljar.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-orange-400"
          >
            <ExternalLink className="w-4 h-4 text-amber-200" />
            <span>Mở Cổng Học Trực Tuyến Skilljar</span>
          </a>
        </div>
      </div>

      {/* FORM: Create New Dự Án / Training Module (Mentor tự tạo, không giới hạn dữ liệu mẫu) */}
      {isAddingModule && currentRole !== 'INTERN' && (
        <div className="bg-blue-50/80 border-2 border-blue-400 rounded-2xl p-5 shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Tạo Dự Án / Module Đào Tạo Mới</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingModule(false)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="font-bold text-slate-800 block mb-1">Tên Dự Án / Module *</label>
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="VD: Chứng chỉ CCA-F (Claude Certified Associate - Foundational)"
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Chuyên Ngành / Track</label>
              <select
                value={newModuleTrack}
                onChange={(e) => setNewModuleTrack(e.target.value as Department)}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {trackOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Tuần Thứ</label>
              <input
                type="number"
                min={1}
                value={newModuleWeek}
                onChange={(e) => setNewModuleWeek(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Thời Lượng</label>
              <input
                type="text"
                value={newModuleDuration}
                onChange={(e) => setNewModuleDuration(e.target.value)}
                placeholder="VD: 2 tuần"
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-800 block mb-1">Mô Tả Dự Án / Module</label>
              <input
                type="text"
                value={newModuleDescription}
                onChange={(e) => setNewModuleDescription(e.target.value)}
                placeholder="VD: Lộ trình luyện thi chứng chỉ CCA-F, gồm các khóa học Skilljar và bài thực hành."
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingModule(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleCreateModule}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-xs"
            >
              Tạo Dự Án / Module
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Banner for Mentor Actions */}
      {trackerToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{trackerToast}</span>
        </div>
      )}

      {/* Sub-navigation Tabs: 1. Skilljar Courses | 2. Mentor Intern Skilljar Progress Matrix */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('courses')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'courses'
              ? 'bg-white text-orange-700 shadow-xs border border-orange-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-orange-600" />
          <span>Danh Sách Bài Học Skilljar LMS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tracking')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'tracking'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Theo Dõi Tiến Độ Học Viên (Mentor Matrix)</span>
          {interns.length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {interns.length} Học viên
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: COURSES & SECTIONS LIST */}
      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          {/* Intern Role Informational Banner */}
          {currentRole === 'INTERN' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-900 shadow-2xs">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-extrabold block">Giao diện Học viên (Intern Mode):</span>
                <span className="text-blue-800">
                  Bạn có thể nhấp <strong>"Mở Bài Học Anthropic Skilljar"</strong> để vào cổng học tập, và tự tích chọn hoàn thành các <strong>Section Nhỏ</strong> bên dưới để cập nhật tiến độ đào tạo cá nhân. Bạn cũng có thể đặt câu hỏi trao đổi với Mentor trong phần Hỏi đáp.
                </span>
              </div>
            </div>
          )}

          {/* Progress & LMS Overview Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Hệ Thống Theo Dõi Tiến Độ Đào Tạo</span>
                </span>
                <h2 className="text-xl font-black">Chương Trình Đào Tạo Intern & Chứng Chỉ CCA-F</h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Tất cả bài học lớn đều gán link chính thức từ <strong>https://anthropic.skilljar.com/</strong>. Học viên hoàn thành từng Section nhỏ để tích lũy % tiến độ trực tiếp.
                </p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl shrink-0 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Khóa học Lớn</p>
                  <p className="text-xl font-black text-white mt-0.5">{totalCoursesCount}</p>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Section Đã Tick</p>
                  <p className="text-xl font-black text-amber-400 mt-0.5">{completedSectionsCount} / {totalSectionsCount}</p>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Hoàn Thành</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">{overallProgressPercent}%</p>
                </div>
              </div>
            </div>

            {/* Big Animated Progress Bar */}
            <div className="space-y-1.5 relative z-10 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Tổng tiến độ hoàn thành các khóa học Anthropic Skilljar:</span>
                <span className="text-amber-400 font-extrabold">{overallProgressPercent}% Complete</span>
              </div>
              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Decorative ambient gradient */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
          </div>

          {/* Track Selector Bar & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            
            {/* Track Pills */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {tracks.map((track) => {
                const isSelected = selectedTrack === track;
                return (
                  <button
                    key={track}
                    onClick={() => setSelectedTrack(track)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {track === 'ALL' ? 'Tất cả Khối Đào Tạo' : track}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khóa học, bài học..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* COURSES LIST BY MODULES */}
      <div className="space-y-6">
        {filteredModules.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-800">Không tìm thấy khóa học nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Vui lòng thử tìm kiếm tên bài học khác hoặc chọn chuyên ngành khác.</p>
          </div>
        ) : (
          filteredModules.map((mod) => {
            const tasksList = mod.majorTasks || [];

            return (
              <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                
                {/* Module Category Title */}
                <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      T{mod.weekNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                          {mod.track}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Thời lượng: {mod.duration}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-white">{mod.title}</h3>
                    </div>
                  </div>

                  {currentRole !== 'INTERN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTaskForModuleId(mod.id);
                        setNewTaskTitle('');
                        setNewTaskSkilljarUrl('https://anthropic.skilljar.com/');
                        setNewTaskDescription('');
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Thêm Khóa Học Skilljar Mới</span>
                    </button>
                  )}
                </div>

                {/* Module Description */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <p>{mod.description}</p>
                  <span className="font-bold text-slate-500 shrink-0 ml-3">
                    {tasksList.length} Khóa học lớn
                  </span>
                </div>

                {/* FORM: Add New Major Skilljar Course Task */}
                {addingTaskForModuleId === mod.id && (
                  <div className="p-5 bg-amber-50/80 border-b-2 border-amber-400 shadow-inner space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-600" />
                        <span>Thêm Khóa Học Anthropic Skilljar Mới Vào Module Này</span>
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setAddingTaskForModuleId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="md:col-span-2">
                        <label className="font-bold text-slate-800 block mb-1">Tên Khóa Học Lớn *</label>
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="VD: Claude 101: Introduction to Claude & Anthropic API"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
                          <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>Link Bài Học Trên Anthropic Skilljar *</span>
                        </label>
                        <input
                          type="url"
                          value={newTaskSkilljarUrl}
                          onChange={(e) => setNewTaskSkilljarUrl(e.target.value)}
                          placeholder="VD: https://anthropic.skilljar.com/claude-101"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono text-blue-700"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-bold text-slate-800 block mb-1">Mô Tả Nội Dung Khóa Học</label>
                        <input
                          type="text"
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="VD: Khóa học trang bị kiến thức nền tảng về Claude 3.5 Sonnet, Haiku và Workbench."
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAddingTaskForModuleId(null)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 text-xs"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateMajorTask(mod.id)}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-xs"
                      >
                        Lưu Khóa Học Skilljar
                      </button>
                    </div>
                  </div>
                )}

                {/* Major Course Tasks List */}
                <div className="p-5 space-y-5">
                  {tasksList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      Chưa có khóa học Skilljar nào trong module này. Nhấn <strong>"+ Thêm Khóa Học Skilljar Mới"</strong> để bổ sung.
                    </div>
                  ) : (
                    tasksList.map((task, tIdx) => {
                      const isEditingSkilljar = editingSkilljarTaskId?.moduleId === mod.id && editingSkilljarTaskId?.taskId === task.id;
                      const completedSecs = task.sections.filter(s => s.completed).length;
                      const totalSecs = task.sections.length;
                      const taskProgress = totalSecs > 0 ? Math.round((completedSecs / totalSecs) * 100) : 0;

                      return (
                        <div 
                          key={task.id}
                          className={`rounded-2xl p-5 border transition-all ${
                            taskProgress === 100 
                              ? 'bg-emerald-50/40 border-emerald-300' 
                              : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                          }`}
                        >
                          {/* Course Task Header */}
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                            
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                                  Khóa học {tIdx + 1}
                                </span>

                                {taskProgress === 100 ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Đã Hoàn Thành 100%</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                    {completedSecs}/{totalSecs} Section đã tick ({taskProgress}%)
                                  </span>
                                )}
                              </div>

                              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>{task.title}</span>
                              </h4>

                              {task.description && (
                                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{task.description}</p>
                              )}
                            </div>

                            {/* Direct Skilljar Action Buttons */}
                            <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {task.skilljarUrl && (
                                  <a
                                    href={task.skilljarUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all border border-orange-400"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-amber-200" />
                                    <span>Mở Bài Học Anthropic Skilljar</span>
                                  </a>
                                )}

                                {currentRole !== 'INTERN' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSkilljarTaskId({ moduleId: mod.id, taskId: task.id });
                                      setSkilljarUrlInput(task.skilljarUrl || 'https://anthropic.skilljar.com/');
                                    }}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-300"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{task.skilljarUrl ? 'Sửa Link' : '+ Dán Link Skilljar'}</span>
                                  </button>
                                )}
                              </div>

                              {task.skilljarUrl && (
                                <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate max-w-xs block">
                                  {task.skilljarUrl}
                                </span>
                              )}
                            </div>

                          </div>

                          {/* INLINE EDIT: Skilljar Link Form */}
                          {isEditingSkilljar && (
                            <div className="my-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
                              <label className="font-bold text-amber-950 block flex items-center gap-1.5">
                                <LinkIcon className="w-4 h-4 text-amber-600" />
                                <span>Cập nhật hoặc Dán Link Khóa Học Anthropic Skilljar (Skilljar URL):</span>
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={skilljarUrlInput}
                                  onChange={(e) => setSkilljarUrlInput(e.target.value)}
                                  placeholder="VD: https://anthropic.skilljar.com/claude-101"
                                  className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono text-blue-700 focus:ring-2 focus:ring-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveSkilljarUrl(mod.id, task.id)}
                                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer"
                                >
                                  Lưu Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSkilljarTaskId(null)}
                                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          )}

                          {/* SECTIONS LIST (Học viên tự tick hoàn thành) */}
                          <div className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-600" />
                                <span>Danh Sách Section Nhỏ (Tự Tick Hoàn Thành):</span>
                              </h5>

                              {currentRole !== 'INTERN' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingSectionForTaskId({ moduleId: mod.id, taskId: task.id });
                                    setNewSectionTitle('');
                                    setNewSectionMinutes(25);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Thêm Section Nhỏ</span>
                                </button>
                              )}
                            </div>

                            {/* Form: Add Section nhỏ */}
                            {addingSectionForTaskId?.moduleId === mod.id && addingSectionForTaskId?.taskId === task.id && (
                              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-300 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800">Tạo Section Nhỏ Bài Học Mới:</span>
                                  <button onClick={() => setAddingSectionForTaskId(null)} className="cursor-pointer">
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    value={newSectionTitle}
                                    onChange={(e) => setNewSectionTitle(e.target.value)}
                                    placeholder="VD: Section 1.4: Practical Prompting in Claude Workbench"
                                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                                  />
                                  <input
                                    type="number"
                                    value={newSectionMinutes}
                                    onChange={(e) => setNewSectionMinutes(Number(e.target.value))}
                                    placeholder="Phút"
                                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCreateSection(mod.id, task.id)}
                                    className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 cursor-pointer shrink-0"
                                  >
                                    Thêm
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Render Sections Checkboxes */}
                            <div className="flex flex-col gap-2">
                              {task.sections.map((sec) => (
                                <div
                                  key={sec.id}
                                  onClick={() => handleToggleSection(mod.id, task.id, sec.id)}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                    sec.completed
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium shadow-2xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-blue-50/60 hover:border-blue-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {sec.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                    <span className={`truncate ${sec.completed ? 'line-through text-slate-500' : 'font-semibold'}`}>
                                      {sec.title}
                                    </span>
                                  </div>

                                  {sec.estimatedMinutes && (
                                    <span className="text-[10px] font-bold text-slate-500 shrink-0 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>{sec.estimatedMinutes} phút</span>
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                          </div>

                          {/* Q&A & DISCUSSION THREAD FOR COURSE TASK */}
                          <div className="pt-3 border-t border-slate-100 mt-4">
                            <button
                              type="button"
                              onClick={() => setExpandedCommentsTaskId(expandedCommentsTaskId === task.id ? null : task.id)}
                              className="text-xs font-extrabold text-slate-700 hover:text-blue-600 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                              <span>💬 Thảo Luận & Hỏi Đáp Bài Học ({task.comments?.length || 0})</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {expandedCommentsTaskId === task.id ? '▲ Thu gọn' : '▼ Xem trao đổi với Mentor'}
                              </span>
                            </button>

                            {expandedCommentsTaskId === task.id && (
                              <div className="mt-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4 text-xs">
                                
                                {/* Existing Comments List */}
                                <div className="space-y-3">
                                  {(!task.comments || task.comments.length === 0) ? (
                                    <p className="text-slate-400 italic text-[11px] p-2 bg-white rounded-lg border border-slate-100">
                                      Chưa có câu hỏi hoặc thảo luận nào cho bài học này. Hãy gửi câu hỏi đầu tiên cho Mentor!
                                    </p>
                                  ) : (
                                    task.comments.map(comment => (
                                      <div key={comment.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <img src={comment.authorAvatar} alt={comment.authorName} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                            <span className="font-extrabold text-slate-900">{comment.authorName}</span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                              comment.authorRole === 'INTERN' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                                            }`}>
                                              {comment.authorRole}
                                            </span>
                                            <span className="text-[10px] text-slate-400">• {comment.createdAt}</span>
                                          </div>

                                          {comment.isResolved && (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-300">
                                              <Check className="w-3 h-3 text-emerald-600" />
                                              <span>Đã Giải Đáp</span>
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-slate-800 leading-relaxed font-medium">{comment.content}</p>

                                        {comment.codeSnippet && (
                                          <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
                                            <code>{comment.codeSnippet}</code>
                                          </pre>
                                        )}

                                        {/* Mentor Resolve Action */}
                                        {currentRole !== 'INTERN' && (
                                          <div className="pt-1 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleResolveComment(mod.id, task.id, comment.id)}
                                              className="text-[11px] font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>{comment.isResolved ? 'Bỏ đánh dấu giải đáp' : 'Đánh dấu Đã Giải Đáp'}</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Write New Comment / Question Box */}
                                <div className="pt-3 border-t border-slate-200 space-y-2">
                                  <label className="font-bold text-slate-800 block text-[11px]">Đặt câu hỏi hoặc chia sẻ góc nhìn bài học cho Mentor:</label>
                                  <textarea
                                    rows={2}
                                    value={commentInputs[task.id]?.text || ''}
                                    onChange={(e) => setCommentInputs(prev => ({
                                      ...prev,
                                      [task.id]: { ...prev[task.id] || { code: '', showCodeInput: false }, text: e.target.value }
                                    }))}
                                    placeholder="Viết thắc mắc về bài học Skilljar hoặc lỗi thực hành cần Mentor hướng dẫn..."
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                                  />

                                  {commentInputs[task.id]?.showCodeInput ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-slate-700">Đoạn Code / Lỗi Log đính kèm:</span>
                                        <button
                                          type="button"
                                          onClick={() => setCommentInputs(prev => ({
                                            ...prev,
                                            [task.id]: { ...prev[task.id], showCodeInput: false }
                                          }))}
                                          className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                                        >
                                          Ẩn
                                        </button>
                                      </div>
                                      <textarea
                                        rows={3}
                                        value={commentInputs[task.id]?.code || ''}
                                        onChange={(e) => setCommentInputs(prev => ({
                                          ...prev,
                                          [task.id]: { ...prev[task.id], code: e.target.value }
                                        }))}
                                        placeholder="Dán code snippet hoặc console log tại đây..."
                                        className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono rounded-xl text-[11px] focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setCommentInputs(prev => ({
                                        ...prev,
                                        [task.id]: { ...prev[task.id] || { text: '' }, showCodeInput: true }
                                      }))}
                                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Code2 className="w-3.5 h-3.5" />
                                      <span>+ Đính kèm code snippet / Lỗi log</span>
                                    </button>
                                  )}

                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleAddComment(mod.id, task.id)}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Gửi Thảo Luận</span>
                                    </button>
                                  </div>
                                </div>

                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })
        )}
        </div>
      </div>
    )}

      {/* VIEW 2: MENTOR INTERN SKILLJAR PROGRESS TRACKER MATRIX */}
      {activeSubTab === 'tracking' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Bảng Theo Dõi Tiến Độ Học Viên Trên Anthropic Skilljar LMS</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mentor giám sát tỷ lệ học của từng thực tập sinh, xem tổng số Section đã tick và gửi thông báo nhắc nhở tiến độ.
                </p>
              </div>

              {currentRole !== 'INTERN' && (
                <button
                  type="button"
                  onClick={() => handleSendReminder('Toàn bộ Học viên chưa hoàn thành')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Bell className="w-4 h-4" />
                  <span>Nhắc Nhở Toàn Bộ Intern Chậm Tiến Độ</span>
                </button>
              )}
            </div>

            {/* Intern Progress Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                    <th className="p-3.5 rounded-l-xl">Thực Tập Sinh & Chuyên Môn</th>
                    <th className="p-3.5">Mentor Hướng Dẫn</th>
                    <th className="p-3.5">Tỷ Lệ Hoàn Thành LMS</th>
                    <th className="p-3.5">Trạng Thái Đào Tạo</th>
                    <th className="p-3.5 text-right rounded-r-xl">Thao Tác Mentor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                        Chưa có dữ liệu học viên trong danh sách.
                      </td>
                    </tr>
                  ) : (
                    interns.map((intern) => {
                      const mockProgress = intern.roadmapProgress || 65;
                      const isCompleted = mockProgress >= 90;
                      const isBehind = mockProgress < 50;

                      return (
                        <tr key={intern.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img src={intern.avatar} alt={intern.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                              <div>
                                <span className="font-extrabold text-slate-900 block">{intern.name}</span>
                                <span className="text-[11px] text-slate-500">{intern.roleTitle}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 font-medium text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>{intern.mentor}</span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-1 max-w-xs">
                              <div className="flex justify-between font-bold text-[11px]">
                                <span className="text-slate-700">Skilljar Completion:</span>
                                <span className="text-blue-700 font-extrabold">{mockProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isCompleted ? 'bg-emerald-500' : isBehind ? 'bg-amber-500' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${mockProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            {isCompleted ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300">
                                ✔ Xuất Sắc (90-100%)
                              </span>
                            ) : isBehind ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] border border-amber-300">
                                ⚠️ Cần Nhắc Nhở (&lt;50%)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px] border border-blue-300">
                                📘 Đang Học Đúng Hạn
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedInternForDetails(intern)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Chi Tiết</span>
                              </button>

                              {currentRole !== 'INTERN' && (
                                <button
                                  type="button"
                                  onClick={() => handleSendReminder(intern.name)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                  <span>Nhắc Bài</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: INTERN SKILLJAR DETAILS */}
      {selectedInternForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src={selectedInternForDetails.avatar} alt={selectedInternForDetails.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedInternForDetails.name}</h3>
                  <p className="text-xs text-slate-500">{selectedInternForDetails.roleTitle}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInternForDetails(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-blue-900">Tổng Tiến Độ Trực Tuyến Skilljar LMS:</span>
                <span className="font-black text-blue-700 text-sm">{selectedInternForDetails.roadmapProgress || 65}%</span>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-slate-800 block">Các Khóa Học & Section Đã Tích Lũy:</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {modules.flatMap(m => m.majorTasks || []).map((t, idx) => (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Bài {idx + 1}: {t.title}</span>
                        <span className="text-emerald-600 text-[10px]">✔ {t.sections.filter(s => s.completed).length}/{t.sections.length} Done</span>
                      </div>
                      <div className="pl-2 border-l-2 border-slate-200 space-y-1 pt-1">
                        {t.sections.map(s => (
                          <div key={s.id} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            {s.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                            <span className={s.completed ? 'line-through text-slate-400' : ''}>{s.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {currentRole !== 'INTERN' && (
                <button
                  type="button"
                  onClick={() => {
                    handleSendReminder(selectedInternForDetails.name);
                    setSelectedInternForDetails(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Gửi Nhắc Nhở</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedInternForDetails(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Đóng Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
