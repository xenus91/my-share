// src/services/userService.ts
import apiClient from '../api';
import { Employee, WorkloadPeriod } from '../types';
import { getRequestDigest } from './contextService';




// Получение свойств пользователя по accountName
export async function getUserPropertiesByAccountName(accountName: string): Promise<{
    preferredName: string;
    jobTitle: string;
    department: string;
    office: string;
} | null> {
    try {
        const encodedAccount = encodeURIComponent(accountName);
        const response = await apiClient.get(
            `/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='${encodedAccount}'`,
            {
                headers: { Accept: "application/json;odata=verbose" }
            }
        );

        // Парсим свойства пользователя
        const propertiesArray: { Key: string; Value: string }[] = response.data.d.UserProfileProperties.results;
        const props: { [key: string]: string } = {};
        propertiesArray.forEach(prop => {
            props[prop.Key] = prop.Value;
        });

        return {
            preferredName: props["PreferredName"] || "",
            jobTitle: props["SPS-JobTitle"] || "",
            department: props["Department"] || "",
            office: props["Office"] || ""
        };
    } catch (error) {
        console.error("Ошибка получения расширенных свойств пользователя:", error);
        return null;
    }
}

// Получение userId по loginName
export async function getUserIdByLoginName(loginName: string): Promise<string | null> {
    if (!loginName) {
        console.error("Пустой loginName");
        return null;
    }

    const fullLogin = `i:0#.w|retail\\${loginName}`;
    const encodedLogin = encodeURIComponent(fullLogin);
    console.log("Используемый логин:", fullLogin);

    const url = `/web/siteusers(@v)?@v='${encodedLogin}'`;
    console.log("Формируем URL:", url);

    try {
        const response = await apiClient.get(url, {
            headers: { Accept: "application/json;odata=verbose" },
            withCredentials: true
        });

        return response.data?.d?.Id || null;
    } catch (error) {
        console.error("Ошибка поиска пользователя по loginName:", error);
        return null;
    }
}

// Создание сотрудника в списке "Employees"
export async function createEmployee(payload: {
    preferredName: string;
    employeeId: string;
    jobTitle: string;
    department: string;
    office: string;
}): Promise<Employee> {
    try {
        const digest = await getRequestDigest();
        const postPayload = {
            __metadata: { type: "SP.Data.EmployeesListItem" },
            Title: payload.preferredName,
            EmployeeId: payload.employeeId,
            JobTitle: payload.jobTitle,
            Department: payload.department,
            Office: payload.office
        };

        const response = await apiClient.post(
            "/web/lists/GetByTitle('Employees')/items",
            postPayload,
            {
                headers: {
                    Accept: "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-RequestDigest": digest
                }
            }
        );
        console.log("✅ Сотрудник создан:", response.data);
        return response.data.d;
    } catch (error) {
        console.error("❌ Ошибка создания сотрудника:", error);
        throw error;
    }
}


export async function updateEmployee(spItemId: number, payload: {
    preferredName: string;
    employeeId: string;
    jobTitle: string;
    department: string;
    office: string;
  }): Promise<void> {
    try {
      const digest = await getRequestDigest();
      const updatePayload = {
        __metadata: { type: "SP.Data.EmployeesListItem" },
        Title: payload.preferredName,
        EmployeeId: payload.employeeId,
        JobTitle: payload.jobTitle,
        Department: payload.department,
        Office: payload.office,
      };
  
      await apiClient.post(
        `/web/lists/GetByTitle('Employees')/items(${spItemId})`,
        updatePayload,
        {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest,
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE",
          },
        }
      );
      console.log("✅ Сотрудник обновлён в списке Employees");
    } catch (error) {
      console.error("❌ Ошибка обновления сотрудника:", error);
      throw error;
    }
  }
  


export async function getWorkloadPeriodsByEmployee(employeeId: number) {
    try {
        const response = await apiClient.get(`/web/lists/GetByTitle('WorkloadPeriods')/items?$filter=Employee/Id eq ${employeeId}&$expand=Employee`, {
            headers: { Accept: "application/json;odata=verbose" }
        });

        return response.data.d.results.map((item: any) => ({
            id: item.Id,
            startDate: item.StartDate,
            endDate: item.EndDate,
            fraction: item.Fraction
        }));
    } catch (error) {
        console.error("❌ Ошибка получения периодов занятости:", error);
        return [];
    }
}


export async function createWorkloadPeriod(employeeId: number, period: WorkloadPeriod) {
    try {
      const digest = await getRequestDigest();
      const payload = {
        __metadata: { type: "SP.Data.WorkloadPeriodsListItem" },
        // Если поле Title обязательно, можно передать пустую строку или другое значение,
        // но временный ID здесь не передаётся
        Title: "",
        EmployeeId: employeeId,
        StartDate: period.StartDate,
        EndDate: period.EndDate,
        Fraction: period.Fraction
      };
  
      const response = await apiClient.post(
        "/web/lists/GetByTitle('WorkloadPeriods')/items",
        payload,
        {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest
          }
        }
      );
  
      console.log("✅ Период занятости создан:", response.data);
      return response.data.d.Id;
    } catch (error) {
      console.error("❌ Ошибка создания периода занятости:", error);
      throw error;
    }
  }
  


export async function updateWorkloadPeriod(periodId: number, period: WorkloadPeriod) {
    try {
        const digest = await getRequestDigest();
        const payload = {
            __metadata: { type: "SP.Data.WorkloadPeriodsListItem" },
            StartDate: period.StartDate,
            EndDate: period.EndDate,
            Fraction: period.Fraction
        };

        await apiClient.post(`/web/lists/GetByTitle('WorkloadPeriods')/items(${periodId})`, payload, {
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest,
                "IF-MATCH": "*",  // Для обновления существующих записей
                "X-HTTP-Method": "MERGE" // Обновление без создания новой записи
            }
        });

        console.log("✅ Период занятости обновлен.");
    } catch (error) {
        console.error("❌ Ошибка обновления периода занятости:", error);
        throw error;
    }
}


export async function deleteWorkloadPeriod(periodId: number) {
    try {
        const digest = await getRequestDigest();

        await apiClient.post(`/web/lists/GetByTitle('WorkloadPeriods')/items(${periodId})`, {}, {
            headers: {
                Accept: "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest,
                "IF-MATCH": "*",
                "X-HTTP-Method": "DELETE"
            }
        });

        console.log("✅ Период занятости удален.");
    } catch (error) {
        console.error("❌ Ошибка удаления периода занятости:", error);
        throw error;
    }
}






