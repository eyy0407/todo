"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function cn(...args) {
  return twMerge(clsx(args));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getMondayOfDate(dateStr) {
  return getMonday(new Date(dateStr));
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const COLORS = [
  "bg-brand-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-400",
  "bg-fuchsia-500",
];
const TEXT_COLORS = [
  "text-brand-400",
  "text-violet-400",
  "text-sky-400",
  "text-emerald-400",
  "text-amber-400",
  "text-rose-300",
  "text-fuchsia-400",
];
const RING_COLORS = [
  "ring-brand-500/40",
  "ring-violet-500/40",
  "ring-sky-500/40",
  "ring-emerald-500/40",
  "ring-amber-500/40",
  "ring-rose-400/40",
  "ring-fuchsia-500/40",
];

// ─── 저장소 훅 ───────────────────────────────────────────────────────────────

function useStore() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    fetch("/api/todos")
      .then((r) => r.json())
      .then((data) => {
        if (!data.groups) data.groups = [];
        if (!data.startDate) {
          data.startDate = formatDate(getMonday(new Date()));
        }
        setState(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback((newState) => {
    setState(newState);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(() => {
      fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      }).finally(() => setSaving(false));
    }, 600);
  }, []);

  return { state, loading, saving, save };
}

// ─── 날짜 헤더 ───────────────────────────────────────────────────────────────

function DateHeader({ weekStart, week }) {
  const today = formatDate(new Date());
  return (
    <div className="grid grid-cols-7 gap-1 mb-1">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(weekStart, week * 7 + i);
        const str = formatDate(d);
        const isToday = str === today;
        const isSat = i === 5;
        const isSun = i === 6;
        return (
          <div
            key={i}
            className={cn(
              "text-center py-1.5 rounded-lg text-xs font-semibold select-none",
              isToday
                ? "bg-brand-500 text-white"
                : "bg-surface-800 text-surface-400",
              isSat && !isToday && "text-sky-400",
              isSun && !isToday && "text-rose-400"
            )}
          >
            <div>{DAY_LABELS[i]}</div>
            <div
              className={cn(
                "text-[10px] font-normal mt-0.5",
                isToday ? "text-white/80" : "text-surface-500"
              )}
            >
              {d.getMonth() + 1}/{d.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 태스크 아이템 (재귀) ────────────────────────────────────────────────────

function TaskItem({ task, depth = 0, onUpdate, onDelete, onAddSub }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [expanded, setExpanded] = useState(true);
  const inputRef = useRef(null);

  const hasSubs = task.subs && task.subs.length > 0;

  function commitEdit() {
    if (draft.trim()) onUpdate({ ...task, text: draft.trim() });
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") {
      setDraft(task.text);
      setEditing(false);
    }
  }

  function updateSub(idx, updated) {
    const subs = task.subs.map((s, i) => (i === idx ? updated : s));
    onUpdate({ ...task, subs });
  }

  function deleteSub(idx) {
    const subs = task.subs.filter((_, i) => i !== idx);
    onUpdate({ ...task, subs });
  }

  function addSubToSub(idx, newSub) {
    const subs = task.subs.map((s, i) => {
      if (i !== idx) return s;
      return { ...s, subs: [...(s.subs || []), newSub] };
    });
    onUpdate({ ...task, subs });
  }

  return (
    <div className={cn("group/item", depth > 0 && "ml-3 border-l border-surface-700 pl-2")}>
      <div className="flex items-start gap-1 py-0.5">
        {/* 완료 체크 */}
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onUpdate({ ...task, done: !task.done })}
          className="mt-0.5"
        />

        {/* 텍스트 */}
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="flex-1 text-xs bg-surface-700 rounded px-1 py-0.5 outline-none text-surface-100 min-w-0"
          />
        ) : (
          <span
            onDoubleClick={() => {
              setEditing(true);
              setTimeout(() => inputRef.current?.select(), 0);
            }}
            className={cn(
              "flex-1 text-xs leading-relaxed cursor-text min-w-0 break-words",
              task.done ? "line-through text-surface-500" : "text-surface-100"
            )}
          >
            {task.text}
          </span>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
          {hasSubs && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-surface-500 hover:text-surface-200 p-0.5 rounded"
            >
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          <button
            onClick={() =>
              onAddSub({
                id: crypto.randomUUID(),
                text: "새 하위 할 일",
                done: false,
                subs: [],
              })
            }
            className="text-surface-500 hover:text-brand-400 p-0.5 rounded"
            title="하위 태스크 추가"
          >
            <Plus size={10} />
          </button>
          <button
            onClick={onDelete}
            className="text-surface-500 hover:text-rose-400 p-0.5 rounded"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* 하위 태스크 */}
      {hasSubs && expanded && (
        <div>
          {task.subs.map((sub, idx) => (
            <TaskItem
              key={sub.id}
              task={sub}
              depth={depth + 1}
              onUpdate={(updated) => updateSub(idx, updated)}
              onDelete={() => deleteSub(idx)}
              onAddSub={(newSub) => addSubToSub(idx, newSub)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 날짜 셀 ─────────────────────────────────────────────────────────────────

function DayCell({ tasks, onAdd, onUpdateTask, onDeleteTask, colorIdx }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  function commitAdd() {
    if (draft.trim()) {
      onAdd({ id: crypto.randomUUID(), text: draft.trim(), done: false, subs: [] });
    }
    setDraft("");
    setAdding(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") commitAdd();
    if (e.key === "Escape") {
      setDraft("");
      setAdding(false);
    }
  }

  function addSubToTask(taskIdx, newSub) {
    const t = tasks[taskIdx];
    onUpdateTask(taskIdx, { ...t, subs: [...(t.subs || []), newSub] });
  }

  const ringColor = RING_COLORS[colorIdx % RING_COLORS.length];

  return (
    <div
      className={cn(
        "min-h-[80px] bg-surface-900 rounded-lg p-1.5 ring-1 ring-surface-700/50 flex flex-col gap-0.5 relative group/cell",
        "hover:ring-1",
        `hover:${ringColor}`
      )}
    >
      {/* 태스크 목록 */}
      {tasks.map((task, idx) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdate={(updated) => onUpdateTask(idx, updated)}
          onDelete={() => onDeleteTask(idx)}
          onAddSub={(newSub) => addSubToTask(idx, newSub)}
        />
      ))}

      {/* 추가 입력 */}
      {adding ? (
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitAdd}
          onKeyDown={handleKeyDown}
          placeholder="할 일 입력 후 Enter"
          className="text-xs bg-surface-700 rounded px-1.5 py-1 outline-none text-surface-100 placeholder-surface-500 w-full"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full text-left text-[10px] text-surface-600 hover:text-brand-400 flex items-center gap-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity mt-auto pt-0.5"
        >
          <Plus size={10} /> 추가
        </button>
      )}
    </div>
  );
}

// ─── 그룹 행 ─────────────────────────────────────────────────────────────────

function GroupRow({ group, weekStart, week, colorIdx, onUpdate, onDelete }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [collapsed, setCollapsed] = useState(false);
  const nameRef = useRef(null);

  const color = COLORS[colorIdx % COLORS.length];
  const textColor = TEXT_COLORS[colorIdx % TEXT_COLORS.length];

  function commitName() {
    if (nameDraft.trim()) onUpdate({ ...group, name: nameDraft.trim() });
    setEditingName(false);
  }

  function getDayKey(weekOffset, dayIndex) {
    const d = addDays(weekStart, weekOffset * 7 + dayIndex);
    return formatDate(d);
  }

  function handleCellAdd(dateKey, task) {
    const tasks = { ...(group.tasks || {}) };
    tasks[dateKey] = [...(tasks[dateKey] || []), task];
    onUpdate({ ...group, tasks });
  }

  function handleCellUpdateTask(dateKey, taskIdx, updated) {
    const tasks = { ...(group.tasks || {}) };
    tasks[dateKey] = tasks[dateKey].map((t, i) => (i === taskIdx ? updated : t));
    onUpdate({ ...group, tasks });
  }

  function handleCellDeleteTask(dateKey, taskIdx) {
    const tasks = { ...(group.tasks || {}) };
    tasks[dateKey] = tasks[dateKey].filter((_, i) => i !== taskIdx);
    onUpdate({ ...group, tasks });
  }

  return (
    <div className="mb-3">
      {/* 그룹 헤더 */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", color)} />
        {editingName ? (
          <input
            ref={nameRef}
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") { setNameDraft(group.name); setEditingName(false); }
            }}
            className="text-sm font-semibold bg-surface-800 rounded px-2 py-0.5 outline-none text-surface-100 w-40"
          />
        ) : (
          <span
            onDoubleClick={() => setEditingName(true)}
            className={cn("text-sm font-semibold cursor-text", textColor)}
          >
            {group.name}
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-surface-500 hover:text-surface-200 p-1 rounded transition-colors"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={onDelete}
            className="text-surface-600 hover:text-rose-400 p-1 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 날짜 그리드 */}
      {!collapsed && (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => {
            const dateKey = getDayKey(week, i);
            return (
              <DayCell
                key={i}
                tasks={group.tasks?.[dateKey] || []}
                colorIdx={colorIdx}
                onAdd={(task) => handleCellAdd(dateKey, task)}
                onUpdateTask={(idx, updated) =>
                  handleCellUpdateTask(dateKey, idx, updated)
                }
                onDeleteTask={(idx) => handleCellDeleteTask(dateKey, idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 메인 앱 ─────────────────────────────────────────────────────────────────

export default function TodoApp() {
  const { state, loading, saving, save } = useStore();
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = 1주차, 1 = 2주차

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const weekStart = new Date(state.startDate); // 월요일 기준

  function addGroup() {
    const newGroup = {
      id: crypto.randomUUID(),
      name: `그룹 ${(state.groups?.length || 0) + 1}`,
      tasks: {},
    };
    save({ ...state, groups: [...(state.groups || []), newGroup] });
  }

  function updateGroup(idx, updated) {
    const groups = state.groups.map((g, i) => (i === idx ? updated : g));
    save({ ...state, groups });
  }

  function deleteGroup(idx) {
    const groups = state.groups.filter((_, i) => i !== idx);
    save({ ...state, groups });
  }

  function shiftWeek(dir) {
    // +7일 또는 -7일로 startDate 이동
    const newStart = addDays(weekStart, dir * 7);
    save({ ...state, startDate: formatDate(newStart) });
  }

  // 현재 주의 날짜 범위 표시
  const rangeStart = addDays(weekStart, currentWeek * 7);
  const rangeEnd = addDays(rangeStart, 6);
  const rangeLabel = `${rangeStart.getMonth() + 1}/${rangeStart.getDate()} – ${rangeEnd.getMonth() + 1}/${rangeEnd.getDate()}`;

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-20 bg-surface-950/90 backdrop-blur border-b border-surface-800 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-6 rounded-full bg-brand-500" />
          <h1 className="text-lg font-bold tracking-tight">2-Week Todo</h1>
        </div>

        {/* 저장 상태 */}
        <div className="text-xs text-surface-500 flex items-center gap-1">
          {saving && <Loader2 size={12} className="animate-spin text-brand-400" />}
          {saving ? "저장 중…" : "자동 저장됨"}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* 주 이동 */}
          <button
            onClick={() => shiftWeek(-1)}
            className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors"
            title="이전 주로 이동"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors"
            title="다음 주로 이동"
          >
            <ChevronRight size={16} />
          </button>

          {/* 그룹 추가 */}
          <button
            onClick={addGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            그룹 추가
          </button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-[1600px] mx-auto">
        {/* 주차 탭 */}
        <div className="flex items-center gap-2 mb-4">
          {[0, 1].map((w) => {
            const s = addDays(weekStart, w * 7);
            const e = addDays(s, 6);
            const label = `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}`;
            return (
              <button
                key={w}
                onClick={() => setCurrentWeek(w)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  currentWeek === w
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "bg-surface-800 text-surface-400 hover:text-surface-200"
                )}
              >
                {w === 0 ? "1주차" : "2주차"}{" "}
                <span className="text-[11px] opacity-75">{label}</span>
              </button>
            );
          })}
          <div className="ml-auto text-xs text-surface-500">
            더블클릭으로 텍스트 수정 · Enter 확정 · Esc 취소
          </div>
        </div>

        {/* 날짜 헤더 */}
        <DateHeader weekStart={weekStart} week={currentWeek} />

        {/* 그룹 목록 */}
        {state.groups?.length === 0 ? (
          <div className="text-center py-20 text-surface-600">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">
              오른쪽 위 &apos;그룹 추가&apos; 버튼을 눌러 시작하세요
            </div>
          </div>
        ) : (
          state.groups.map((group, idx) => (
            <GroupRow
              key={group.id}
              group={group}
              weekStart={weekStart}
              week={currentWeek}
              colorIdx={idx}
              onUpdate={(updated) => updateGroup(idx, updated)}
              onDelete={() => deleteGroup(idx)}
            />
          ))
        )}
      </main>
    </div>
  );
}
