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
import { useVLRequestOrders } from './viral-load.resource';
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
  const { vlRequestOrders, isError, isValidating } = useVLRequestOrders(patientUuid);
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const launchViralLoadForm = useCallback(() => launchPatientWorkspace(ettorsWorkspace), []);

  const [vlTestRequestData, setVlTestRequestData] = useState(null);
  const [isLoadingTestData, setIsLoadingTestData] = useState<boolean>(true);

  useEffect(() => {
    const getVlTestRequestData = async () => {
      try {
        setIsLoadingTestData(true);
        const data = await fetchVlTestRequestResult(patientUuid);
        setVlTestRequestData(data);
      } catch (error) {
        console.error('Error fetching VL Test Request data:', error);
        setVlTestRequestData([]);
      } finally {
        setIsLoadingTestData(false);
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
    return vlRequestOrders
      ? vlRequestOrders.map((item, index) => ({
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
  }, [vlRequestOrders]);

  const sortedRows = useMemo(() => {
    return tableRows.sort((b, a) => {
      const dateA = new Date(a.followUpDate).getTime();
      const dateB = new Date(b.followUpDate).getTime();
      return dateA - dateB;
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
  if (isLoadingTestData) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;

  if (vlRequestOrders?.length) {
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
                        const tableRowData = tableRows?.find((vlRequestOrders) => vlRequestOrders.id === row.id) || {};
                        const { testResultDate, testResult, testedBy, resultStatus } = tableRowData as {
                          testResultDate?: string;
                          testResult?: string;
                          testedBy?: string;
                          resultStatus?: string;
                        };

                        return (
                          <React.Fragment key={row.id}>
                            <TableExpandRow className={styles.row} {...getRowProps({ row })}>
                              {row.cells.map((cell) => (
                                <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                              ))}
                              <TableCell className="cds--table-column-menu">
                                <EncounterActionMenu
                                  patientUuid={patientUuid}
                                  encounter={vlRequestOrders?.find((rowData) => rowData.uuid === row.id)}
                                />
                              </TableCell>
                            </TableExpandRow>

                            {row.isExpanded && (
                              <TableExpandedRow colSpan={headers.length + 2} {...getExpandedRowProps({ row })}>
                                <div className={styles.expandedRowContent}>
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
                                          <TableCell>{testResultDate ?? '--'}</TableCell>
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
                      })}{' '}
                    </TableBody>{' '}
                  </Table>
                </TableContainer>
              )}
            </DataTable>
            <Pagination
              page={currentPage}
              pageSize={rowsPerPage}
              totalItems={totalRows}
              onChange={({ page }) => setCurrentPage(page)}
              pageSizes={[10, 20, 30, 50]}
            />
          </>
        ) : (
          <div></div>
        )}
      </div>
    );
  }
  return <div></div>;
};

export default ViralLoadSummary;
