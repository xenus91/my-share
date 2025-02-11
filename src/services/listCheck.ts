// src/services/userService.ts
import apiClient from '../api';
import { getRequestDigest, getWebGUID, getListGUID  } from './contextService';




// Проверка наличия списка "Employees" и его создание при необходимости
export async function ensureEmployeesListExists(): Promise<void> {
  let listExists = false;
  try {
    await apiClient.get("/web/lists/GetByTitle('Employees')", {
      headers: { Accept: "application/json;odata=verbose" }
    });
    console.log("✅ Список 'Employees' найден");
    listExists = true;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'Employees' не найден. Создаем...");
      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");

        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "Employees",
          BaseTemplate: 100,
          Description: "Список сотрудников"
        };

        const createListResponse = await apiClient.post("/web/lists", listPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest
          }
        });
        console.log("✅ Список 'Employees' создан:", createListResponse.data);
        listExists = true;
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'Employees':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'Employees':", error);
      throw error;
    }
  }

  if (listExists) {
    try {
      const fieldsResponse = await apiClient.get("/web/lists/GetByTitle('Employees')/fields", {
        headers: { Accept: "application/json;odata=verbose" }
      });
      const existingFields: string[] = fieldsResponse.data.d.results.map((f: any) => f.Title);

      // Поля, которые должны присутствовать в списке "Employees"
      const requiredFields: { Title: string; FieldTypeKind: number; __metadata: { type: string } }[] = [
        {
          Title: "Employee",
          FieldTypeKind: 20, // Тип "User"
          __metadata: { type: "SP.FieldUser" }
        },
        {
          Title: "JobTitle",
          FieldTypeKind: 2,
          __metadata: { type: "SP.FieldText" }
        },
        {
          Title: "Department",
          FieldTypeKind: 2,
          __metadata: { type: "SP.FieldText" }
        },
        {
          Title: "Office",
          FieldTypeKind: 2,
          __metadata: { type: "SP.FieldText" }
        }
      ];

      const digest = await getRequestDigest();
      const fieldsUrl = `/web/lists/GetByTitle('Employees')/fields`;
      for (const field of requiredFields) {
        if (!existingFields.includes(field.Title)) {
          const fieldPayload = {
            __metadata: { type: field.__metadata.type },
            Title: field.Title,
            FieldTypeKind: field.FieldTypeKind,
            Required: false,
            ...(field.FieldTypeKind === 2 ? { MaxLength: 255 } : {})
          };

          await apiClient.post(fieldsUrl, fieldPayload, {
            headers: {
              Accept: "application/json;odata=verbose",
              "Content-Type": "application/json;odata=verbose",
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest
            }
          });
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }
      }

      console.log("✅ Все поля для 'Employees' проверены и добавлены, если отсутствовали.");
    } catch (fieldsError) {
      console.error("❌ Ошибка проверки/добавления полей для 'Employees':", fieldsError);
      throw fieldsError;
    }
  }
}


