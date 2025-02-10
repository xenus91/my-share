//
import React, { useState } from "react";
import { format, addDays } from "date-fns";
import { ShiftPattern, ShiftTypeDefinition } from "../types";

interface AssignShiftPatternFormProps {
  employees: { id: string; name: string }[];
  shiftPatterns: ShiftPattern[];
  shiftTypes: ShiftTypeDefinition[];
  onAssign: (
    assignments: {
      employeeId: string;
      shiftTypeId: number;
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
  // Здесь будем хранить числовые ID, поэтому указываем тип number для shiftPatternId и shiftTypeId
  const [shiftPatternId, setShiftPatternId] = useState<number | null>(null);
  const [shiftTypeId, setShiftTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Находим выбранное правило по его числовому ID
    const selectedPattern = shiftPatterns.find((p) => p.ID === shiftPatternId);
    // Аналогично для типа смены
    const selectedShiftType = shiftTypes.find((type) => type.ID === shiftTypeId);

    if (!selectedPattern || !selectedShiftType || !startDate || !endDate) {
      alert("Заполните все поля");
      return;
    }

    const assignments: {
      employeeId: string;
      shiftTypeId: number;
      date: string;
    }[] = [];

    selectedEmployees.forEach((employeeId) => {
      let currentDate = new Date(startDate);
      let dayIndex = 0;

      while (currentDate <= new Date(endDate)) {
        // Используем свойство Pattern (с заглавной буквы) для проверки дня
        if (selectedPattern.Pattern[dayIndex % selectedPattern.Pattern.length]) {
          assignments.push({
            employeeId,
            shiftTypeId: selectedShiftType.ID,
            date: format(currentDate, "yyyy-MM-dd"),
          });
        }
        currentDate = addDays(currentDate, 1);
        dayIndex++;
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
            setSelectedEmployees(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
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
          value={shiftPatternId ?? ""}
          onChange={(e) => setShiftPatternId(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="">Выберите правило чередования</option>
          {shiftPatterns.map((pattern) => (
            <option key={pattern.ID} value={pattern.ID}>
              {pattern.Name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-2">
        <label className="block mb-1">Тип смены</label>
        <select
          value={shiftTypeId ?? ""}
          onChange={(e) => setShiftTypeId(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="">Выберите тип смены</option>
          {shiftTypes.map((type) => (
            <option key={type.ID} value={type.ID}>
              {type.Name}
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
