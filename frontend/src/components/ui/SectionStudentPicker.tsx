import React, { useMemo, useState } from 'react';
import { Search, X, CheckCircle2, Users, UserSquare2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PickerStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  branch?: string;
  section?: string;
}

interface SectionStudentPickerProps {
  students: PickerStudent[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function SectionStudentPicker({ students, selectedIds, onChange }: SectionStudentPickerProps) {
  const [activeTab, setActiveTab] = useState<'section' | 'student'>('section');
  const [search, setSearch] = useState('');
  
  // Filters for the student tab
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');

  // Derived sections data
  const sectionsData = useMemo(() => {
    const map = new Map<string, { branch: string; section: string; studentIds: string[] }>();
    
    students.forEach(s => {
      const b = s.branch || 'Unassigned';
      const sec = s.section || 'Unassigned';
      const key = `${b}::${sec}`;
      
      if (!map.has(key)) {
        map.set(key, { branch: b, section: sec, studentIds: [] });
      }
      map.get(key)!.studentIds.push(s.id);
    });
    
    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      ...data
    })).sort((a, b) => a.branch.localeCompare(b.branch) || a.section.localeCompare(b.section));
  }, [students]);

  // Derived filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = search ? (s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())) : true;
      const matchBranch = filterBranch ? (s.branch === filterBranch) : true;
      const matchSection = filterSection ? (s.section === filterSection) : true;
      return matchSearch && matchBranch && matchSection;
    });
  }, [students, search, filterBranch, filterSection]);

  // Unique branches/sections for dropdowns
  const uniqueBranches = useMemo(() => Array.from(new Set(students.map(s => s.branch).filter(Boolean))), [students]);
  const uniqueSections = useMemo(() => Array.from(new Set(students.map(s => s.section).filter(Boolean))), [students]);

  // Section logic
  const isSectionFullySelected = (sectionStudentIds: string[]) => {
    if (sectionStudentIds.length === 0) return false;
    return sectionStudentIds.every(id => selectedIds.includes(id));
  };

  const toggleSection = (sectionStudentIds: string[]) => {
    const fullySelected = isSectionFullySelected(sectionStudentIds);
    if (fullySelected) {
      // Remove all these students
      onChange(selectedIds.filter(id => !sectionStudentIds.includes(id)));
    } else {
      // Add missing students
      const toAdd = sectionStudentIds.filter(id => !selectedIds.includes(id));
      onChange([...selectedIds, ...toAdd]);
    }
  };

  const removeSection = (sectionStudentIds: string[]) => {
    onChange(selectedIds.filter(id => !sectionStudentIds.includes(id)));
  };

  const removeStudent = (studentId: string) => {
    onChange(selectedIds.filter(id => id !== studentId));
  };

  // Group selections for the chips UI
  const { fullySelectedSections, individualStudents } = useMemo(() => {
    const fullSections: typeof sectionsData = [];
    const fullSectionStudentIds = new Set<string>();

    sectionsData.forEach(sec => {
      if (sec.studentIds.length > 0 && sec.studentIds.every(id => selectedIds.includes(id))) {
        fullSections.push(sec);
        sec.studentIds.forEach(id => fullSectionStudentIds.add(id));
      }
    });

    const individualIds = selectedIds.filter(id => !fullSectionStudentIds.has(id));
    const individuals = students.filter(s => individualIds.includes(s.id));

    return { fullySelectedSections: fullSections, individualStudents: individuals };
  }, [selectedIds, sectionsData, students]);

  return (
    <div className="flex flex-col border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
      
      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-black/20">
        <button
          onClick={() => setActiveTab('section')}
          className={cn(
            "flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors",
            activeTab === 'section' ? "text-neon-violet border-b-2 border-neon-violet bg-neon-violet/5" : "text-white/40 hover:text-white/70"
          )}
        >
          <Layers size={15} />
          By Section
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={cn(
            "flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors",
            activeTab === 'student' ? "text-neon-magenta border-b-2 border-neon-magenta bg-neon-magenta/5" : "text-white/40 hover:text-white/70"
          )}
        >
          <Users size={15} />
          By Student
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1">
        
        {activeTab === 'section' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/50">{sectionsData.length} sections found</span>
              <button 
                onClick={() => onChange(students.map(s => s.id))} 
                className="text-xs text-neon-cyan hover:underline"
              >
                Select All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {sectionsData.map(sec => {
                const selected = isSectionFullySelected(sec.studentIds);
                return (
                  <button
                    key={sec.key}
                    onClick={() => toggleSection(sec.studentIds)}
                    className={cn(
                      "flex items-center p-3 rounded-xl border text-left transition-colors",
                      selected ? "border-neon-violet/50 bg-neon-violet/10" : "border-white/10 bg-white/5 hover:border-white/30"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", selected ? "text-neon-violet" : "text-white/80")}>
                        {sec.section}
                      </p>
                      <p className="text-[11px] text-white/40">{sec.branch} · {sec.studentIds.length} students</p>
                    </div>
                    <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0', selected ? 'bg-neon-violet border-neon-violet' : 'border-white/20')}>
                      {selected && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'student' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Search students..." 
                  className="cyber-input w-full pl-9 py-2 text-xs" 
                />
              </div>
              <select 
                value={filterBranch} 
                onChange={(e) => setFilterBranch(e.target.value)}
                className="cyber-input py-2 px-3 text-xs min-w-[120px] appearance-none"
              >
                <option value="">All Branches</option>
                {uniqueBranches.map(b => b && <option key={b} value={b}>{b}</option>)}
              </select>
              <select 
                value={filterSection} 
                onChange={(e) => setFilterSection(e.target.value)}
                className="cyber-input py-2 px-3 text-xs min-w-[120px] appearance-none"
              >
                <option value="">All Sections</option>
                {uniqueSections.map(s => s && <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex justify-between items-center text-xs text-white/50">
              <span>{filteredStudents.length} students match</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const toAdd = filteredStudents.map(s => s.id).filter(id => !selectedIds.includes(id));
                    onChange([...selectedIds, ...toAdd]);
                  }}
                  className="text-neon-cyan hover:underline"
                >Select Visible</button>
                <button onClick={() => onChange([])} className="text-white/40 hover:text-white">Clear All</button>
              </div>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-xs">No students found matching criteria.</div>
              ) : (
                filteredStudents.map(student => {
                  const selected = selectedIds.includes(student.id);
                  return (
                    <button
                      key={student.id}
                      onClick={() => onChange(selected ? selectedIds.filter(id => id !== student.id) : [...selectedIds, student.id])}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors",
                        selected ? "border-neon-magenta/50 bg-neon-magenta/10" : "border-white/5 bg-white/[0.015] hover:border-white/20"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", selected ? "bg-neon-magenta/30 text-neon-magenta" : "bg-white/10 text-white/50")}>
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className={cn("text-sm font-medium truncate", selected ? "text-neon-magenta" : "text-white/80")}>{student.name}</p>
                          {(student.branch || student.section) && (
                            <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded border border-white/10 ml-2 shrink-0">
                              {student.branch} {student.section}
                            </span>
                          )}
                        </div>
                        <p className="text-white/30 text-[11px] truncate">{student.email}</p>
                      </div>
                      <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0', selected ? 'bg-neon-magenta border-neon-magenta' : 'border-white/15')}>
                        {selected && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* Selected Chips Area */}
      <div className="bg-black/30 border-t border-white/10 p-4 min-h-[80px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-white/70">
            Selected: <span className="text-white">{selectedIds.length}</span> students
          </p>
          {selectedIds.length > 0 && (
            <button onClick={() => onChange([])} className="text-[10px] text-white/40 hover:text-white">Clear All</button>
          )}
        </div>
        
        {selectedIds.length === 0 ? (
          <p className="text-[11px] text-white/30 italic">No students or sections selected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fullySelectedSections.map(sec => (
              <div key={sec.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neon-violet/30 bg-neon-violet/10 text-neon-violet text-xs">
                <Layers size={12} className="opacity-70" />
                <span>{sec.section} <span className="opacity-50 text-[10px]">({sec.branch})</span></span>
                <button onClick={() => removeSection(sec.studentIds)} className="hover:text-white ml-1 opacity-70 hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {individualStudents.map(stu => (
              <div key={stu.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta text-xs">
                <UserSquare2 size={12} className="opacity-70" />
                <span>{stu.name}</span>
                <button onClick={() => removeStudent(stu.id)} className="hover:text-white ml-1 opacity-70 hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
