
import React from 'react';
import { Task } from '../../types';

interface TaskTimelineViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({ tasks, onTaskClick }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

  const upcomingTasks = tasks
    .filter(task => !task.isCompleted && task.dueDate)
    .map(task => ({
      ...task,
      dueDateObj: new Date(task.dueDate!),
    }))
    .sort((a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime());

  if (upcomingTasks.length === 0) {
    return <p className="text-[var(--color-text-secondary)] text-center py-4">No hay tareas próximas o vencidas.</p>;
  }

  const getStatusText = (dueDateObj: Date): { text: string; color: string } => {
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Vencida hace ${Math.abs(diffDays)} día(s)`, color: 'text-red-400' };
    if (diffDays === 0) return { text: 'Vence Hoy', color: 'text-yellow-400' };
    return { text: `Vence en ${diffDays} día(s)`, color: 'text-[var(--color-aquamarine)]' };
  };

  return (
    <div className="space-y-3">
      {upcomingTasks.map(task => {
        const status = getStatusText(task.dueDateObj);
        return (
          <div
            key={task.id}
            className="p-3 bg-[var(--color-surface-2)] rounded-lg cursor-pointer hover:bg-[var(--color-surface-3)] transition-colors"
            onClick={() => onTaskClick && onTaskClick(task)}
          >
            <div className="flex justify-between items-center">
              <p className="text-[var(--color-text-primary)] font-medium">{task.title}</p>
              <span className={`text-xs font-semibold ${status.color}`}>{status.text}</span>
            </div>
            {task.description && <p className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">{task.description}</p>}
             <p className="text-xs text-[var(--color-text-secondary)] opacity-80 mt-0.5">
                Vence: {task.dueDateObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                {task.allocatedTime && ` (${task.allocatedTime})`}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TaskTimelineView;
