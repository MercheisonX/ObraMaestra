

import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Client } from '../../types';
import ImageUpload from '../ui/ImageUpload';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'> | Client) => void;
  client?: Client | null;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setContact(client.contact || '');
      setAddress(client.address || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setNotes(client.notes || '');
      setPhotoUrl(client.photoUrl || null);
    } else {
      // Reset form for new client
      setName('');
      setContact('');
      setAddress('');
      setEmail('');
      setPhone('');
      setNotes('');
      setPhotoUrl(null);
    }
  }, [client, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
        alert("El nombre del cliente es obligatorio.");
        return;
    }
    const clientData = {
      name,
      contact,
      address,
      email,
      phone,
      notes,
      photoUrl: photoUrl || undefined,
    };
    if (client && client.id) {
      onSave({ ...clientData, id: client.id });
    } else {
      onSave(clientData);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ImageUpload
            label="Foto del Cliente (Opcional)"
            currentImageUrl={photoUrl}
            onImageSelected={setPhotoUrl}
        />
        <Input
          label="Nombre Completo del Cliente o Empresa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Juan Pérez o Constructora ABC"
          required
        />
        <Input
          label="Número de Identificación o NIT"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Ej: 123456789-0"
        />
        <Input
          label="Dirección Principal"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Calle 10 # 20-30, Apto 101"
        />
        <Input
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ej: cliente@example.com"
        />
        <Input
          label="Teléfono de Contacto"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej: 3001234567"
        />
        <div className="w-full">
            <label htmlFor="client-notes" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">Notas Adicionales</label>
            <textarea
                id="client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full px-4 py-3 bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aquamarine)] focus:border-[var(--color-aquamarine)] sm:text-sm font-medium"
                placeholder="Preferencias de contacto, horarios, etc."
            />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {client ? 'Guardar Cambios' : 'Añadir Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientFormModal;