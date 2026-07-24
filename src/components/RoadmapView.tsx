import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  ChevronDown,
  Code,
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  Edit2,
  Check,
  Link as LinkIcon,
  X,
  FileText,
  Settings2,
  Trash2,
  Lock
} from 'lucide-react';
import { Department, TrainingModule, CourseMajorTask, CourseSection } from '../types';

interface RoadmapViewProps {
  trainingModules: TrainingModule[];
  onToggleModuleStatus: (moduleId: string) => void;
  onNavigateToProjects?: () => void;
  onNavigateToTab?: (tab: any) => void;
}

// Bộ màu để đặt cho từng khoá học khi tạo mới trên Lộ trình Đào tạo
const COURSE_COLORS: { key: string; label: string; badge: string; dot: string }[] = [
  { key: 'amber', label: 'Vàng hổ phách', badge: 'from-amber-500 to-amber-600 text-slate-950 border-amber-300', dot: 'bg-amber-500' },
  { key: 'blue', label: 'Xanh dương', badge: 'from-blue-600 to-blue-700 text-white border-blue-400', dot: 'bg-blue-600' },
  { key: 'emerald', label: 'Xanh lá', badge: 'from-emerald-600 to-emerald-700 text-white border-emerald-400', dot: 'bg-emerald-600' },
  { key: 'purple', label: 'Tím', badge: 'from-purple-600 to-purple-700 text-white border-purple-400', dot: 'bg-purple-600' },
  { key: 'rose', label: 'Đỏ hồng', badge: 'from-rose-600 to-rose-700 text-white border-rose-400', dot: 'bg-rose-600' },
  { key: 'cyan', label: 'Xanh ngọc', badge: 'from-cyan-600 to-cyan-700 text-white border-cyan-400', dot: 'bg-cyan-600' },
  { key: 'slate', label: 'Xám', badge: 'from-slate-700 to-slate-800 text-white border-slate-500', dot: 'bg-slate-600' }
];

const getCourseColorStyle = (colorKey?: string) => {
  return COURSE_COLORS.find(c => c.key === colorKey) || COURSE_COLORS[1];
};

// Khoá học Chứng chỉ CCA-F mặc định - luôn tồn tại và không thể xoá
const DEFAULT_CCAF_MODULE: TrainingModule = {
  id: 'TRN-CCAF-01',
  track: 'Cloud & DevOps',
  weekNumber: 1,
  title: 'Chứng chỉ CCA-F (Cloud Certified Associate - Foundation)',
  duration: '4 tuần',
  description: 'Chương trình đào tạo chứng chỉ quốc tế bắt buộc dành cho toàn bộ thực tập sinh Gimasys, tích hợp bài học Anthropic Skilljar.',
  keySkills: ['Cloud Fundamentals', 'DevOps Basics', 'Anthropic Skilljar'],
  resourcesCount: 0,
  status: 'Not Started',
  majorTasks: [],
  color: 'amber',
  isLocked: true
};

const ROADMAP_STORAGE_KEY = 'gimasys_roadmap_modules';

