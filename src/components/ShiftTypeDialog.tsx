// ShiftTypeDialog.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Box,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { ShiftTypeDefinition } from "../types";

interface ShiftTypeDialogProps {
  shiftTypes: ShiftTypeDefinition[];
  onSave: (shiftType: Omit<ShiftTypeDefinition, "ID">) => void;
  onUpdate: (id: number, shiftType: Omit<ShiftTypeDefinition, "ID">) => void;
  onDelete: (id: number) => void;
  trigger: React.ReactNode;
}

export function ShiftTypeDialog({
  shiftTypes,
  onSave,
  onUpdate,
  onDelete,
  trigger,
}: ShiftTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ShiftTypeDefinition | null>(null);
  const [formData, setFormData] = useState({
    Name: "",
    BackgroundColor: "#E5EDFF",
    TextColor: "#1E40AF",
    AffectsWorkingNorm: true,
    RequiredStartEndTime: true,
    Description: "",
    DefaultStartTime: "09:00",
    DefaultEndTime: "17:00",
    DefaultBreakStart: "13:00",
    DefaultBreakEnd: "14:00",
  });

  const handleTypeSelect = (type: ShiftTypeDefinition) => {
    setSelectedType(type);
    setFormData({
      Name: type.Name,
      BackgroundColor: type.BackgroundColor,
      TextColor: type.TextColor,
      AffectsWorkingNorm: type.AffectsWorkingNorm,
      RequiredStartEndTime: type.RequiredStartEndTime,
      Description: type.Description || "",
      DefaultStartTime: type.DefaultStartTime,
      DefaultEndTime: type.DefaultEndTime,
      DefaultBreakStart: type.DefaultBreakStart,
      DefaultBreakEnd: type.DefaultBreakEnd,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };

    if (!dataToSave.RequiredStartEndTime) {
      dataToSave.DefaultStartTime = "00:00";
      dataToSave.DefaultEndTime = "00:00";
      dataToSave.DefaultBreakStart = "00:00";
      dataToSave.DefaultBreakEnd = "00:00";
    }

    try {
      if (selectedType) {
        await onUpdate(selectedType.ID, dataToSave);
      } else {
        await onSave(dataToSave);
      }
      resetForm();
    } catch (error) {
      console.error("Ошибка при сохранении типа смены:", error);
    }
  };

  const handleDelete = async (type: ShiftTypeDefinition) => {
    try {
      await onDelete(type.ID);
      if (selectedType?.ID === type.ID) {
        resetForm();
      }
    } catch (error) {
      console.error("Ошибка при удалении типа смены:", error);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setFormData({
      Name: "",
      BackgroundColor: "#E5EDFF",
      TextColor: "#1E40AF",
      AffectsWorkingNorm: true,
      RequiredStartEndTime: true,
      Description: "",
      DefaultStartTime: "09:00",
      DefaultEndTime: "17:00",
      DefaultBreakStart: "13:00",
      DefaultBreakEnd: "14:00",
    });
  };

  return (
    <>
      <Box
        component="span"
        onClick={() => setOpen(true)}
        sx={{ display: "inline-block", cursor: "pointer" }}
      >
        {trigger}
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xl">
        <DialogTitle>Управление типами смен</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Выберите тип и введите время
          </DialogContentText>
          <Box sx={{ display: "flex", gap: 4 }}>
            {/* Левый столбец: список существующих типов смен */}
            <Box sx={{ width: 300, display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Существующие типы смен
              </Typography>
              <Box
                sx={{
                  height: 600,
                  overflowY: "auto",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {shiftTypes.map((type) => {
                  const isSelected = selectedType?.ID === type.ID;
                  return (
                    <Box
                      key={type.ID}
                      onClick={() => handleTypeSelect(type)}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        cursor: "pointer",
                        backgroundColor: isSelected ? "secondary.main" : "transparent",
                        "&:hover": {
                          backgroundColor: isSelected ? "secondary.main" : "secondary.light",
                        },
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {type.Name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTypeSelect(type);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(type);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          mt: 1,
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: type.BackgroundColor,
                          color: type.TextColor,
                          fontSize: "0.75rem",
                        }}
                      >
                        {type.Description || "Нет описания"}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Вертикальный разделитель */}
            <Divider orientation="vertical" flexItem />

            {/* Правый столбец: форма */}
            <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1 }}>
              <TextField
                fullWidth
                required
                label="Название"
                id="name"
                value={formData.Name}
                onChange={(e) =>
                  setFormData({ ...formData, Name: e.target.value })
                }
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  label="Цвет фона"
                  id="backgroundColor"
                  type="color"
                  value={formData.BackgroundColor}
                  onChange={(e) =>
                    setFormData({ ...formData, BackgroundColor: e.target.value })
                  }
                  InputProps={{
                    sx: { width: 56, height: 56, p: 0, border: "none" },
                  }}
                />
                <TextField
                  label="Цвет текста"
                  id="textColor"
                  type="color"
                  value={formData.TextColor}
                  onChange={(e) =>
                    setFormData({ ...formData, TextColor: e.target.value })
                  }
                  InputProps={{
                    sx: { width: 56, height: 56, p: 0, border: "none" },
                  }}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    id="requiredStartEndTime"
                    checked={formData.RequiredStartEndTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        RequiredStartEndTime: e.target.checked,
                      })
                    }
                  />
                }
                label="Требовать время начала/окончания"
                sx={{ mb: 2 }}
              />

              {formData.RequiredStartEndTime && (
                <>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      required
                      id="defaultStartTime"
                      label="Время начала по умолчанию"
                      type="time"
                      value={formData.DefaultStartTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          DefaultStartTime: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      required
                      id="defaultEndTime"
                      label="Время окончания по умолчанию"
                      type="time"
                      value={formData.DefaultEndTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          DefaultEndTime: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      required
                      id="defaultBreakStart"
                      label="Время начала перерыва по умолчанию"
                      type="time"
                      value={formData.DefaultBreakStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          DefaultBreakStart: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      required
                      id="defaultBreakEnd"
                      label="Время окончания перерыва по умолчанию"
                      type="time"
                      value={formData.DefaultBreakEnd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          DefaultBreakEnd: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </>
              )}

              <FormControlLabel
                control={
                  <Switch
                    id="affectsWorkingNorm"
                    checked={formData.AffectsWorkingNorm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        AffectsWorkingNorm: e.target.checked,
                      })
                    }
                  />
                }
                label="Влияет на норму рабочего времени"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                id="description"
                label="Описание"
                value={formData.Description}
                onChange={(e) =>
                  setFormData({ ...formData, Description: e.target.value })
                }
                sx={{ mb: 2 }}
              />

              <Button fullWidth variant="contained" type="submit">
                {selectedType ? "Обновить" : "Добавить"} тип смены
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
