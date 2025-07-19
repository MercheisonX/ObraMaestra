

import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Task } from '../../types';
import { generateId } from '../../utils/localStorageManager';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task?: Task | null;
  jobId: string;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, task, jobId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [allocatedTime, setAllocatedTime] = useState('');

  useEffect(() => {
    if (isOpen) { // Only update form when modal is opened or task changes while open
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : ''); // Format for date input
        setAllocatedTime(task.allocatedTime || '');
      } else {
        setTitle('');
        setDescription('');
        setDueDate('');
        setAllocatedTime('');
      }
    }
  }, [task, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert("El título de la tarea es obligatorio.");
      return;
    }
    const taskData: Task = {
      id: task?.id || generateId('task-'),
      jobId: task?.jobId || jobId,
      title,
      description,
      isCompleted: task?.isCompleted || false,
      creationDate: task?.creationDate || new Date().toISOString(),
      dueDate: dueDate || undefined,
      allocatedTime: allocatedTime || undefined,
    };
    onSave(taskData);
    // The parent (JobDetailModal) will call onClose for this modal
    // No, this modal should call its own onClose prop.
    onClose(); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Editar Tarea' : 'Añadir Nueva Tarea'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título de la Tarea"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Comprar materiales"
          required
        />
        <div>
          <label htmlFor="task-description" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Descripción (Opcional)</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full px-4 py-3 bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aquamarine)] focus:border-[var(--color-aquamarine)] sm:text-sm font-medium"
            placeholder="Detalles adicionales sobre la tarea..."
          />
        </div>
        <Input
          label="Fecha de Vencimiento (Opcional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <Input
          label="Tiempo Asignado (Opcional)"
          value={allocatedTime}
          onChange={(e) => setAllocatedTime(e.target.value)}
          placeholder="Ej: 2 horas, 1 día"
        />
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {task ? 'Guardar Cambios' : 'Añadir Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
