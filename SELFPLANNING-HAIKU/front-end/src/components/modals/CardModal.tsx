'use client';

import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { Avatar } from '../Avatar';
import { Label } from '../Label';
import type { Card as CardType, Label as LabelType, User } from '@/services/boardService';

interface CardModalProps {
  isOpen: boolean;
  card?: CardType | null;
  labels?: LabelType[];
  boardMembers?: User[];
  onClose: () => void;
  onSave: (cardData: Partial<CardType>) => Promise<void>;
  onDelete?: (cardId: string) => Promise<void>;
}

export function CardModal({
  isOpen,
  card,
  labels = [],
  boardMembers = [],
  onClose,
  onSave,
  onDelete,
}: CardModalProps) {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [dueDate, setDueDate] = useState(card?.dueDate || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    card?.labels.map((l) => l.id) || []
  );
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    card?.assignees.map((a) => a.id) || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!card || !onDelete) return;
    if (!confirm('Are you sure you want to delete this card?')) return;

    setIsLoading(true);
    try {
      await onDelete(card.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete card');
    } finally {
      setIsLoading(false);
    }
  };

  const actions = (
    <>
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={isLoading}
      >
        Cancel
      </Button>
      {card && onDelete && (
        <Button
          variant="danger"
          onClick={handleDelete}
          isLoading={isLoading}
        >
          Delete
        </Button>
      )}
      <Button
        variant="primary"
        onClick={handleSave}
        isLoading={isLoading}
      >
        {card ? 'Update' : 'Create'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      title={card ? 'Edit Card' : 'Create Card'}
      onClose={onClose}
      size="lg"
      actions={actions}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-bg text-red rounded">
            {error}
          </div>
        )}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Card title"
          fullWidth
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="w-full px-4 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent resize-vertical"
            rows={4}
          />
        </div>

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          fullWidth
        />

        {/* Labels */}
        {labels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => {
                    setSelectedLabels((prev) =>
                      prev.includes(label.id)
                        ? prev.filter((l) => l !== label.id)
                        : [...prev, label.id]
                    );
                  }}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    selectedLabels.includes(label.id)
                      ? 'ring-2 ring-blue'
                      : 'opacity-60'
                  }`}
                >
                  <Label name={label.name} color={label.color} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assignees */}
        {boardMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Assignees
            </label>
            <div className="flex flex-wrap gap-2">
              {boardMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedAssignees((prev) =>
                      prev.includes(member.id)
                        ? prev.filter((a) => a !== member.id)
                        : [...prev, member.id]
                    );
                  }}
                  className={`p-1 rounded transition-all ${
                    selectedAssignees.includes(member.id)
                      ? 'ring-2 ring-blue'
                      : 'opacity-60'
                  }`}
                  title={member.name}
                >
                  <Avatar name={member.name} size="md" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Checklists Preview */}
        {card && card.checklists.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Checklists
            </label>
            <div className="space-y-2">
              {card.checklists.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled
                    className="w-4 h-4"
                  />
                  <span
                    className={
                      item.completed ? 'line-through text-muted' : 'text-body'
                    }
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Preview */}
        {card && card.comments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Comments ({card.comments.length})
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {card.comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="p-2 bg-surface-alt rounded text-xs">
                  <p className="font-semibold text-ink">{comment.author.name}</p>
                  <p className="text-body line-clamp-2">{comment.content}</p>
                </div>
              ))}
              {card.comments.length > 3 && (
                <p className="text-xs text-muted">
                  +{card.comments.length - 3} more comments
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
