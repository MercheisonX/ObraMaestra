
import React, { useState } from 'react';
import { Task } from '../../types';
import Button from '../ui/Button'; 

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void; 
}

const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Adjust startDate to be the Sunday of the week the month starts in
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay()); 

  const days: Date[] = [];
  let dayIterator = new Date(startDate);

  // Generate 42 days (6 weeks) to fill the calendar grid
  for (let i = 0; i < 42; i++) {
    days.push(new Date(dayIterator));
    dayIterator.setDate(dayIterator.getDate() + 1);
  }

  const tasksByDueDate: { [key: string]: Task[] } = {};
  tasks.forEach(task => {
    if (task.dueDate) {
      // Ensure dueDate is treated as local date, not UTC, to avoid timezone shifts
      const [year, month, dayNum] = task.dueDate.split('-').map(Number);
      const localDueDate = new Date(year, month - 1, dayNum);
      const dateKey = localDueDate.toISOString().split('T')[0];

      if (!tasksByDueDate[dateKey]) {
        tasksByDueDate[dateKey] = [];
      }
      tasksByDueDate[dateKey].push(task);
    }
  });

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0); // Normalize today for comparison
  const todayKey = todayDate.toISOString().split('T')[0];

  return (
    <div className="bg-[var(--color-surface-1)] p-3 sm:p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => changeMonth(-1)} size="sm" variant="secondary">&lt; Anterior</Button>
        <h3 className="text-lg font-semibold text-center text-[var(--color-text-primary)] capitalize">
          {currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
        </h3>
        <Button onClick={() => changeMonth(1)} size="sm" variant="secondary">Siguiente &gt;</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-text-secondary)] font-medium mb-2 py-1">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, index) => {
          const dateKey = d.toISOString().split('T')[0];
          const tasksForDay = tasksByDueDate[dateKey] || [];
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const isToday = dateKey === todayKey;

          return (
            <div
              key={index}
              className={`min-h-[4.5rem] sm:min-h-[5rem] border border-[var(--color-surface-3)] rounded-md p-1.5 flex flex-col items-start relative transition-colors duration-150
                ${isCurrentMonth ? 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]' : 'bg-black/50 text-[var(--color-text-secondary)] opacity-60'}
              `}
            >
              <span className={`text-xs font-semibold self-start mb-1 w-5 h-5 flex items-center justify-center
                ${isToday ? 'bg-[var(--color-aquamarine)] text-black rounded-full' : (isCurrentMonth ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]')}
              `}>
                {d.getDate()}
              </span>
              {isCurrentMonth && tasksForDay.length > 0 && (
                <div className="space-y-0.5 w-full flex-grow overflow-hidden">
                  {tasksForDay.slice(0, 2).map(task => ( // Show max 2 tasks, or indicators
                     <div 
                        key={task.id} 
                        className={`w-full text-left text-[9px] sm:text-[10px] p-0.5 rounded truncate ${task.isCompleted ? 'bg-green-600/70 text-white/90 line-through' : 'bg-[var(--color-aquamarine)] text-black'} cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => onTaskClick && onTaskClick(task)}
                        title={task.title}
                    >
                        {task.title}
                    </div>
                  ))}
                  {tasksForDay.length > 2 && <div className="text-[8px] sm:text-[9px] text-[var(--color-aquamarine)] text-center w-full mt-0.5">+{tasksForDay.length - 2} más</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskCalendarView;