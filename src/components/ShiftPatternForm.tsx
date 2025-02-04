'use client';
import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

interface ShiftPattern {
  id: string;
  name: string;
  pattern: boolean[]; // Одномерный массив, где каждая ячейка = смена (true или false)
}

interface ShiftPatternFormProps {
  onSave: (pattern: ShiftPattern) => void;
  onDelete: (id: string) => void;
  existingPatterns: ShiftPattern[];
}

export default function ShiftPatternForm({
  onSave,
  onDelete,
  existingPatterns,
}: ShiftPatternFormProps) {
  const [selectedPatternId, setSelectedPatternId] = useState('');
  const [pattern, setPattern] = useState<ShiftPattern>({
    id: '',
    name: '',
    pattern: [false], // Изначально один день
  });

  useEffect(() => {
    if (selectedPatternId) {
      const selectedPattern = existingPatterns.find((p) => p.id === selectedPatternId);
      if (selectedPattern) {
        setPattern(selectedPattern);
      }
    } else {
      setPattern({ id: '', name: '', pattern: [false] });
    }
  }, [selectedPatternId, existingPatterns]);

  const addDay = () => {
    setPattern((prev) => ({
      ...prev,
      pattern: [...prev.pattern, false],
    }));
  };

  const toggleDay = (dayIndex: number) => {
    setPattern((prev) => ({
      ...prev,
      pattern: prev.pattern.map((isShift, index) =>
        index === dayIndex ? !isShift : isShift
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...pattern, id: pattern.id || nanoid() });
    setPattern({ id: '', name: '', pattern: [false] });
    setSelectedPatternId('');
  };

  const handleDelete = () => {
    if (pattern.id) {
      onDelete(pattern.id);
      setPattern({ id: '', name: '', pattern: [false] });
      setSelectedPatternId('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded">
      <h3 className="text-lg font-bold mb-2">Правило чередования</h3>
      <div className="mb-2">
        <select
          value={selectedPatternId}
          onChange={(e) => setSelectedPatternId(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Новое правило чередования</option>
          {existingPatterns.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <input
          type="text"
          value={pattern.name}
          onChange={(e) => setPattern((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Название правила чередования"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-2">
        <div className="flex gap-2">
          {pattern.pattern.map((isShift, index) => (
            <label key={index} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={isShift}
                onChange={() => toggleDay(index)}
              />
              День {index + 1}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <button type="button" onClick={addDay} className="px-2 py-1 bg-blue-500 text-white rounded">
          Добавить день
        </button>
      </div>
      <div className="flex justify-between">
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
          {pattern.id ? 'Обновить' : 'Сохранить'} правило чередования
        </button>
        {pattern.id && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Удалить правило чередования
          </button>
        )}
      </div>
    </form>
  );
}
