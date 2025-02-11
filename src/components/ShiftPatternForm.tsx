import React, { useState, useEffect } from 'react';

// Объявляем интерфейс для правила чередования, где все поля соответствуют SharePoint
export interface ShiftPattern {
  ID: number;          // числовой идентификатор
  Name: string;
  Pattern: boolean[];  // массив для определения смен (true/false)
}

interface ShiftPatternFormProps {
  onSave: (pattern: ShiftPattern) => void;
  onDelete: (id: number) => void;
  existingPatterns: ShiftPattern[];
}

export default function ShiftPatternForm({
  onSave,
  onDelete,
  existingPatterns,
}: ShiftPatternFormProps) {
  // Если выбран существующий паттерн, его ID хранится здесь (0 означает новый паттерн)
  const [selectedPatternId, setSelectedPatternId] = useState<number>(0);
  const [pattern, setPattern] = useState<ShiftPattern>({
    ID: 0,
    Name: '',
    Pattern: [false], // Изначально правило на один день
  });

  // При изменении выбранного паттерна или списка существующих правил обновляем форму
  useEffect(() => {
    if (selectedPatternId !== 0) {
      const selectedPattern = existingPatterns.find((p) => p.ID === selectedPatternId);
      if (selectedPattern) {
        setPattern(selectedPattern);
      }
    } else {
      setPattern({ ID: 0, Name: '', Pattern: [false] });
    }
  }, [selectedPatternId, existingPatterns]);

  const addDay = () => {
    setPattern((prev) => ({
      ...prev,
      Pattern: [...prev.Pattern, false],
    }));
  };

  const toggleDay = (dayIndex: number) => {
    setPattern((prev) => ({
      ...prev,
      Pattern: prev.Pattern.map((isShift, index) =>
        index === dayIndex ? !isShift : isShift
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Для нового правила (ID === 0) передаём просто 0, чтобы SharePoint сам сгенерировал ID
    onSave({ ...pattern, ID: pattern.ID !== 0 ? pattern.ID : 0 });
    setPattern({ ID: 0, Name: '', Pattern: [false] });
    setSelectedPatternId(0);
  };
  

  const handleDelete = () => {
    if (pattern.ID !== 0) {
      onDelete(pattern.ID);
      setPattern({ ID: 0, Name: '', Pattern: [false] });
      setSelectedPatternId(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded">
      <h3 className="text-lg font-bold mb-2">Правило чередования</h3>
      <div className="mb-2">
        <select
          value={selectedPatternId}
          onChange={(e) => setSelectedPatternId(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value={0}>Новое правило чередования</option>
          {existingPatterns.map((p) => (
            <option key={p.ID} value={p.ID}>
              {p.Name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <input
          type="text"
          value={pattern.Name}
          onChange={(e) =>
            setPattern((prev) => ({ ...prev, Name: e.target.value }))
          }
          placeholder="Название правила чередования"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-2">
        <div className="flex gap-2">
          {pattern.Pattern.map((isShift, index) => (
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
        <button
          type="button"
          onClick={addDay}
          className="px-2 py-1 bg-blue-500 text-white rounded"
        >
          Добавить день
        </button>
      </div>
      <div className="flex justify-between">
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          {pattern.ID !== 0 ? 'Обновить' : 'Сохранить'} правило чередования
        </button>
        {pattern.ID !== 0 && (
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
