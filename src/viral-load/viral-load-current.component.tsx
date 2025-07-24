import React, { useCallback, useEffect, useState } from 'react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@carbon/react';
import { DataTableSkeleton } from '@carbon/react';
import { formatDate, launchWorkspace, parseDate, useLayoutType } from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import styles from './hiv-care-and-treatment.scss';
import { useVLRequestOrders } from './viral-load.resource';
import { ettorsWorkspace } from '../constants';
import { fetchPatientData } from '../api/api';

interface HivCareAndTreatmentProps {
  patientUuid: string;
}

const ViralLoadCurrent: React.FC<HivCareAndTreatmentProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const headerTitle = 'Current ART Information';
  const { vlRequestOrders, isError, isLoading: isLoadingVLRequests } = useVLRequestOrders(patientUuid);
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const [patientData, setPatientData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getPatientData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPatientData(patientUuid);
        setPatientData(data ? [data] : []); // Transform data as per table structure
      } catch (error) {
        console.error('Error fetching patient emergency contact:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    };

    getPatientData();
  }, [patientUuid]);

  const launchTransferOutForm = useCallback(() => launchWorkspace(ettorsWorkspace), []);

  // const tableHeaders = [
  //   { key: 'regimen', header: 'Regimen' },
  //   { key: 'dateOfTransfer', header: 'Regimen initiated date' },
  //   { key: 'clinicianName', header: 'Pregnancy' },
  //   { key: 'mrn', header: 'CD4/mm3(CD4%))' },
  //   { key: 'artStarted', header: 'Reason for test' },
  //   { key: 'regimen', header: 'Regimen' },
  // ];

  // const tableRows = useMemo(() => {
  //   if (!Array.isArray(encounters)) return [];
  //   return encounters.map((encounter) => ({
  //     id: encounter.uuid,
  //     transferredTo: getObsFromEncounter(encounter, viralLoadFieldConcepts.transferredTo) ?? '--',
  //     dateOfTransfer: getObsFromEncounter(encounter, viralLoadFieldConcepts.dateOfTransfer, true) ?? '--',
  //     //clinicianName: getObsFromEncounter(encounter, viralLoadFieldConcepts.ClinicianName) ?? '--',
  //     mrn: getObsFromEncounter(encounter, viralLoadFieldConcepts.mrn) ?? '--',
  //     artStarted: getObsFromEncounter(encounter, viralLoadFieldConcepts.artStarted) ?? '--',
  //     regimen: getObsFromEncounter(encounter, viralLoadFieldConcepts.originalFirstLineRegimenDose) ?? '--',
  //     encounterDatetime: encounter.encounterDatetime,
  //   }));
  // }, [encounters]);

  const tableHeaders = [
    // { key: 'artInitiatedDate', header: 'ART Initiated Date' },
    // { key: 'regimen', header: 'Regimen' },
    // { key: 'pregnancyStatus', header: 'Pregnancy Status' },
    // { key: 'breastFeeding', header: 'Breastfeeding' },
    // { key: 'cd4AboveFiveAgeCount', header: 'CD4 >5 Years' },
    // { key: 'cd4ForChild', header: 'CD4 for Child' },
    // { key: 'reasonForVlTest', header: 'Reason for VL Test' },
    // { key: 'routingVlTest', header: 'Routine VL Test' },
    // { key: 'targetedVlTest', header: 'Targeted VL Test' },
    { key: 'regimen', header: 'Regimen' },
    { key: 'currentRegimenInitiatedDate', header: 'Initiated Date' },
    { key: 'pregnant', header: 'Pregnant?' },
    { key: 'breastFeeding', header: 'Breast Feeding?' },
    { key: 'cd4', header: 'CD4 result' },
    { key: 'followUpStatus', header: 'Followup Status' },
    // { key: 'reasonForVlTest', header: 'Reason for VL Test' },
  ];

  const tableRows = patientData
    ? patientData.map((patient, index) => ({
        id: patient.patientUUID || index,
        regimen: patient.regimen || null,
        currentRegimenInitiatedDate: patient.currentRegimenInitiatedDate
          ? formatDate(parseDate(patient.currentRegimenInitiatedDate), { mode: 'wide' })
          : null,
        followUpStatus: patient.followUpStatus,
        pregnant: patient.pregnancyStatus !== null ? patient.pregnancyStatus : null,
        breastFeeding: patient.breastFeeding !== null ? patient.breastFeeding : null,
        cd4:
          patient.cd4AboveFiveAgeCount != null
            ? patient.cd4AboveFiveAgeCount
            : patient.cd4ForChild != null
            ? patient.cd4ForChild
            : null,
        // reasonForVlTest:
        //   patient.routingVlTest != null
        //     ? patient.routingVlTest
        //     : patient.targetedVlTest != null
        //     ? patient.targetedVlTest
        //     : null,
      }))
    : [];

  // patientData?.length ? patientData.map((data, index) => ({
  //   id: `row-${index}`,
  //   artInitiatedDate: data.artInitiatedDate,
  //   regimen: data.regimen,
  //   pregnancyStatus: data.pregnancyStatus,
  //   breastFeeding: data.breastFeeding,
  //   cd4AboveFiveAgeCount: data.cd4AboveFiveAgeCount,
  //   cd4ForChild: data.cd4ForChild,
  //   reasonForVlTest: data.reasonForVlTest,
  //   routingVlTest: data.routingVlTest,
  //   targetedVlTest: data.targetedVlTest,
  // })) : [];

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;
  const totalRows = tableRows.length;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = tableRows.slice(indexOfFirstRow, indexOfLastRow);

  // Error handling for loading and error states
  if (isLoading) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;

  return (
    <div className={styles.widgetCard}>
      <CardHeader title={headerTitle}>
        <span></span>
      </CardHeader>
      {currentRows.length > 0 ? (
        <>
          <DataTable rows={currentRows} headers={tableHeaders} useZebraStyles size={isTablet ? 'lg' : 'sm'}>
            {({ rows, headers, getHeaderProps, getTableProps }) => (
              <TableContainer>
                <Table aria-label="Patient Information" {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
          {/* <Pagination
            page={currentPage}
            pageSize={rowsPerPage}
            totalItems={currentRows.length}
            onChange={({ page }) => setCurrentPage(page)}
            pageSizes={[5, 10, 15]}
          /> */}
        </>
      ) : (
        <EmptyState displayText="No data available" headerTitle={headerTitle} launchForm={launchTransferOutForm} />
      )}
    </div>
  );
};

export default ViralLoadCurrent;
