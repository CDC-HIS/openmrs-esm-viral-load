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
import { fetchPatientData, fetchVlTestRequestResult, useLatestObs } from '../api/api';
import { config } from 'dotenv';

interface HivCareAndTreatmentProps {
  patientUuid: string;
}

const targetedOpt = [
  // {
  //   concept: '9ffb81b7-3d9e-4f72-b1ba-3f60f07e4661',
  //   label: 'Repeat or confirmatory VL: initial viral load greater than 1000',
  //   hide: {
  //     hideWhenExpression: 'true',
  //   },
  // },
  {
    concept: '4c6f2326-480f-449d-9932-fe85019997f6',
    label: 'Suspected Antiretroviral failure',
  },
];

const routineTestOpt = [
  {
    concept: 'd1977f43-83a5-4b32-b589-33b9315e912d',
    label: 'First viral load test at 3 months or longer post ART',
    hide: {
      hideWhenExpression: "pregnant !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
    },
  },
  {
    concept: 'b450f8e7-f55e-4788-8fb4-de5229db1b10',
    label: 'First viral load test at 6 months or longer post ART',
  },
  {
    concept: 'c616b09a-bcc2-49a9-b47c-7219f7695e91',
    label: 'Second viral load test at 12 months post ART',
  },
  {
    concept: '42a61e3f-e3e9-46a8-96e3-8643f4d476a4',
    label: 'Annual viral load test',
  },
  {
    concept: '89e9a9ee-15d1-424b-be5a-0765822cd35e',
    label: 'At the first antenatal care visit',
    hide: {
      hideWhenExpression: "pregnant !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
    },
  },
  {
    concept: 'c1f8f2f6-ec39-422b-a305-58ccafec86c3',
    label: 'At 34-36 weeks of gestation',
    hide: {
      hideWhenExpression: "pregnant !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
    },
  },
  {
    concept: '603faef3-2142-4ee7-8781-aa977ada17a2',
    label: 'Three months after delivery',
    hide: {
      hideWhenExpression: "breastfeeding !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
    },
  },
  {
    concept: 'd3d6d8e3-0438-4f83-ba9f-ac46eed6782b',
    label: 'Six months after the first viral load test at postnatal period',
    hide: {
      hideWhenExpression: "breastfeeding !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
    },
  },
  {
    concept: 'd18e5f76-5026-45d1-be18-f14ae936c692',
    label: 'Every six months until MTCT ends',
    hide: {
      hideWhenExpression: "breastfeeding !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
    },
  },
  {
    concept: '9dbe8de0-c0ca-4bb0-ac46-207dd5ee5caf',
    label:
      'Viral load after EAC: repeat viral load where initial viral load greater than 50 and less than 1000 copies per ml',
  },
  {
    concept: '4afb4baf-14c0-498b-b908-06b33e50476e',
    label: 'Viral load after EAC: confirmatory viral load where initial viral load greater than 1000 copies per ml',
  },
];

const targetedMap = Object.fromEntries(targetedOpt.map((o) => [o.concept, o.label]));

const routineMap = Object.fromEntries(routineTestOpt.map((o) => [o.concept, o.label]));

const ViralLoadSummary: React.FC<HivCareAndTreatmentProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const displayText = 'ETORRS';
  const headerTitle = 'ETORRS';
  const { vlRequestOrders, isError, isValidating } = useVLRequestOrders(patientUuid);
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const launchViralLoadForm = useCallback(() => launchPatientWorkspace(ettorsWorkspace), []);

  const [vlTestRequestData, setVlTestRequestData] = useState(null);
  const [isLoadingTestData, setIsLoadingTestData] = useState<boolean>(true);

  const { latestMatched: hasEntryInformation, cacheKey: entryInformationKey } = useLatestObs(
    patientUuid,
    '5c118396-52dc-4cac-8860-e6d8e4a7f296',
    '136b2ded-22a3-4831-a39a-088d35a50ef5',
  );

  const hasFollowupRecord = hasEntryInformation != null;

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

  const hasIncompleteResult = useMemo(() => {
    return vlRequestOrders?.some((order) => !order.resultStatus);
  }, [vlRequestOrders]);

  const tableRows = useMemo(() => {
    return vlRequestOrders
      ? vlRequestOrders.map((item, index) => ({
          id: item.uuid || index,
          followUpDate: item.followUpDate
            ? formatDate(parseDate(item.followUpDate), { mode: 'wide', time: false, noToday: true })
            : null,
          encounterId: item.encounterId,
          requestedDate: item.requestedDate
            ? formatDate(parseDate(item.requestedDate), { mode: 'wide', time: false, noToday: true })
            : null,
          regimen: item.regimen || null,
          //reason: item.routineVl || item.targeted || null,
          reason: item.routineVl
            ? routineMap[item.routineVl] || item.routineVl
            : item.targeted
            ? targetedMap[item.targeted] || item.targeted
            : null,
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

  return (
    <div className={styles.widgetCard}>
      <CardHeader title={headerTitle}>
        {isValidating && <InlineLoading />}
        {hasFollowupRecord && !hasIncompleteResult && (
          <Button
            kind="ghost"
            renderIcon={(props) => <Add size={16} {...props} />}
            iconDescription="Add"
            onClick={launchViralLoadForm}
          >
            {t('add', 'Add')}
          </Button>
        )}
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
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getExpandedRowProps }) => (
              <TableContainer>
                <Table aria-label="Viral Load" {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      <TableCell className={styles.header} />
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
                            <TableCell>
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
        <EmptyState displayText={t('noData', 'Data')} headerTitle={''} />
      )}
    </div>
  );
};

export default ViralLoadSummary;
