
import React from 'react';
import { Task } from '../../types';
import Button from '../ui/Button';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleComplete, onEditTask, onDeleteTask }) => {
  if (!tasks || tasks.length === 0) {
    return <p className="text-[var(--color-text-secondary)] text-center py-4">No hay tareas asignadas a este trabajo.</p>;
  }

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());


  return (
    <div className="space-y-3">
      {sortedTasks.map(task => (
        <div key={task.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors duration-200 ${task.isCompleted ? 'bg-[var(--color-surface-3)] opacity-70' : 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]'}`}>
          <div className="flex items-center flex-grow overflow-hidden">
            <input
              type="checkbox"
              checked={task.isCompleted}
              onChange={() => onToggleComplete(task.id)}
              className="mr-3 h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-aquamarine)] focus:ring-[var(--color-aquamarine)] bg-[var(--color-surface-1)] cursor-pointer"
              aria-labelledby={`task-title-${task.id}`}
            />
            <div className="flex-grow">
              <p id={`task-title-${task.id}`} className={`text-[var(--color-text-primary)] font-medium truncate ${task.isCompleted ? 'line-through text-[var(--color-text-secondary)]' : ''}`}>
                {task.title}
              </p>
              {task.dueDate && (
                <p className={`text-xs ${task.isCompleted ? 'text-gray-500' : 'text-[var(--color-text-secondary)]'}`}>
                  Vence: {new Date(task.dueDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                   {task.allocatedTime && ` (${task.allocatedTime})`}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0 ml-2">
            <Button variant="ghost" size="sm" onClick={() => onEditTask(task)} className="p-1" aria-label="Editar tarea">
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDeleteTask(task.id)} className="p-1" aria-label="Eliminar tarea">
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
