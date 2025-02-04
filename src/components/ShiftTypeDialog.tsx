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
  onSave: (shiftType: Omit<ShiftTypeDefinition, "id">) => void;
  onUpdate: (id: string, shiftType: Omit<ShiftTypeDefinition, "id">) => void;
  onDelete: (id: string) => void;
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
  const [selectedType, setSelectedType] = useState<ShiftTypeDefinition | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    backgroundColor: "#E5EDFF",
    textColor: "#1E40AF",
    affectsWorkingNorm: true,
    requiredStartEndTime: true,
    description: "",
    defaultStartTime: "09:00",
    defaultEndTime: "17:00",
    defaultBreakStart: "13:00",
    defaultBreakEnd: "14:00",
  });

  const handleTypeSelect = (type: ShiftTypeDefinition) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      backgroundColor: type.backgroundColor,
      textColor: type.textColor,
      affectsWorkingNorm: type.affectsWorkingNorm,
      requiredStartEndTime: type.requiredStartEndTime,
      description: type.description || "",
      defaultStartTime: type.defaultStartTime,
      defaultEndTime: type.defaultEndTime,
      defaultBreakStart: type.defaultBreakStart,
      defaultBreakEnd: type.defaultBreakEnd,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };

    if (!dataToSave.requiredStartEndTime) {
      dataToSave.defaultStartTime = "00:00";
      dataToSave.defaultEndTime = "00:00";
      dataToSave.defaultBreakStart = "00:00";
      dataToSave.defaultBreakEnd = "00:00";
    }

    if (selectedType) {
      onUpdate(selectedType.id, dataToSave);
    } else {
      onSave(dataToSave);
    }
    resetForm();
  };

  const handleDelete = (type: ShiftTypeDefinition) => {
    onDelete(type.id);
    if (selectedType?.id === type.id) {
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setFormData({
      name: "",
      backgroundColor: "#E5EDFF",
      textColor: "#1E40AF",
      affectsWorkingNorm: true,
      requiredStartEndTime: true,
      description: "",
      defaultStartTime: "09:00",
      defaultEndTime: "17:00",
      defaultBreakStart: "13:00",
      defaultBreakEnd: "14:00",
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
            {/* Left Column: List of Existing Shift Types */}
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
                  const isSelected = selectedType?.id === type.id;
                  return (
                    <Box
                      key={type.id}
                      onClick={() => handleTypeSelect(type)}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        cursor: "pointer",
                        backgroundColor: isSelected
                          ? "secondary.main"
                          : "transparent",
                        "&:hover": {
                          backgroundColor: isSelected
                            ? "secondary.main"
                            : "secondary.light",
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
                          {type.name}
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
                          backgroundColor: type.backgroundColor,
                          color: type.textColor,
                          fontSize: "0.75rem",
                        }}
                      >
                        {type.description || "Нет описания"}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Vertical Divider */}
            <Divider orientation="vertical" flexItem />

            {/* Right Column: Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1 }}>
              {/* Название */}
              <TextField
                fullWidth
                required
                label="Название"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                sx={{ mb: 2 }}
              />

              {/* Цвета: фон и текст */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  label="Цвет фона"
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) =>
                    setFormData({ ...formData, backgroundColor: e.target.value })
                  }
                  InputProps={{
                    sx: { width: 56, height: 56, p: 0, border: "none" },
                  }}
                />
                <TextField
                  label="Цвет текста"
                  id="textColor"
                  type="color"
                  value={formData.textColor}
                  onChange={(e) =>
                    setFormData({ ...formData, textColor: e.target.value })
                  }
                  InputProps={{
                    sx: { width: 56, height: 56, p: 0, border: "none" },
                  }}
                />
              </Box>

              {/* Переключатель: Требовать время начала/окончания */}
              <FormControlLabel
                control={
                  <Switch
                    id="requiredStartEndTime"
                    checked={formData.requiredStartEndTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiredStartEndTime: e.target.checked,
                      })
                    }
                  />
                }
                label="Требовать время начала/окончания"
                sx={{ mb: 2 }}
              />

              {/* Временные поля */}
              {formData.requiredStartEndTime && (
                <>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      required
                      id="defaultStartTime"
                      label="Время начала по умолчанию"
                      type="time"
                      value={formData.defaultStartTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultStartTime: e.target.value,
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
                      value={formData.defaultEndTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultEndTime: e.target.value,
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
                      value={formData.defaultBreakStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultBreakStart: e.target.value,
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
                      value={formData.defaultBreakEnd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultBreakEnd: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </>
              )}

              {/* Переключатель: Влияет на норму рабочего времени */}
              <FormControlLabel
                control={
                  <Switch
                    id="affectsWorkingNorm"
                    checked={formData.affectsWorkingNorm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affectsWorkingNorm: e.target.checked,
                      })
                    }
                  />
                }
                label="Влияет на норму рабочего времени"
                sx={{ mb: 2 }}
              />

              {/* Описание */}
              <TextField
                fullWidth
                id="description"
                label="Описание"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