export async function ensureWorkloadPeriodsListExists(): Promise<void> {
  let listExists = false;
  try {
    await apiClient.get("/web/lists/GetByTitle('WorkloadPeriods')", {
      headers: { Accept: "application/json;odata=verbose" }
    });
    console.log("✅ Список 'WorkloadPeriods' найден");
    listExists = true;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'WorkloadPeriods' не найден. Создаем...");
      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");

        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "WorkloadPeriods",
          BaseTemplate: 100,
          Description: "Периоды занятости сотрудников"
        };

        const createListResponse = await apiClient.post("/web/lists", listPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest
          }
        });
        console.log("✅ Список 'WorkloadPeriods' создан:", createListResponse.data);
        listExists = true;
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'WorkloadPeriods':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'WorkloadPeriods':", error);
      throw error;
    }
  }

  if (listExists) {
    try {
      const fieldsResponse = await apiClient.get("/web/lists/GetByTitle('WorkloadPeriods')/fields", {
        headers: { Accept: "application/json;odata=verbose" }
      });
      const existingFields: string[] = fieldsResponse.data.d.results.map((f: any) => f.Title);

      const requiredFields: { Title: string; FieldTypeKind: number }[] = [
        { Title: "StartDate", FieldTypeKind: 4 },
        { Title: "EndDate", FieldTypeKind: 4 },
        { Title: "Fraction", FieldTypeKind: 9 }
      ];

      const digest = await getRequestDigest();
      const fieldsUrl = `/web/lists/GetByTitle('WorkloadPeriods')/fields`;
      for (const field of requiredFields) {
        if (!existingFields.includes(field.Title)) {
          await apiClient.post(
            fieldsUrl,
            {
              __metadata: { type: "SP.Field" },
              Title: field.Title,
              FieldTypeKind: field.FieldTypeKind
            },
            {
              headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest
              }
            }
          );
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }
      }
  
      // Добавляем Lookup-поле "Employee", если отсутствует
      if (!existingFields.includes("Employee")) {
        const employeesListGuid = await getListGUID("Employees");
        const webGuid = await getWebGUID();

        const lookupFieldPayload = {
          parameters: {
            __metadata: { type: "SP.FieldCreationInformation" },
            Title: "Employee",
            FieldTypeKind: 7,
            LookupListId: `{${employeesListGuid}}`,
            LookupWebId: `{${webGuid}}`,
            LookupFieldName: "Title",
            Required: true,
          },
        };

        const addFieldEndpoint = `/web/lists/GetByTitle('WorkloadPeriods')/fields/AddField`;
        await apiClient.post(addFieldEndpoint, lookupFieldPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest
          },
        });
        console.log("✅ Поле 'Employee' (Lookup) добавлено.");
      }
  
      console.log("✅ Все поля для 'WorkloadPeriods' проверены и добавлены, если отсутствовали.");
    } catch (fieldsError) {
      console.error("❌ Ошибка проверки/добавления полей для 'WorkloadPeriods':", fieldsError);
      throw fieldsError;
    }
  }
}


export async function ensureShiftTypeListExists(): Promise<void> {
  let listExists = false;
  try {
    // Проверяем существование списка "ShiftType"
    await apiClient.get("/web/lists/GetByTitle('ShiftType')", {
      headers: { Accept: "application/json;odata=verbose" },
    });
    console.log("✅ Список 'ShiftType' найден");
    listExists = true;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'ShiftType' не найден. Создаем...");
      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");
  
        // 1. Создаем сам список "ShiftType"
        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "ShiftType",
          BaseTemplate: 100,
          Description: "Типы смен сотрудников",
        };
  
        const createListResponse = await apiClient.post("/web/lists", listPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest,
          },
        });
        console.log("✅ Список 'ShiftType' создан:", createListResponse.data);
        listExists = true;
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'ShiftType':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'ShiftType':", error);
      throw error;
    }
  }
  
  // Если список существует, проверяем наличие необходимых полей и добавляем недостающие.
  if (listExists) {
    try {
      // Получаем существующие поля списка "ShiftType"
      const fieldsResponse = await apiClient.get("/web/lists/GetByTitle('ShiftType')/fields", {
        headers: { Accept: "application/json;odata=verbose" },
      });
      const existingFields: string[] = fieldsResponse.data.d.results.map((f: any) => f.Title);
  
      // Определяем требуемые поля и их типы
      const requiredFields: { Title: string; FieldTypeKind: number }[] = [
        { Title: "Name", FieldTypeKind: 2 },             // Текстовое поле
        { Title: "BackgroundColor", FieldTypeKind: 2 },    // Текстовое поле
        { Title: "TextColor", FieldTypeKind: 2 },          // Текстовое поле
        { Title: "AffectsWorkingNorm", FieldTypeKind: 8 },   // Булево поле
        { Title: "RequiredStartEndTime", FieldTypeKind: 8 }, // Булево поле
        { Title: "Description", FieldTypeKind: 2 },          // Текстовое поле
        { Title: "DefaultStartTime", FieldTypeKind: 2 },     // Текстовое поле
        { Title: "DefaultEndTime", FieldTypeKind: 2 },       // Текстовое поле
        { Title: "DefaultBreakStart", FieldTypeKind: 2 },    // Текстовое поле
        { Title: "DefaultBreakEnd", FieldTypeKind: 2 },      // Текстовое поле
      ];
  
      const digest = await getRequestDigest();
      const fieldsUrl = `/web/lists/GetByTitle('ShiftType')/fields`;
      for (const field of requiredFields) {
        if (!existingFields.includes(field.Title)) {
          await apiClient.post(
            fieldsUrl,
            {
              __metadata: { type: "SP.Field" },
              Title: field.Title,
              FieldTypeKind: field.FieldTypeKind,
            },
            {
              headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest,
              },
            }
          );
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }
      }
      console.log("✅ Все поля для 'ShiftType' проверены и добавлены, если отсутствовали.");
    } catch (fieldsError) {
      console.error("❌ Ошибка проверки/добавления полей для 'ShiftType':", fieldsError);
      throw fieldsError;
    }
  }
}


