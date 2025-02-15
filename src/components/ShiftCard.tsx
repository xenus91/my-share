// ShiftCard.tsx
import React, { useState, MouseEvent } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Typography,
  Box,
  Tooltip, // Новый импорт Tooltip из MUI
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Shift, ShiftTypeDefinition } from "../types";
import { ShiftDialog } from "./ShiftDialog";
// BEGIN BULK MODE: Импорт иконок для невыбранного и выбранного состояния чекбокса
import RadioButtonUncheckedTwoToneIcon from "@mui/icons-material/RadioButtonUncheckedTwoTone";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
// END BULK MODE

// Добавляем новые пропсы для bulkMode: bulkMode, isBulkSelected и onToggleBulkSelection
interface ShiftCardProps {
  shift: Shift;
  shiftTypes: ShiftTypeDefinition[];
  employeeId: string;
  date: string;
  onUpdateShift: (shiftData: Omit<Shift, "ID">) => void;
  onDeleteShift: (shiftId: string) => void;
  // BEGIN BULK MODE: новые пропсы bulkMode
  bulkMode?: boolean;
  isBulkSelected?: boolean;
  onToggleBulkSelection?: () => void;
  // END BULK MODE
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  shiftTypes,
  employeeId,
  date,
  onUpdateShift,
  onDeleteShift,
  bulkMode = false,
  isBulkSelected = false,
  onToggleBulkSelection,
}) => {
  // Приводим shift.ShiftTypeId к числу, если необходимо
  const shiftType = shiftTypes.find(
    (type) => type.ID === Number(shift.ShiftTypeId)
  );
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
    onDeleteShift(shift.ID.toString());
    closeMenu();
  };

  // BEGIN BULK MODE:
  // Если bulkMode активен, переопределяем onClick кнопки, чтобы не открывать меню,
  // а вызывать onToggleBulkSelection для переключения состояния выбора данной смены.
  const buttonOnClick =
    bulkMode && onToggleBulkSelection
      ? (e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onToggleBulkSelection();
        }
      : openMenu;
  // END BULK MODE

  // BEGIN TOOLTIP: Формирование содержимого "облачка" с информацией о смене
  const tooltipContent = (
    <Box>
      <Typography variant="caption" display="block">
        Начало смены: {shift.StartTime}
      </Typography>
      <Typography variant="caption" display="block">
        Окончание смены: {shift.EndTime}
      </Typography>
      <Typography variant="caption" display="block">
        Начало перерыва: {shift.BreakStart}
      </Typography>
      <Typography variant="caption" display="block">
        Окончание перерыва: {shift.BreakEnd}
      </Typography>
      <Typography variant="caption" display="block">
        Автор изменений: {shift.ChangeAuthor}
      </Typography>
    </Box>
  );
  // END TOOLTIP

  return (
    <>
      {/* Оборачиваем кнопку в Tooltip с задержкой 2000 мс */}
      <Tooltip title={tooltipContent} arrow enterDelay={2000}>
        <Button
          onClick={buttonOnClick} // BEGIN BULK MODE: Используем переопределённый обработчик при bulkMode
          fullWidth
          variant="contained"
          size="small"
          sx={{
            backgroundColor: shiftType.BackgroundColor,
            color: shiftType.TextColor,
            textTransform: "none",
            padding: "2px 8px",
            mb: "1px",
            position: "relative", // для абсолютного позиционирования чекбокса
            overflow: "hidden", // предотвращаем вылезание содержимого
            "&:hover": { filter: "brightness(90%)" },
          }}
        >
          {/* BEGIN BULK MODE: Отображение чекбокса внутри кнопки */}
          {bulkMode && onToggleBulkSelection && (
            <Box
              onClick={(e) => {
                e.stopPropagation(); // предотвращаем открытие меню
                onToggleBulkSelection();
              }}
              sx={{
                // Центрирование чекбокса внутри кнопки
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                cursor: "pointer",
                backgroundColor: "white", // фон белый
                borderRadius: "50%",
                width: 18, // уменьшенный размер, чтобы не вылезать за края кнопки
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isBulkSelected ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 22 }} />
              ) : (
                <RadioButtonUncheckedTwoToneIcon sx={{ fontSize: 22 }} />
              )}
            </Box>
          )}
          {/* END BULK MODE */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
            sx={{ opacity: bulkMode ? 0.6 : 1 }}
          >
            <Typography variant="body2" fontWeight={500}>
              {shiftType.Description}
            </Typography>
            {shift.Hours !== 0 && (
              <Typography variant="body2" fontWeight={600}>
                {shift.Hours}ч
              </Typography>
            )}
          </Box>
        </Button>
      </Tooltip>

      {/* Если bulkMode не активен, отображаем контекстное меню */}
      {!bulkMode && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
          <MenuItem onClick={handleEdit} sx={{ color: "#267db1" }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Изменить
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Удалить
          </MenuItem>
        </Menu>
      )}

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
