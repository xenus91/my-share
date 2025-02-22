import { useQuery } from "@tanstack/react-query";
import {
  ensureEmployeesListExists,
  ensureWorkloadPeriodsListExists,
  ensureShiftTypeListExists,
  ensureShiftsListExists,
  ensureShiftPatternListExists,
} from "../services/listCheck";

export const useSetupLists = () => {
    return useQuery({
      queryKey: [
        "setup-lists",
        "employees",
        "workload-periods",
        "shift-type",
        "shifts",
        "shift-pattern"
      ],
      queryFn: async ({ signal }) => {
        if (signal?.aborted) return;
        
        await Promise.all([
          ensureEmployeesListExists(),
          ensureWorkloadPeriodsListExists(),
          ensureShiftTypeListExists(),
          ensureShiftsListExists(),
          ensureShiftPatternListExists()
        ]);
        
        return true;
      },
      staleTime: 86_400_000, // 24 часа
      gcTime: 604_800_000, // 7 дней
      retry: 2,
      retryDelay: attempt => Math.min(attempt * 1000, 3000),
      meta: { persist: true },
      refetchOnWindowFocus: false, // Явное отключение
      refetchOnReconnect: false,
      refetchOnMount: false
    });
  };