const loadInitialModules = (trainingModules: TrainingModule[]): TrainingModule[] => {
  try {
    const saved = localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (saved) {
      const parsed: TrainingModule[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasCcaf = parsed.some(m => m.id === DEFAULT_CCAF_MODULE.id);
        return hasCcaf ? parsed : [DEFAULT_CCAF_MODULE, ...parsed];
      }
    }
  } catch {
    // ignore corrupted localStorage, fall back below
  }
  const base = trainingModules && trainingModules.length > 0 ? trainingModules : [];
  const hasCcaf = base.some(m => m.id === DEFAULT_CCAF_MODULE.id);
  return hasCcaf ? base : [DEFAULT_CCAF_MODULE, ...base];
};

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  trainingModules,
  onToggleModuleStatus,
  onNavigateToProjects,
  onNavigateToTab
}) => {
  const [activeTrack, setActiveTrack] = useState<Department>('Cloud & DevOps');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>('TRN-CCAF-01');

  // Local state for interactive tasks & links editing
  const [modulesState, setModulesState] = useState<TrainingModule[]>(() => loadInitialModules(trainingModules));

  // Chế độ chỉnh sửa danh sách khoá học trên thanh navigation
  const [isEditingNav, setIsEditingNav] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseTrack, setNewCourseTrack] = useState<Department>('Cloud & DevOps');
  const [newCourseWeek, setNewCourseWeek] = useState<number>(1);
  const [newCourseDuration, setNewCourseDuration] = useState('2 tuần');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('blue');

  // Đồng bộ danh sách khoá học của Lộ trình Đào tạo vào localStorage
  React.useEffect(() => {
    localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(modulesState));
  }, [modulesState]);

  // Skilljar editing link modal or inline edit state
  const [editingSkilljarTaskId, setEditingSkilljarTaskId] = useState<{ moduleId: string; taskId: string } | null>(null);
  const [skilljarUrlInput, setSkilljarUrlInput] = useState<string>('');

  // Add new Major Task modal/form state
  const [addingTaskForModuleId, setAddingTaskForModuleId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskSkilljarUrl, setNewTaskSkilljarUrl] = useState<string>('https://anthropic.skilljar.com/');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');

  // Add new Section small topic state
  const [addingSectionForTaskId, setAddingSectionForTaskId] = useState<{ moduleId: string; taskId: string } | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');
  const [newSectionMinutes, setNewSectionMinutes] = useState<number>(30);

  const tracks: Department[] = [
    'Cloud & DevOps',
    'Java Back-End',
    'React Front-End',
    'Salesforce / ERP',
    'AI & Data Science'
  ];

  const filteredModules = modulesState.filter(m => m.track === activeTrack);

  const toggleExpandModule = (id: string) => {
    setExpandedModuleId(expandedModuleId === id ? null : id);
  };

  // Toggle Section Checkbox
  const handleToggleSection = (moduleId: string, taskId: string, sectionId: string) => {
    setModulesState(prev => prev.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        const updatedSections = task.sections.map(sec => {
          if (sec.id !== sectionId) return sec;
          return { ...sec, completed: !sec.completed };
        });
        const allCompleted = updatedSections.every(s => s.completed);
        return { ...task, sections: updatedSections, completed: allCompleted };
      });
      return { ...mod, majorTasks: updatedTasks };
    }));
  };

  // Save updated Skilljar Link
  const handleSaveSkilljarUrl = (moduleId: string, taskId: string) => {
    if (!skilljarUrlInput.trim()) return;
    setModulesState(prev => prev.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        return { ...task, skilljarUrl: skilljarUrlInput.trim() };
      });
      return { ...mod, majorTasks: updatedTasks };
    }));
    setEditingSkilljarTaskId(null);
    setSkilljarUrlInput('');
  };

  // Add New Major Task
  const handleCreateMajorTask = (moduleId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: CourseMajorTask = {
      id: `MJT-${Date.now().toString().slice(-4)}`,
      title: newTaskTitle.trim(),
      skilljarUrl: newTaskSkilljarUrl.trim() || 'https://anthropic.skilljar.com/',
      description: newTaskDescription.trim() || 'Nội dung bài học thực hành trên Skilljar Anthropic.',
      completed: false,
      sections: [
        { id: `SEC-${Date.now()}-1`, title: 'Section 1.1: Tổng quan lý thuyết & Mục tiêu bài học', completed: false, estimatedMinutes: 20 },
        { id: `SEC-${Date.now()}-2`, title: 'Section 1.2: Thực hành trực tiếp trên Skilljar Anthropic', completed: false, estimatedMinutes: 40 }
      ]
    };

    setModulesState(prev => prev.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        majorTasks: [...(mod.majorTasks || []), newTask]
      };
    }));

    setAddingTaskForModuleId(null);
    setNewTaskTitle('');
    setNewTaskSkilljarUrl('https://anthropic.skilljar.com/');
    setNewTaskDescription('');
  };

  // Add New Small Section
  const handleCreateSection = (moduleId: string, taskId: string) => {
    if (!newSectionTitle.trim()) return;
    const newSec: CourseSection = {
      id: `SEC-${Date.now().toString().slice(-4)}`,
      title: newSectionTitle.trim(),
      completed: false,
      estimatedMinutes: Number(newSectionMinutes) || 30
    };

    setModulesState(prev => prev.map(mod => {
      if (mod.id !== moduleId) return mod;
      const updatedTasks = (mod.majorTasks || []).map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          sections: [...task.sections, newSec]
        };
      });
      return { ...mod, majorTasks: updatedTasks };
    }));

    setAddingSectionForTaskId(null);
    setNewSectionTitle('');
    setNewSectionMinutes(30);
  };

  // Thêm 1 Khoá học mới vào thanh navigation của Lộ trình Đào tạo
  const handleCreateCourse = () => {
    if (!newCourseTitle.trim()) return;
    const confirmed = window.confirm(`Xác nhận thêm khoá học "${newCourseTitle.trim()}" vào lộ trình đào tạo?`);
    if (!confirmed) return;

    const newModule: TrainingModule = {
      id: `TRN-${Date.now().toString().slice(-6)}`,
      track: newCourseTrack,
      weekNumber: Number(newCourseWeek) || 1,
      title: newCourseTitle.trim(),
      duration: newCourseDuration.trim() || '2 tuần',
      description: newCourseDescription.trim() || 'Khoá học mới do Mentor tự khởi tạo trên Lộ trình Đào tạo.',
      keySkills: [],
      resourcesCount: 0,
      status: 'Not Started',
      majorTasks: [],
      color: newCourseColor,
      isLocked: false
    };

    setModulesState(prev => [...prev, newModule]);
    setActiveTrack(newCourseTrack);
    setExpandedModuleId(newModule.id);

    setIsAddingCourse(false);
    setNewCourseTitle('');
    setNewCourseTrack('Cloud & DevOps');
    setNewCourseWeek(1);
    setNewCourseDuration('2 tuần');
    setNewCourseDescription('');
    setNewCourseColor('blue');
  };

  // Xoá 1 Khoá học khỏi thanh navigation (không áp dụng cho khoá học mặc định bị khoá, VD: CCA-F)
  const handleDeleteCourse = (moduleId: string, moduleTitle: string, locked?: boolean) => {
    if (locked) {
      window.alert('Khoá học Chứng chỉ CCA-F là khoá học mặc định bắt buộc và không thể xoá.');
      return;
    }
    const confirmed = window.confirm(`Xoá khoá học "${moduleTitle}" khỏi Lộ trình Đào tạo?\nHành động này không thể hoàn tác.`);
    if (!confirmed) return;
    setModulesState(prev => prev.filter(m => m.id !== moduleId));
    if (expandedModuleId === moduleId) setExpandedModuleId(null);
  };

  // Calculate dynamic overall track progress across all tasks and sections in active track
  let totalTrackSections = 0;
  let completedTrackSections = 0;
  let totalTasksCount = 0;
  filteredModules.forEach(mod => {
    const tasks = mod.majorTasks || [];
    totalTasksCount += tasks.length;
    tasks.forEach(t => {
      totalTrackSections += t.sections.length;
      completedTrackSections += t.sections.filter(s => s.completed).length;
    });
  });
  const overallProgressPercent = totalTrackSections > 0 ? Math.round((completedTrackSections / totalTrackSections) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Lộ trình Đào tạo & Khóa học Gimasys</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Chương trình đào tạo tích hợp Link Bài học <strong>Anthropic Skilljar</strong> với các Task Lớn và Section Nhỏ
        </p>
      </div>

      {/* Track Selector Bar */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-700 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tracks.map((track) => {
              const isSelected = activeTrack === track;
              return (
                <button
                  key={track}
                  onClick={() => {
                    setActiveTrack(track);
                    const firstMod = modulesState.find(m => m.track === track);
                    if (firstMod) setExpandedModuleId(firstMod.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {track}
                </button>
              );
            })}
          </div>

          {/* Edit Mode Toggle for Course Navigation */}
          <button
            type="button"
            onClick={() => {
              setIsEditingNav(prev => !prev);
              setIsAddingCourse(false);
            }}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all border ${
              isEditingNav
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>{isEditingNav ? 'Xong Chỉnh Sửa' : 'Chỉnh Sửa Khoá Học'}</span>
          </button>
        </div>

        {/* Course Quick Action Badges (per module, colored) */}
        <div className="flex flex-wrap items-center gap-2">
          {modulesState.map((mod) => {
            const colorStyle = getCourseColorStyle(mod.color);
            return (
              <div key={mod.id} className="relative group">
                <button
                  onClick={() => {
                    setActiveTrack(mod.track);
                    setExpandedModuleId(mod.id);
                  }}
                  className={`pl-3.5 pr-3 py-2 rounded-xl bg-gradient-to-r ${colorStyle.badge} font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all border`}
                >
                  {mod.isLocked ? <Award className="w-4 h-4" /> : <BookOpen className="w-3.5 h-3.5" />}
                  <span>{mod.isLocked ? '🎓 ' : ''}{mod.title}</span>
                  {mod.isLocked && (
                    <Lock className="w-3 h-3 opacity-80" title="Khoá học mặc định, không thể xoá" />
                  )}
                </button>

                {isEditingNav && !mod.isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCourse(mod.id, mod.title, mod.isLocked);
                    }}
                    title="Xoá khoá học này"
                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-md cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {isEditingNav && (
            <button
              type="button"
              onClick={() => setIsAddingCourse(true)}
              className="px-3.5 py-2 rounded-xl border-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khoá Học Mới</span>
            </button>
          )}
        </div>

        {/* FORM: Add New Course with Color Picker */}
        {isAddingCourse && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-blue-400/80 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Tạo Khoá Học Mới</h5>
              <button type="button" onClick={() => setIsAddingCourse(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên Khoá Học *</label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="VD: Khoá học Chứng chỉ AWS Solutions Architect"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Khối áp dụng</label>
                  <select
                    value={newCourseTrack}
                    onChange={(e) => setNewCourseTrack(e.target.value as Department)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {tracks.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Thời lượng</label>
                  <input
                    type="text"
                    value={newCourseDuration}
                    onChange={(e) => setNewCourseDuration(e.target.value)}
                    placeholder="VD: 3 tuần"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mô tả tóm tắt</label>
                <input
                  type="text"
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                  placeholder="VD: Nội dung khoá học và mục tiêu đào tạo."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Chọn màu hiển thị cho khoá học</label>
                <div className="flex flex-wrap items-center gap-2">
                  {COURSE_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setNewCourseColor(c.key)}
                      title={c.label}
                      className={`w-7 h-7 rounded-full ${c.dot} flex items-center justify-center cursor-pointer transition-all ${
                        newCourseColor === c.key ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-800' : ''
                      }`}
                    >
                      {newCourseColor === c.key && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCourse(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateCourse}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Lưu Khoá Học
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Track Description Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Gimasys Professional Internship Roadmap</span>
          </div>
          <h3 className="text-xl font-extrabold">Khung Đào tạo Chuyên sâu: {activeTrack}</h3>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            Mỗi Phần học được phân chia chi tiết thành các <strong>Task Lớn (Khoá học Skilljar)</strong> chứa <strong>Link Bài học Anthropic Skilljar</strong> và các <strong>Section Nhỏ</strong> để học viên tự tick hoàn thành.
          </p>
        </div>

        {onNavigateToProjects && (
          <button
            onClick={onNavigateToProjects}
            className="px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 dark:text-slate-100 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Layers className="w-4 h-4" />
            <span>Mở Kanban Task Dự án</span>
          </button>
        )}
      </div>

      {/* Live Skilljar Progress Tracker Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>Theo dõi Tiến độ Bài học Anthropic Skilljar</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Live LMS Sync</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tự động cập nhật khi học viên tick chọn hoàn thành các Section nhỏ bên dưới</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('skilljar')}
                className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all border border-orange-400"
              >
                <Award className="w-3.5 h-3.5 text-amber-200" />
                <span>Xem Trang Quản Lý Khóa Học Skilljar</span>
              </button>
            )}

            <a
              href="https://anthropic.skilljar.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span>Skilljar Web Portal</span>
            </a>
          </div>
        </div>

        {/* Progress Bar & Metric stats */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Khối {activeTrack}:</span>
              <span className="text-blue-700">{completedTrackSections}/{totalTrackSections} Section Nhỏ đã hoàn thành</span>
              <span className="text-slate-400">({totalTasksCount} Task lớn)</span>
            </span>
            <span className="text-blue-700 font-extrabold text-sm">{overallProgressPercent}% Complete</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* CCA-F Course Detailed Highlight Card */}
      {activeTrack === 'Cloud & DevOps' && (
        <div className="bg-amber-500/10 border-2 border-amber-400/40 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Chương trình Đào tạo Chứng chỉ Quốc tế CCA-F (Cloud Certified Associate - Foundation)
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full w-fit">
              Chứng chỉ Bắt buộc Thực tập sinh Gimasys
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Khóa học <strong>CCA-F</strong> được liên kết trực tiếp bài học <strong>Anthropic Skilljar</strong>. Học viên có thể dán link bài học mới từ Skilljar vào từng Task lớn và hoàn thành các Section nhỏ.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-200">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Hệ thống bài học</p>
              <p className="text-xs font-black text-amber-900 mt-0.5">Anthropic Skilljar LMS</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-200">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cấu trúc phần học</p>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">Task lớn + Section nhỏ</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-200">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Điểm Đạt (Passing)</p>
              <p className="text-xs font-black text-emerald-700 mt-0.5">≥ 75 / 100 điểm</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-200">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tài khoản Học viên</p>
              <p className="text-xs font-black text-blue-700 mt-0.5">Cấp quyền tự động</p>
            </div>
          </div>
        </div>
      )}

      {/* Modules Timeline */}
      <div className="space-y-5">
        {filteredModules.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Đang cập nhật lộ trình cho khối này</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nội dung đào tạo đang được Hội đồng Kỹ thuật biên soạn.</p>
          </div>
        ) : (
          filteredModules.map((mod) => {
            const isExpanded = expandedModuleId === mod.id;
            const tasksList = mod.majorTasks || [];

            // Calculate total section counts
            let totalSections = 0;
            let completedSections = 0;
            tasksList.forEach(t => {
              totalSections += t.sections.length;
              completedSections += t.sections.filter(s => s.completed).length;
            });
            const progressPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

            return (
              <div
                key={mod.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden transition-all"
              >
                {/* Module Summary Bar Header */}
                <div 
                  onClick={() => toggleExpandModule(mod.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-11 h-11 rounded-2xl font-extrabold text-base flex items-center justify-center shrink-0 ${
                      mod.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      mod.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      Tuần {mod.weekNumber}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Thời lượng: {mod.duration}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          mod.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          mod.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {mod.status === 'Completed' ? '✓ Đã hoàn thành' : mod.status === 'In Progress' ? '🔄 Đang học' : '⏳ Chưa bắt đầu'}
                        </span>

                        {tasksList.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 border border-amber-200">
                            {tasksList.length} Task Lớn ({completedSections}/{totalSections} Section nhỏ)
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{mod.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl line-clamp-2">{mod.description}</p>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {totalSections > 0 && (
                      <div className="text-right hidden sm:block">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Tiến độ bài học</span>
                        <span className="text-xs font-extrabold text-blue-700">{progressPercent}% ({completedSections}/{totalSections})</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleModuleStatus(mod.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        mod.status === 'Completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {mod.status === 'Completed' ? 'Hoàn thành ✓' : 'Đánh dấu Hoàn thành'}
                    </button>

                    <div className="p-2 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Section: Major Tasks & Sections */}
                {isExpanded && (
                  <div className="bg-slate-50/70 p-5 border-t border-slate-100 dark:border-slate-800 space-y-5">
                    
                    {/* Header Bar inside expanded view */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span>Chi tiết Các Task Lớn & Section Nhỏ trong Phần học</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Nhấn vào link <strong>Anthropic Skilljar</strong> để mở bài học trực tuyến, tích chọn hoàn thành các section nhỏ.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAddingTaskForModuleId(mod.id);
                          setNewTaskTitle('');
                          setNewTaskSkilljarUrl('https://anthropic.skilljar.com/');
                          setNewTaskDescription('');
                        }}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Thêm Task Lớn Mới</span>
                      </button>
                    </div>

                    {/* FORM: Add New Major Task */}
                    {addingTaskForModuleId === mod.id && (
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-blue-400/80 shadow-md space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Thêm Task Lớn Mới Vô Phần Học này</h5>
                          <button 
                            type="button" 
                            onClick={() => setAddingTaskForModuleId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên Task Lớn *</label>
                            <input
                              type="text"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder="VD: Task 3: Triển khai Microservices với Anthropic Claude SDK"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                              <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                              <span>Link Bài học Anthropic Skilljar *</span>
                            </label>
                            <input
                              type="url"
                              value={newTaskSkilljarUrl}
                              onChange={(e) => setNewTaskSkilljarUrl(e.target.value)}
                              placeholder="VD: https://anthropic.skilljar.com/claude-developer-course"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-blue-700"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mô tả tóm tắt task lớn</label>
                            <input
                              type="text"
                              value={newTaskDescription}
                              onChange={(e) => setNewTaskDescription(e.target.value)}
                              placeholder="VD: Nội dung bài học kỹ thuật chuyên sâu trên hệ thống Skilljar."
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setAddingTaskForModuleId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateMajorTask(mod.id)}
                              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                            >
                              Lưu Task Lớn
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LIST OF MAJOR TASKS */}
                    {tasksList.length === 0 ? (
                      <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                        Chưa có Task lớn nào. Hãy nhấn <strong>"+ Thêm Task Lớn Mới"</strong> để dán link bài học Skilljar Anthropic.
                      </div>
                    ) : (
                      tasksList.map((task, tIndex) => {
                        const isEditingSkilljar = editingSkilljarTaskId?.moduleId === mod.id && editingSkilljarTaskId?.taskId === task.id;
                        const taskCompletedSecs = task.sections.filter(s => s.completed).length;
                        const isTaskAllDone = task.sections.length > 0 && taskCompletedSecs === task.sections.length;

                        return (
                          <div 
                            key={task.id}
                            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all ${
                              isTaskAllDone 
                                ? 'border-emerald-200 bg-emerald-50/10' 
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-2xs'
                            }`}
                          >
                            {/* Major Task Title & Skilljar Link Header */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white">
                                    Task {tIndex + 1}
                                  </span>

                                  {isTaskAllDone ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Đã hoàn thành các section</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 border border-blue-200">
                                      {taskCompletedSecs}/{task.sections.length} Section nhỏ completed
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                                  <span>{task.title}</span>
                                </h4>

                                {task.description && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{task.description}</p>
                                )}
                              </div>

                              {/* Skilljar Link Section */}
                              <div className="shrink-0 space-y-2 flex flex-col items-start md:items-end">
                                {task.skilljarUrl ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <a
                                      href={task.skilljarUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all border border-orange-400"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-amber-200" />
                                      <span>Mở Bài Học Anthropic Skilljar</span>
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSkilljarTaskId({ moduleId: mod.id, taskId: task.id });
                                        setSkilljarUrlInput(task.skilljarUrl || '');
                                      }}
                                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                      title="Dán hoặc sửa link Anthropic Skilljar"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSkilljarTaskId({ moduleId: mod.id, taskId: task.id });
                                      setSkilljarUrlInput('https://anthropic.skilljar.com/');
                                    }}
                                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    <span>+ Dán Link Anthropic Skilljar</span>
                                  </button>
                                )}

                                {/* Display raw domain snippet */}
                                {task.skilljarUrl && (
                                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs block">
                                    {task.skilljarUrl}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* INLINE EDIT: Skilljar Link Input Form */}
                            {isEditingSkilljar && (
                              <div className="my-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 rounded-xl space-y-2 text-xs">
                                <label className="font-bold text-amber-900 block flex items-center gap-1.5">
                                  <LinkIcon className="w-4 h-4 text-amber-600" />
                                  <span>Dán Link bài học Anthropic Skilljar dành cho Task này:</span>
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    value={skilljarUrlInput}
                                    onChange={(e) => setSkilljarUrlInput(e.target.value)}
                                    placeholder="VD: https://anthropic.skilljar.com/claude-architect-lab"
                                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSkilljarUrl(mod.id, task.id)}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer"
                                  >
                                    Lưu Link
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSkilljarTaskId(null)}
                                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* SECTIONS LIST (Section nhỏ) */}
                            <div className="pt-3 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400">Danh sách Section nhỏ (Bài học & Thực hành)</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingSectionForTaskId({ moduleId: mod.id, taskId: task.id });
                                    setNewSectionTitle('');
                                    setNewSectionMinutes(20);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Thêm Section nhỏ</span>
                                </button>
                              </div>

                              {/* Form: Add Section nhỏ */}
                              {addingSectionForTaskId?.moduleId === mod.id && addingSectionForTaskId?.taskId === task.id && (
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Tạo Section Nhỏ Mới:</span>
                                    <button onClick={() => setAddingSectionForTaskId(null)}>
                                      <X className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                      type="text"
                                      value={newSectionTitle}
                                      onChange={(e) => setNewSectionTitle(e.target.value)}
                                      placeholder="VD: Section 2.4: Thực hành gcloud firewall-rules create"
                                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                                    />
                                    <input
                                      type="number"
                                      value={newSectionMinutes}
                                      onChange={(e) => setNewSectionMinutes(Number(e.target.value))}
                                      placeholder="Phút"
                                      className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleCreateSection(mod.id, task.id)}
                                      className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 cursor-pointer"
                                    >
                                      Thêm
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Render Section Items */}
                              <div className="grid grid-cols-1 gap-1.5">
                                {task.sections.map((sec) => (
                                  <div
                                    key={sec.id}
                                    onClick={() => handleToggleSection(mod.id, task.id, sec.id)}
                                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                      sec.completed
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 hover:border-blue-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      {sec.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                                      )}
                                      <span className={`truncate ${sec.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'font-semibold'}`}>
                                        {sec.title}
                                      </span>
                                    </div>

                                    {sec.estimatedMinutes && (
                                      <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        <Clock className="w-3 h-3" />
                                        <span>{sec.estimatedMinutes} phút</span>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                            </div>

                          </div>
                        );
                      })
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

