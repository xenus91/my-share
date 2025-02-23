// src/services/userService.ts
import apiClient from '../api';
import { Employee, WorkloadPeriod } from '../types';
import { getRequestDigest } from './contextService';




// Получение свойств пользователя по accountName
export async function getUserPropertiesByAccountName(accountName: string): Promise<{
    preferredName: string;
    employeeID: string;
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
            employeeID: props["EmployeeID"] || "",
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
    //console.log("Используемый логин:", fullLogin);

    const url = `/web/siteusers(@v)?@v='${encodedLogin}'`;
    //console.log("Формируем URL:", url);

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

// Функция для загрузки сотрудников из списка "Employees"
export async function getEmployee(): Promise<Employee[]> {
  try {
    // GET-запрос не требует получения Request Digest
    const response = await apiClient.get(
      "/web/lists/GetByTitle('Employees')/items",
      {
        headers: {
          Accept: "application/json;odata=verbose"
        }
      }
    );
    //console.log("✅ Получены сотрудники:", response.data);
    // В odata=verbose данные списка находятся в response.data.d.results
    return response.data.d.results;
  } catch (error) {
    console.error("❌ Ошибка загрузки сотрудников:", error);
    throw error;
  }
}



// Создание сотрудника в списке "Employees"
export async function createEmployee(payload: {
    preferredName: string;
    EmployeeID: string;
    employeeId: number;
    jobTitle: string;
    department: string;
    office: string;
        //newColumn: добавляем новые поля
        ShiftNumber: number | null;
        ShiftTimeType: string; // или тип ShiftTimeType | ""
}): Promise<Employee> {
    try {
        const digest = await getRequestDigest();
        const postPayload = {
            __metadata: { type: "SP.Data.EmployeesListItem" },
            Title: payload.preferredName,
            EmployeeID: payload.EmployeeID,
            EmployeeId: payload.employeeId,
            JobTitle: payload.jobTitle,
            Department: payload.department,
            Office: payload.office,
             //newColumn: новые поля
             ShiftNumber: payload.ShiftNumber,
             ShiftTimeType: payload.ShiftTimeType,
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
        //console.log("✅ Сотрудник создан:", response.data);
        return response.data.d;
    } catch (error) {
        console.error("❌ Ошибка создания сотрудника:", error);
        throw error;
    }
}


export async function updateEmployee(
    spItemId: number,
    payload: {
      preferredName: string;
      employeeID: string;
      jobTitle: string;
      department: string;
      office: string;
      //newColumn: новые поля
      ShiftNumber: number | null;
      ShiftTimeType: string;
    }
  ): Promise<void> {
    try {
  
      // 2. Получаем свежий request digest
      const digest = await getRequestDigest();
  
      // 3. Формируем payload с правильными именами полей
      const updatePayload = {
        __metadata: { type: "SP.Data.EmployeesListItem" },
        Title: payload.preferredName,
        EmployeeID: payload.employeeID,
        JobTitle: payload.jobTitle,
        Department: payload.department,
        Office: payload.office,
        Modified: new Date().toISOString(), 
         //newColumn: новые поля
         ShiftNumber: payload.ShiftNumber,
         ShiftTimeType: payload.ShiftTimeType,
      };
  
      // 4. Отправляем запрос с необходимыми заголовками
      const response = await apiClient.post(
        `/web/lists/GetByTitle('Employees')/items(${spItemId})`,
        updatePayload,
        {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": digest,
            "IF-MATCH": "*", // Важно для обновления
            "X-HTTP-Method": "MERGE",
          },
        }
      );
  
      console.log(`✅ Сотрудник обновлён. Статус: ${response.status}`);
    } catch (error: any) {
      console.error("❌ Детали ошибки:", {
        url: error.config?.url,
        data: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        `Ошибка обновления: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  export async function deleteEmployee(spItemId: number): Promise<void> {
    try {
      const digest = await getRequestDigest();
      await apiClient.post(
        `/web/lists/GetByTitle('Employees')/items(${spItemId})/recycle()`,
        {},
        {
          headers: {
            Accept: "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest,
          },
        }
      );
      //console.log("✅ Сотрудник отправлен в корзину.");
    } catch (error: any) {
      console.error("❌ Ошибка удаления сотрудника:", error);
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
  
      //console.log("✅ Период занятости создан:", response.data);
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
                "X-RequestDigest": digest,
                "IF-MATCH": "*",
                "X-HTTP-Method": "MERGE",
            }
        });

        //console.log("✅ Период занятости обновлен.");
    } catch (error) {
        console.error("❌ Ошибка обновления периода занятости:", error);
        throw error;
    }
}


export async function deleteWorkloadPeriod(periodId: number) {
    try {
        const digest = await getRequestDigest();

        // Используем метод recycle() для отправки элемента в корзину
        await apiClient.post(`/web/lists/GetByTitle('WorkloadPeriods')/items(${periodId})/recycle()`, {}, {
            headers: {
                Accept: "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest
            }
        });

        //console.log("✅ Период занятости отправлен в корзину.");
    } catch (error) {
        console.error("❌ Ошибка удаления периода занятости:", error);
        throw error;
    }
}


// Функция для получения всех периодов занятости
export async function getWorkloadPeriods(): Promise<WorkloadPeriod[]> {
  try {
    const response = await apiClient.get("/web/lists/GetByTitle('WorkloadPeriods')/items", {
      headers: { Accept: "application/json;odata=verbose" },
    });
    //console.log("✅ Получены периоды занятости:", response.data);

    // Если вам нужны все данные, можно вернуть объект целиком,
    // либо, если требуется переименование ключей, например, чтобы привести их к вашему интерфейсу,
    // вернуть все свойства и дополнительно задать нужные поля.
    const periods: WorkloadPeriod[] = response.data.d.results.map((item: any) => ({
      ...item, // возвращаем все свойства, полученные из SharePoint
      // Переименовываем поле Id в ID (если требуется)
      ID: item.Id,
      // Если SharePoint возвращает свойства с именами, отличными от ваших, можно задать их здесь:
      StartDate: item.StartDate,
      EndDate: item.EndDate,
      Fraction: item.Fraction,
      EmployeeId: item.EmployeeId, // убедитесь, что это имя поля совпадает с настройками списка
    }));
    return periods;
  } catch (error) {
    console.error("❌ Ошибка загрузки периодов занятости:", error);
    throw error;
  }
}




