// src/services/userService.ts
import apiClient from '../api';
import { Employee } from '../types';
import { getRequestDigest } from './contextService';


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
      // Предполагаем, что расширенные свойства находятся в массиве UserProfileProperties.results
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



// Функция для поиска пользователя по loginName
export async function getUserIdByLoginName(loginName: string): Promise<string | null> {
    if (!loginName) {
      console.error("Пустой loginName");
      return null;
    }
    // Формируем полный логин согласно формату Claims-Based Authentication.
    // Например, если loginName = "sergey.porshakov", то полный логин будет:
    // "i:0#.w|retail\sergey.porshakov"
    const fullLogin = `i:0#.w|retail\\${loginName}`;
    // Кодируем логин (encodeURIComponent преобразует специальные символы)
    const encodedLogin = encodeURIComponent(fullLogin);
    console.log("Используемый логин:", fullLogin);
    
    // Формируем URL запроса согласно рабочему примеру:
    // Важно: если ваш apiClient уже настроен с базовым URL равным "https://portal.lenta.com/sites/obrazceo/_api"
    // то здесь достаточно добавить остаток пути.
    const url = `/web/siteusers(@v)?@v='${encodedLogin}'`;
    console.log("Формируем URL:", url);
  
    try {
      const response = await apiClient.get(url, {
        headers: {
          Accept: "application/json;odata=verbose"
        },
        withCredentials: true // если нужно использовать куки текущей сессии
      });
      // Ожидаем, что ответ имеет структуру { d: { Id: ... } }
      return response.data?.d?.Id || null;
    } catch (error) {
      console.error("Ошибка поиска пользователя по loginName:", error);
      return null;
    }
  }

/**
 * Создает элемент списка "Employees" с полями:
 * Title – PreferredName,
 * EmployeeId – id пользователя,
 * JobTitle, Department, Office – расширенные свойства.
 */
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
    console.log("Ответ создания сотрудника:", response.data);
    return response.data.d;
  } catch (error) {
    console.error("Ошибка создания сотрудника:", error);
    throw error;
  }
}

// Функция проверки наличия списка "Employees" и его создание при отсутствии
export async function ensureEmployeesListExists(): Promise<void> {
    try {
      // Пытаемся получить список "Employees" по Title
      await apiClient.get("/web/lists/GetByTitle('Employees')", {
        headers: { Accept: 'application/json;odata=verbose' }
      });
      console.log("Список 'Employees' найден");
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log("Список 'Employees' не найден. Создаем список...");
        try {
          const digest = await getRequestDigest();
  
          // Создаем список "Employees"
          const listPayload = {
            __metadata: { "type": "SP.List" },
            Title: "Employees",
            BaseTemplate: 100, // шаблон Custom List
            Description: "Список сотрудников"
          };
          const createListResponse = await apiClient.post("/web/lists", listPayload, {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose',
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest
            }
          });
          console.log("Список 'Employees' создан:", createListResponse.data);
  
          // Получаем GUID созданного списка
          const listId: string = createListResponse.data.d.Id;
          // GUID обычно возвращается в фигурных скобках, удалим их
          const listGuid = listId.replace(/[{}]/g, "");
          console.log("GUID списка:", listGuid);
  
          // Формируем URL для добавления полей по GUID списка
          const fieldsUrl = `/web/lists(guid'${listGuid}')/fields`;
  
          // Создаем поле "Employee" типа пользователь (User field)
          const userFieldPayload = {
            __metadata: { "type": "SP.FieldUser" },
            Title: "Employee",
            Required: false,
            SelectionMode: 1,       // одиночный выбор
            AllowMultipleValues: false
          };
          const addUserFieldResponse = await apiClient.post(fieldsUrl, userFieldPayload, {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose',
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest
            }
          });
          console.log("Поле 'Employee' добавлено:", addUserFieldResponse.data);
  
          // Создаем текстовое поле "JobTitle"
          const jobTitleFieldPayload = {
            __metadata: { "type": "SP.FieldText" },
            Title: "JobTitle",
            Required: false,
            MaxLength: 255
          };
          const addJobTitleFieldResponse = await apiClient.post(fieldsUrl, jobTitleFieldPayload, {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose',
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest
            }
          });
          console.log("Поле 'JobTitle' добавлено:", addJobTitleFieldResponse.data);
  
          // Создаем текстовое поле "Department"
          const departmentFieldPayload = {
            __metadata: { "type": "SP.FieldText" },
            Title: "Department",
            Required: false,
            MaxLength: 255
          };
          const addDepartmentFieldResponse = await apiClient.post(fieldsUrl, departmentFieldPayload, {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose',
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest
            }
          });
          console.log("Поле 'Department' добавлено:", addDepartmentFieldResponse.data);
  
          // Создаем текстовое поле "Office"
          const officeFieldPayload = {
            __metadata: { "type": "SP.FieldText" },
            Title: "Office",
            Required: false,
            MaxLength: 255
          };
          const addOfficeFieldResponse = await apiClient.post(fieldsUrl, officeFieldPayload, {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose',
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest
            }
          });
          console.log("Поле 'Office' добавлено:", addOfficeFieldResponse.data);
  
        } catch (createError) {
          console.error("Ошибка создания списка 'Employees' или полей:", createError);
          throw createError;
        }
      } else {
        console.error("Ошибка проверки списка 'Employees':", error);
        throw error;
      }
    }
  }