export async function ensureShiftsListExists(): Promise<void> {
  let listExists = false;
  try {
    // Проверяем существование списка "Shifts"
    await apiClient.get("/web/lists/GetByTitle('Shifts')", {
      headers: { Accept: "application/json;odata=verbose" },
    });
    console.log("✅ Список 'Shifts' найден");
    listExists = true;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'Shifts' не найден. Создаем...");
      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");

        // 1. Создаем список "Shifts"
        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "Shifts",
          BaseTemplate: 100,
          Description: "Смены сотрудников",
        };

        const createListResponse = await apiClient.post(
          "/web/lists",
          listPayload,
          {
            headers: {
              Accept: "application/json;odata=verbose",
              "Content-Type": "application/json;odata=verbose",
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest,
            },
          }
        );
        console.log("✅ Список 'Shifts' создан:", createListResponse.data);
        listExists = true;
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'Shifts':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'Shifts':", error);
      throw error;
    }
  }

  // Если список существует (либо уже был, либо создан) – проверяем и добавляем поля
  if (listExists) {
    try {
      // Получаем уже существующие поля
      const fieldsResponse = await apiClient.get(
        "/web/lists/GetByTitle('Shifts')/fields",
        { headers: { Accept: "application/json;odata=verbose" } }
      );
      const existingFields: string[] = fieldsResponse.data.d.results.map(
        (f: any) => f.Title
      );

      const digest = await getRequestDigest();

      // 1. Общие поля
      const commonFields = [
        { Title: "Date", FieldTypeKind: 4 },         // DateTime
        { Title: "StartTime", FieldTypeKind: 2 },      // Text
        { Title: "EndTime", FieldTypeKind: 2 },        // Text
        { Title: "BreakStart", FieldTypeKind: 2 },     // Text
        { Title: "BreakEnd", FieldTypeKind: 2 },       // Text
        { Title: "Hours", FieldTypeKind: 9 },          // Number
        { Title: "IsNightShift", FieldTypeKind: 8 },   // Boolean
      ];

      const fieldsUrl = `/web/lists/GetByTitle('Shifts')/fields`;
      for (const field of commonFields) {
        if (!existingFields.includes(field.Title)) {
          await apiClient.post(
            fieldsUrl,
            {
              __metadata: { type: "SP.Field" },
              Title: field.Title,
              FieldTypeKind: field.FieldTypeKind,
            },
            {
              headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest,
              },
            }
          );
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }
      }

      // 2. Lookup-поле для сотрудника (Employee)
      if (!existingFields.includes("Employee")) {
        const employeesListGuid = await getListGUID("Employees");
        const webGuid = await getWebGUID();

        const employeeLookupPayload = {
          parameters: {
            __metadata: { type: "SP.FieldCreationInformation" },
            Title: "Employee",
            FieldTypeKind: 7, // Lookup
            LookupListId: `{${employeesListGuid}}`,
            LookupWebId: `{${webGuid}}`,
            LookupFieldName: "Title",
            Required: true,
          },
        };

        const addEmployeeLookupEndpoint = `/web/lists/GetByTitle('Shifts')/fields/AddField`;
        await apiClient.post(
          addEmployeeLookupEndpoint,
          employeeLookupPayload,
          {
            headers: {
              Accept: "application/json;odata=verbose",
              "Content-Type": "application/json;odata=verbose",
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest,
            },
          }
        );
        console.log("✅ Поле 'Employee' (Lookup) добавлено.");
      }

      // 3. Lookup-поле для типа смены (ShiftType)
      if (!existingFields.includes("ShiftType")) {
        const shiftTypeListGuid = await getListGUID("ShiftType");
        const webGuid = await getWebGUID();

        const shiftTypeLookupPayload = {
          parameters: {
            __metadata: { type: "SP.FieldCreationInformation" },
            Title: "ShiftType",
            FieldTypeKind: 7, // Lookup
            LookupListId: `{${shiftTypeListGuid}}`,
            LookupWebId: `{${webGuid}}`,
            LookupFieldName: "Name",
            Required: true,
          },
        };

        const addShiftTypeLookupEndpoint = `/web/lists/GetByTitle('Shifts')/fields/AddField`;
        await apiClient.post(
          addShiftTypeLookupEndpoint,
          shiftTypeLookupPayload,
          {
            headers: {
              Accept: "application/json;odata=verbose",
              "Content-Type": "application/json;odata=verbose",
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest,
            },
          }
        );
        console.log("✅ Поле 'ShiftType' (Lookup) добавлено.");
      }

      console.log("✅ Все поля для 'Shifts' добавлены.");
    } catch (fieldsError) {
      console.error("❌ Ошибка проверки/добавления полей для 'Shifts':", fieldsError);
      throw fieldsError;
    }
  }
}

