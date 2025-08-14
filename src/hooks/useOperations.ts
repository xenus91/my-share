import { useQuery } from '@tanstack/react-query';
import { Operation } from '../types';
import { getOperations } from '../services/operationService';

interface UseOperationsResult {
  data: Operation[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useOperations(employeeIds: number[], startDate: string, endDate: string): UseOperationsResult {
  return useQuery<Operation[], Error>({
    queryKey: ['operations', employeeIds, startDate, endDate],
    queryFn: async () => {
      if (!employeeIds.length || !startDate || !endDate) {
        console.log('⏳ Пропуск запроса операций: отсутствуют параметры', { employeeIds, startDate, endDate });
        return [];
      }
      console.log('🚀 Запрос операций для EmployeeIds:', employeeIds);
      return await getOperations(employeeIds, startDate, endDate);
    },
    enabled: !!employeeIds.length && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
    gcTime: 10 * 60 * 1000, // Хранить кэш 10 минут
    retry: 2,
    retryDelay: (attempt) => Math.min(attempt * 1000, 3000),
  });
}