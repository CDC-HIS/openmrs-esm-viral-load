import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { fetchPatientData, fetchVlTestRequestResult } from '../api/api';

interface HivCareAndTreatmentProps {
  patientUuid: string;
}

const ViralLoadSummary: React.FC<HivCareAndTreatmentProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const displayText = 'Viral Load Order Result';
  const headerTitle = 'Viral Load Order Result';
  const { encounters, isError, isValidating, mutate } = useEncounters(patientUuid, VIRALLOAD_ENCOUNTER_TYPE_UUID);
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const launchViralLoadForm = useCallback(() => launchPatientWorkspace(ettorsWorkspace), []);

  const [vlTestRequestData, setVlTestRequestData] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getVlTestRequestData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchVlTestRequestResult(patientUuid);
        setVlTestRequestData(data);
      } catch (error) {
        console.error('Error fetching VL Test Request data:', error);
        setVlTestRequestData([]);
      } finally {
        setIsLoading(false);
      }
    };

    getVlTestRequestData();
  }, [patientUuid]);

  const tableHeaders = [
    { key: 'expand', header: '' },
    { key: 'followUpDate', header: 'Followup Date' },
    { key: 'requestedDate', header: 'Requested Date' },
    { key: 'regimen', header: 'Regimen' },
    { key: 'reason', header: 'Reason for test' },
    { key: 'specimenCollectedDate', header: 'Date specimen collected' },
    { key: 'specimenType', header: 'Specimen type' },
    { key: 'orderStatus', header: 'Order Status' },
  ];

  const tableRows = useMemo(() => {
    return vlTestRequestData
      ? vlTestRequestData.map((item, index) => ({
          id: item.uuid || index,
          followUpDate: item.followUpDate ? formatDate(parseDate(item.followUpDate), { mode: 'wide' }) : null,
          encounterId: item.encounterId,
          requestedDate: item.requestedDate ? formatDate(parseDate(item.requestedDate), { mode: 'wide' }) : null,
          regimen: item.regimen || null,
          reason: item.routineVl || item.targeted || null,
          specimenCollectedDate: item.specimenCollectedDate
            ? formatDate(parseDate(item.specimenCollectedDate), { mode: 'wide' })
            : null,
          specimenType: item.specimenType || null,
          orderStatus: item.orderStatus || null,
          testResultDate: item.testResultDate ? formatDate(parseDate(item.testResultDate), { mode: 'wide' }) : '--',
          testResult: item.testResult || '--',
          testedBy: item.testedBy || '--',
          resultStatus: item.resultStatus || '--',

          reqDate: item.requestedDate,
          specimenCollectedDateGC: item.specimenCollectedDate || null,
          providerPhoneNo: item.providerPhoneNo || null,
          specimenSentToReferralDateGC: item.specimenSentToReferralDate || null,
          requestedBy: item.requestedBy || null,

          resultDate: item.testResultDate,
          reviewedBy: item.reviewedBy,
          aletSentDate: item.aletSentDate,
          dispatchedDate: item.dispatchedDate,
          labId: item.labId,
          labName: item.labName,
          specimenReceivedDate: item.specimenReceivedDate,
          reasonQuality: item.reason,
          instrumentUsed: item.instrumentUsed,
          temperatureOnArrival: item.temperatureOnArrival,
          resultReachedToFacDate: item.resultReachedToFacDate,
          resultReceivedByFacility: item.resultReceivedByFacility,
        }))
      : [];
  }, [vlTestRequestData]);

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
      <CardHeader title={headerTitle}>{isValidating && <InlineLoading />}</CardHeader>
      {currentRows.length > 0 ? (
        <>
          <DataTable
            filterRows={handleFilter}
            rows={currentRows}
            headers={tableHeaders}
            useZebraStyles
            size={isTablet ? 'lg' : 'sm'}
          >
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getExpandedRowProps }) => (
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
                      // const resultDate = tableRows.find((rowData) => rowData.id === row.id)?.resultDate ?? '--';
                      // const viralLoadCount = tableRows.find((rowData) => rowData.id === row.id)?.viralLoadCount ?? '--';
                      // const testedBy = tableRows.find((rowData) => rowData.id === row.id)?.testedBy ?? '--';
                      //const foundRow = vlTestRequestData.find((item) => item.uuid === row.id);
                      //console.log("typeof item.uuid", item.uuid);
                      const tableRowData = tableRows.find((rowData) => rowData.id === row.id) || {};
                      console.log('PATIENT-ID', patientUuid);
                      const {
                        encounterId,
                        uuid,
                        reqDate,
                        testResultDate,
                        resultDate,
                        testResult,
                        specimenCollectedDateGC,
                        specimenType,
                        providerPhoneNo,
                        orderStatus,
                        specimenSentToReferralDateGC,
                        requestedBy,
                        testedBy,
                        resultStatus,
                        requestedDate,
                        reviewedBy,
                        aletSentDate,
                        dispatchedDate,
                        labId,
                        labName,
                        specimenReceivedDate,
                        reasonQuality,
                        instrumentUsed,
                        temperatureOnArrival,
                        resultReachedToFacDate,
                        resultReceivedByFacility,
                        exchangeStatus,
                      } = tableRowData;
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
                                encounter={tableRowData}
                                mutateEncounters={mutate}
                              />
                            </TableCell>
                          </TableExpandRow>

                          {row.isExpanded && (
                            <TableExpandedRow colSpan={headers.length + 2} {...getExpandedRowProps({ row })}>
                              <div className={styles.expandedRowContent}>
                                {/* Table layout for expanded row content */}
                                <TableContainer>
                                  <Table size="sm">
                                    <TableHead>
                                      <TableRow>
                                        <TableHeader>Test Date</TableHeader>
                                        <TableHeader>Test Result</TableHeader>
                                        <TableHeader>Tested By</TableHeader>
                                        <TableHeader>Result Status</TableHeader>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>{testResultDate}</TableCell>
                                        <TableCell>{testResult}</TableCell>
                                        <TableCell>{testedBy}</TableCell>
                                        <TableCell>{resultStatus}</TableCell>
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
        <div></div>
      )}
    </div>
  );
};

export default ViralLoadSummary;
