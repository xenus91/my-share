import React, { useState } from 'react';
import { Employee, ShiftPattern, ShiftTypeDefinition } from '../types';
import { format, addDays } from 'date-fns';

interface AssignShiftPatternFormProps {
  employees: { id: string; name: string }[];
  shiftPatterns: ShiftPattern[];
  shiftTypes: ShiftTypeDefinition[];
  onAssign: (
    assignments: {
      employeeId: string;
      shiftTypeId: string;
      date: string;
    }[]
  ) => void;
}

export default function AssignShiftPatternForm({
  employees,
  shiftPatterns,
  shiftTypes,
  onAssign,
}: AssignShiftPatternFormProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [shiftPatternId, setShiftPatternId] = useState('');
  const [shiftTypeId, setShiftTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    const selectedPattern = shiftPatterns.find((p) => p.id === shiftPatternId);
    const selectedShiftType = shiftTypes.find((type) => type.id === shiftTypeId);
  
    if (!selectedPattern || !selectedShiftType || !startDate || !endDate) {
      alert('Заполните все поля');
      return;
    }
  
    const assignments: {
      employeeId: string;
      shiftTypeId: string;
      date: string;
    }[] = [];
  
    selectedEmployees.forEach((employeeId) => {
      let currentDate = new Date(startDate);
      let dayIndex = 0;
  
      while (currentDate <= new Date(endDate)) {
        // Проверяем, является ли текущий день рабочим в паттерне
        if (selectedPattern.pattern[dayIndex % selectedPattern.pattern.length]) {
          assignments.push({
            employeeId,
            shiftTypeId: selectedShiftType.id,
            date: format(currentDate, 'yyyy-MM-dd'),
          });
        }
  
        currentDate = addDays(currentDate, 1);
        dayIndex++; // Циклический переход по дням паттерна
      }
    });
  
    onAssign(assignments);
  };
  

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-100 rounded">
      <h3 className="text-lg font-bold mb-2">Назначить график сотрудникам</h3>
      <div className="mb-2">
        <label className="block mb-1">Сотрудники</label>
        <select
          multiple
          value={selectedEmployees}
          onChange={(e) =>
            setSelectedEmployees(Array.from(e.target.selectedOptions, (option) => option.value))
          }
          className="w-full p-2 border rounded"
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Правило чередования</label>
        <select
          value={shiftPatternId}
          onChange={(e) => setShiftPatternId(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Выберите правило чередования</option>
          {shiftPatterns.map((pattern) => (
            <option key={pattern.id} value={pattern.id}>
              {pattern.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Тип смены</label>
        <select
          value={shiftTypeId}
          onChange={(e) => setShiftTypeId(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Выберите тип смены</option>
          {shiftTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Дата начала</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Дата окончания</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          Назначить
        </button>
      </div>
    </form>
  );
}
