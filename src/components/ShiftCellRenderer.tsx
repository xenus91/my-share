'use client';

import  { useState } from "react";
import type { ICellRendererParams } from "ag-grid-community";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Shift, ShiftTypeDefinition } from "../types";
import { ShiftCard } from "./ShiftCard";
import { ShiftDialog } from "./ShiftDialog";

interface ExtraCellRendererParams {
  shiftTypes: ShiftTypeDefinition[];
  handleAddShift: (employeeId: string, date: string, shiftData: Omit<Shift, "id">) => void;
  handleUpdateShift: (
    employeeId: string,
    date: string,
    shiftId: string,
    shiftData: Omit<Shift, "id">
  ) => void;
  handleDeleteShift: (employeeId: string, date: string, shiftId: string) => void;
}

export function ShiftCellRenderer(
  props: ICellRendererParams & ExtraCellRendererParams
) {
  const { shiftTypes, handleAddShift, handleUpdateShift, handleDeleteShift } = props;
  const { employeeId = "", date = "", shifts = [] } = props.value || {};
  const workloadPeriods = props.data.workloadPeriods || [];

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

  let fraction = 1;
  if (workloadPeriods.length > 0) {
    for (const period of workloadPeriods) {
      if (
        (!period.startDate || period.startDate <= date) &&
        (!period.endDate || period.endDate >= date)
      ) {
        fraction = period.fraction;
      }
    }
  }
  const showFractionBlock = fraction < 1;

  return (
    <Box
      sx={{
        minHeight: 60,
        p: 0,
        display: "flex",
        height: "100%",
        backgroundColor: isWeekend ? "#FEFCE8" : "inherit",
      }}
    >
      {/* Левая часть: кнопка "Добавить смену" */}
      <Box
        sx={{
          width: "16.66%", // ~2/12
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          flexShrink: 0,
        }}
      >
        <Button
          variant="text"
          size="small"
          sx={{ minWidth: 0, width: 24, height: 24, mb: 1 }}
          onClick={() => setAddDialogOpen(true)}
        >
          <AddIcon fontSize="small" />
        </Button>
        <ShiftDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          employeeId={employeeId}
          date={date}
          shiftTypes={shiftTypes}
          onSave={(shiftData) => {
            handleAddShift(employeeId, date, shiftData);
            setAddDialogOpen(false);
          }}
        />
      </Box>

      {/* Правая часть: блок "Доля" (если fraction < 1) и список смен */}
      <Box
        sx={{
          width: "83.33%", // ~10/12
          height: "100%",
          overflowY: "auto",
        }}
      >
        {showFractionBlock && (
          <Typography variant="caption" sx={{ color: "gray", fontWeight: 600, mb: 1 }}>
            Доля: {Math.round(fraction * 100)}%
          </Typography>
        )}
        {shifts.map((shift: Shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            shiftTypes={shiftTypes}
            employeeId={employeeId}
            date={date}
            onUpdateShift={(data) => handleUpdateShift(employeeId, date, shift.id, data)}
            onDeleteShift={(shiftId) => handleDeleteShift(employeeId, date, shiftId)}
          />
        ))}
      </Box>
    </Box>
  );
}
