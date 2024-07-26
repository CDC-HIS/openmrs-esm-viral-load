import React, { useCallback, useMemo } from 'react';
import { Button, DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@carbon/react';
import { DataTableSkeleton, InlineLoading } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { useLayoutType } from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from "react-i18next";
import styles from './hiv-care-and-treatment.scss'
import { useEncounters } from './care-and-treatment.resource';
import { hivCareAndTreatmentFormWorkspace } from '../constants';

interface HivCareAndTreatmentProps {
    patientUuid: string;
  }
  
  const HivCareAndTreatmentSummary: React.FC<HivCareAndTreatmentProps> = ({ patientUuid }) => {
    console.log(patientUuid);
    const { t } = useTranslation();
    const encounterTypeUuid = 'f1b397c1-46bd-43e6-a23d-ae2cedaec881';
    const displayText = t('hivCare', 'HIV Care And Treatment Encounter');
    const headerTitle = t('hivCareAndTreatment', 'HIV Care & Treatment');
    const { encounters, isError, isLoading, isValidating } = useEncounters(patientUuid, encounterTypeUuid);
    console.log(encounters);
    const layout = useLayoutType();
    const isTablet = layout === 'tablet';
    const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

    const launchHivCareAndTreatmentForm = useCallback(() => launchPatientWorkspace(hivCareAndTreatmentFormWorkspace), []);

    const tableHeaders = [
        { key: 'visitDate', header: t('visitDate', 'Visit Date') },

        {
          key: 'notes',
          header: t('notes', 'Notes'),
        },
      ];

      const tableRows = useMemo(() => {
        return encounters?.map((encounter) => ({
          visitDate: encounter.visitDate,
          note: encounter.notes
        }));
      }, [encounters]);

    //   if (isLoading) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;
    //   if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;


    //   if (encounters?.length) {
    //     return (
    //         <div className={styles.widgetCard}>
    //           <CardHeader title={headerTitle}>
    //             <span>{isValidating ? <InlineLoading /> : null}</span>
    //             <Button
    //               kind="ghost"
    //               renderIcon={(props) => <Add size={16} {...props} />}
    //               iconDescription="Add allergies"
    //               onClick={launchHivCareAndTreatmentForm}
    //             >
    //               {t('add', 'Add')}
    //             </Button>
    //           </CardHeader>
    //           <DataTable rows={tableRows} headers={tableHeaders} isSortable useZebraStyles size={isTablet ? 'lg' : 'sm'}>
    //             {({ rows, headers, getHeaderProps, getTableProps }) => (
    //               <TableContainer>
    //                 <Table aria-label="allergies summary" {...getTableProps()}>
    //                   <TableHead>
    //                     <TableRow>
    //                       {headers.map((header) => (
    //                         <TableHeader
    //                         //   className={classNames(styles.productiveHeading01, styles.text02)}
    //                           {...getHeaderProps({
    //                             header,
    //                             isSortable: header.isSortable,
    //                           })}
    //                         >
    //                           {header.header?.content ?? header.header}
    //                         </TableHeader>
    //                       ))}
    //                       <TableHeader />
    //                     </TableRow>
    //                   </TableHead>
    //                   <TableBody>
    //                     {rows.map((row) => (
    //                       <TableRow key={row.id}>
    //                         {row.cells.map((cell) => (
    //                           <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
    //                         ))}
    //                         <TableCell className="cds--table-column-menu">
    //                           {/* <FormActionMenu
    //                             patientUuid={patientUuid}
    //                             encounter={encoounters.find((encounter) => encounter.id == row.id)}
    //                           /> */}
    //                         </TableCell>
    //                       </TableRow>
    //                     ))}
    //                   </TableBody>
    //                 </Table>
    //               </TableContainer>
    //             )}
    //           </DataTable>
    //         </div>
    //       );
    //   }
      return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchHivCareAndTreatmentForm} />
  };
  
  export default HivCareAndTreatmentSummary;