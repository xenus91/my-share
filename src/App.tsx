import  { useEffect, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import TimeSheet from "./components/TimeSheet";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { lightTheme, darkTheme } from "./theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSetupLists } from "./hooks/useSetupLists";
import {
  Dialog,
  DialogContent,
  Typography, 
  LinearProgress,
  Box
} from "@mui/material";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AppContent() {
  const [themeMode] = useState("light");
  const { isPending, isError, isSuccess, error } = useSetupLists();
  const [openDialog, setOpenDialog] = useState(true);

  const handleClose = () => {
    if (isSuccess || (isError && error?.message.includes("500"))) {
      setOpenDialog(false);
    }
  };

  useEffect(() => {
    if (isSuccess || (isError && error?.message.includes("500"))) {
      const timer = setTimeout(() => {
        setOpenDialog(false);
      }, 2000); // 2000 мс = 2 секунды
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isError, error]);

  return (
    <ThemeProvider theme={themeMode === "light" ? lightTheme : darkTheme}>
      <CssBaseline />
      <TimeSheet />
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogContent>
          {isPending && (
            <Box sx={{ minWidth: 300 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Настраиваем списки, пожалуйста подождите
              </Typography>
              <LinearProgress />
            </Box>
          )}
          
          {(isSuccess || (isError && error?.message.includes("500"))) && (
            <Typography variant="body1" sx={{ minWidth: 300 }}>
              Все готово :)
            </Typography>
          )}

          {isError && !error?.message.includes("500") && (
            <Typography variant="body1" color="error" sx={{ minWidth: 300 }}>
              Произошла ошибка при настройке списков
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}


export default App;