export async function ensureShiftPatternListExists(): Promise<void> {
  let listExists = false;
  try {
    // Проверяем существование списка "ShiftPattern"
    await apiClient.get("/web/lists/GetByTitle('ShiftPattern')", {
      headers: { Accept: "application/json;odata=verbose" },
    });
    console.log("✅ Список 'ShiftPattern' найден");
    listExists = true;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'ShiftPattern' не найден. Создаем...");
      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");

        // 1. Создаем сам список "ShiftPattern"
        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "ShiftPattern",
          BaseTemplate: 100,
          Description: "Паттерны чередования смен сотрудников",
        };

        const createListResponse = await apiClient.post(
          "/web/lists",
          listPayload,
          {
            headers: {
              Accept: "application/json;odata=verbose",
              "Content-Type": "application/json;odata=verbose",
              "X-Requested-With": "XMLHttpRequest",
              "X-RequestDigest": digest,
            },
          }
        );
        console.log("✅ Список 'ShiftPattern' создан:", createListResponse.data);
        listExists = true;
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'ShiftPattern':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'ShiftPattern':", error);
      throw error;
    }
  }

  if (listExists) {
    try {
      // Получаем список существующих полей
      const fieldsResponse = await apiClient.get(
        "/web/lists/GetByTitle('ShiftPattern')/fields",
        { headers: { Accept: "application/json;odata=verbose" } }
      );
      const existingFields: string[] = fieldsResponse.data.d.results.map(
        (f: any) => f.Title
      );

      // Определяем необходимые поля для списка "ShiftPattern"
      // Если требуется многострочное поле, для хранения JSON можно использовать FieldTypeKind: 3 (Note)
      // Здесь оставляем FieldTypeKind: 2, как в примере, но при необходимости измените на 3.
      const requiredFields: { Title: string; FieldTypeKind: number }[] = [
        { Title: "Name", FieldTypeKind: 2 },
        { Title: "Pattern", FieldTypeKind: 2 },
      ];

      const digest = await getRequestDigest();
      const fieldsUrl = `/web/lists/GetByTitle('ShiftPattern')/fields`;
      for (const field of requiredFields) {
        if (!existingFields.includes(field.Title)) {
          await apiClient.post(
            fieldsUrl,
            {
              __metadata: { type: "SP.Field" },
              Title: field.Title,
              FieldTypeKind: field.FieldTypeKind,
            },
            {
              headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest,
              },
            }
          );
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }
      }
      console.log("✅ Все поля для 'ShiftPattern' проверены и добавлены, если отсутствовали.");
    } catch (fieldsError) {
      console.error("❌ Ошибка проверки/добавления полей для 'ShiftPattern':", fieldsError);
      throw fieldsError;
    }
  }
}
