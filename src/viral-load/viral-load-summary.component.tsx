import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
} from '@carbon/react';
import { DataTableSkeleton, InlineLoading } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { formatDate, parseDate, useLayoutType } from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import styles from './hiv-care-and-treatment.scss';
import { useEncounters } from './viral-load.resource';
import { VIRALLOAD_ENCOUNTER_TYPE_UUID, viralLoadFieldConcepts, ettorsWorkspace } from '../constants';
import { getObsFromEncounter } from '../utils/encounter-utils';
import { EncounterActionMenu } from '../utils/encounter-action-menu';
import { TableExpandRow, TableExpandedRow } from '@carbon/react';
import debounce from 'lodash.debounce';

interface HivCareAndTreatmentProps {
  patientUuid: string;
}

const ViralLoadSummary: React.FC<HivCareAndTreatmentProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const displayText = 'Viral Load Order Result';
  const headerTitle = 'Viral Load Order Result';
  const { encounters, isError, isLoading, isValidating, mutate } = useEncounters(
    patientUuid,
    VIRALLOAD_ENCOUNTER_TYPE_UUID,
  );
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const launchViralLoadForm = useCallback(() => launchPatientWorkspace(ettorsWorkspace), []);

  const tableHeaders = [
    { key: 'expand', header: '' },
    { key: 'dateOfSampleCollectionDate', header: 'Date specimen collected' },
    { key: 'dateOfSpecimenSent', header: 'Date specimen sent' },
    { key: 'specimenType', header: 'Specimen type' },
    { key: 'requestedBy', header: 'Requested by' },
    { key: 'requestedDate', header: 'Requested Date' },
    // { key: 'telNo', header: 'Tel. Number' },
  ];

  const tableRows = useMemo(() => {
    if (!Array.isArray(encounters)) return [];
    return encounters.map((encounter) => ({      
      id: encounter.uuid,
      dateOfSampleCollectionDate: getObsFromEncounter(encounter, viralLoadFieldConcepts.dateOfSampleCollectionDate, true) ?? '--',
      dateOfSpecimenSent: getObsFromEncounter(encounter, viralLoadFieldConcepts.dateOfSpecimenSent, true) ?? '--',
      specimenType: '--',              // Replace with actual data if available
      requestedBy: getObsFromEncounter(encounter, viralLoadFieldConcepts.providerName) ?? '--',
      requestedDate: getObsFromEncounter(encounter, viralLoadFieldConcepts.requestedDate, true) ?? '--',
      resultDate: getObsFromEncounter(encounter, viralLoadFieldConcepts.requestedDate, true) ?? '--',
      encounterDatetime: encounter.encounterDatetime,
    }));
  }, [encounters]);

  const sortedRows = useMemo(() => {
    return tableRows.sort((a, b) => {
      const dateA = new Date(a.encounterDatetime).getTime();
      const dateB = new Date(b.encounterDatetime).getTime();
      return dateB - dateA;
    });
  }, [tableRows]);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;
  const totalRows = sortedRows.length;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedRows.slice(indexOfFirstRow, indexOfLastRow);

  const handleFilter = ({ rowIds, headers, cellsById, inputValue, getCellId }) => {
    return rowIds.filter((rowId) =>
      headers.some(({ key }) => {
        const cellId = getCellId(rowId, key);
        const filterableValue = cellsById[cellId]?.value;
        const filterTerm = inputValue.toLowerCase();
        return ('' + filterableValue).toLowerCase().includes(filterTerm);
      }),
    );
  };

  // Error handling for loading and error states
  if (isLoading) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;

  return (
    <div className={styles.widgetCard}>
      <CardHeader title={headerTitle}>
        <span>{isValidating ? <InlineLoading /> : null}</span>
        <Button
          kind="ghost"
          renderIcon={(props) => <Add size={16} {...props} />}
          iconDescription="Add"
          onClick={launchViralLoadForm}
        >
          {t('add', 'Add')}
        </Button>
      </CardHeader>
      {currentRows.length > 0 ? (
        <>
          <DataTable 
            filterRows={handleFilter}
            rows={currentRows}
            headers={tableHeaders}
            useZebraStyles
            size={isTablet ? 'lg' : 'sm'}
          >
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getExpandedRowProps  }) => (
              <TableContainer>
                <Table aria-label="Viral Load" {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                    <TableCell />
                      {headers.map((header) => (
                        <TableHeader
                          {...getHeaderProps({
                            header,
                            isSortable: header.isSortable,
                          })}
                        >
                          {header.header?.content ?? header.header}
                        </TableHeader>
                      ))}
                      <TableHeader />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const foundEncounter = encounters.find((encounter) => encounter.uuid === row.id);
                      const resultDate = tableRows.find((rowData) => rowData.id === row.id)?.resultDate ?? '--';
                      return (
                        <React.Fragment key={row.id}>
                        <TableExpandRow className={styles.row} {...getRowProps({ row })}>
                          {/* First cell for expand icon */}
                          
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                          ))}
                          <TableCell className="cds--table-column-menu">
                            <EncounterActionMenu
                              patientUuid={patientUuid}
                              encounter={foundEncounter}
                              mutateEncounters={mutate}
                            />
                          </TableCell>
                        </TableExpandRow>

                        {row.isExpanded && (
                          <TableExpandedRow
                            colSpan={headers.length + 2}
                            {...getExpandedRowProps({ row })}
                          >
                            <div className={styles.expandedRowContent}>
      {/* Table layout for expanded row content */}
      <TableContainer>
        <Table size="sm">
          <TableHead>
            <TableRow>
              <TableHeader>Result Date</TableHeader>
              <TableHeader>Result</TableHeader>
              <TableHeader>Provider Name</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{resultDate}</TableCell> 
              <TableCell>--</TableCell>    
              <TableCell>--</TableCell> 
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
                          </TableExpandedRow>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
          <Pagination
            page={currentPage}
            pageSize={rowsPerPage}
            totalItems={totalRows}
            onChange={({ page }) => setCurrentPage(page)}
            pageSizes={[5, 10, 15]}
          />
        </>
      ) : (
        <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchViralLoadForm} />
      )}
    </div>
  );
};

export default ViralLoadSummary;
