import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';
import { TextField } from '@mui/material';

const EmployeeFilter = forwardRef((props: IFilterParams, ref) => {
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    console.log('[EmployeeFilter] filterText changed:', filterText);
    // Если API и колонка доступны, обновляем модель фильтра
    if (props.api && props.column) {
      const colId = props.column.getColId();
      // Получаем текущую модель фильтра
      const currentModel = props.api.getFilterModel() || {};
      if (filterText.trim() !== '') {
        currentModel[colId] = { type: 'contains', filter: filterText };
      } else {
        delete currentModel[colId];
      }
      console.log('[EmployeeFilter] Setting filter model for column', colId, currentModel);
      props.api.setFilterModel(currentModel);
    } else {
      console.log('[EmployeeFilter] api or column is not available');
    }
  }, [filterText, props]);

  useImperativeHandle(
    ref,
    () => ({
      doesFilterPass: (params: IDoesFilterPassParams) => {
        let value: any;
        if (props.colDef && props.colDef.valueGetter) {
          const getter = props.colDef.valueGetter;
          if (typeof getter === 'function') {
            value = getter({ data: params.data, node: params.node } as any);
            console.log('[EmployeeFilter] using valueGetter. Value:', value);
          } else {
            value = getter;
            console.log('[EmployeeFilter] valueGetter is not a function. Value:', value);
          }
        } else {
          value = params.data[props.colDef.field || ''];
          console.log('[EmployeeFilter] using data[field]. Value:', value);
        }
        const result =
          value != null &&
          value.toString().toLowerCase().includes(filterText.toLowerCase());
        console.log(
          '[EmployeeFilter] doesFilterPass result:',
          result,
          'for value:',
          value,
          'and filterText:',
          filterText
        );
        return result;
      },

      isFilterActive: () => {
        const active =
          filterText !== null &&
          filterText !== undefined &&
          filterText.trim() !== '';
        console.log('[EmployeeFilter] isFilterActive:', active);
        return active;
      },

      getModel: () => {
        if (!filterText || filterText.trim() === '') {
          console.log('[EmployeeFilter] getModel returns null');
          return null;
        }
        console.log('[EmployeeFilter] getModel returns:', { value: filterText });
        return { value: filterText };
      },

      setModel: (model: any) => {
        console.log('[EmployeeFilter] setModel called with model:', model);
        setFilterText(model ? model.value : '');
      }
    }),
    [filterText, props]
  );

  return (
    <div style={{ padding: '4px' }}>
      <TextField
        variant="outlined"
        size="small"
        placeholder="Фильтр сотрудника..."
        value={filterText}
        onChange={(e) => {
          console.log('[EmployeeFilter] onChange:', e.target.value);
          setFilterText(e.target.value);
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
});

export default EmployeeFilter;
