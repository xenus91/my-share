'use client';

import React, { useState, MouseEvent } from "react";
import { Button, Menu, MenuItem, Typography, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Shift, ShiftTypeDefinition } from "../types";
import { ShiftDialog } from "./ShiftDialog";

interface ShiftCardProps {
  shift: Shift;
  shiftTypes: ShiftTypeDefinition[];
  employeeId: string;
  date: string;
  onUpdateShift: (shiftData: Omit<Shift, "id">) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  shiftTypes,
  employeeId,
  date,
  onUpdateShift,
  onDeleteShift,
}) => {
  const shiftType = shiftTypes.find((type) => type.id === shift.shiftTypeId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);

  if (!shiftType) return null;

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditOpen(true);
    closeMenu();
  };

  const handleDelete = () => {
    onDeleteShift(shift.id);
    closeMenu();
  };

  return (
    <>
      <Button
        onClick={openMenu}
        fullWidth
        variant="contained"
        size="small"
        sx={{
          backgroundColor: shiftType.backgroundColor,
          color: shiftType.textColor,
          textTransform: "none",
          padding: "2px 8px",
          mb: "1px",
          "&:hover": { filter: "brightness(90%)" },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Typography variant="body2" fontWeight={500}>
            {shiftType.description}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {shift.hours}ч
          </Typography>
        </Box>
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Изменить
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>

      <ShiftDialog
        shift={shift}
        employeeId={employeeId}
        date={date}
        shiftTypes={shiftTypes}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(data) => {
          onUpdateShift(data);
          setEditOpen(false);
        }}
      />
    </>
  );
};
