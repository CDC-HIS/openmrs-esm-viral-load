import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { showModal, useLayoutType } from '@openmrs/esm-framework';
import styles from './encounter-action-menu.scss';
import { type OpenmrsEncounter } from '../types';
import { ettorsWorkspace, vlResultWorkspace } from '../constants';
import { deleteEncounter } from './encounter.resource';
import { saveVlTestRequestResult } from '../api/api';

interface CustomTableProps {
  uuid: string;
  patientUUID: string;
  encounterId: string;
  facilityCode: string;
  requestedDate: string;
  regimen: string;
  dateInitiated: string;
  currentArtAdherence: string;
  pregnancy: string;
  breastFeeding: string;
  cd4MostRecent: string;
  cd4MostRecentDate: string;
  cd4BaselineResult: string;
  cd4BaselineResultDate: string;
  whoStaging: string;
  routineVl: string;
  targeted: string;
  specimenCollectedDate: string;
  specimenType: string;
  specimenSentToReferralDate: string;
  shipmentTemperature: string;
  labId: string;
  labName: string;
  specimenReceivedDate: string;
  temperatureOnArrival: string;
  specimenQuality: string;
  reason: string;
  instrumentUsed: string;
  testResult: string;
  testedBy: string;
  reviewedBy: string;
  dispatchedDate: string;
  aletSentDate: string;
  routineVLPregnantMother: string;
  resultReachedToFacDate: string;
  resultReceivedByFacility: string;
  attachedToPatientDate: string;
  communicatedToPatientDate: string;
  testResultDate: string;
  requestId: string;
  responseId: string;
  orderStatus: string;
  resultStatus: string;
  requestedBy: string;
  exchangeStatus: string;
  followUpDate: string;
  patientId: string;
  providerPhoneNo: string;
  resourceVersion: string;
}

interface EncounterActionMenuProps {
  encounter: CustomTableProps;
  patientUuid?: string;
}

export const EncounterActionMenu = ({ encounter, patientUuid }: EncounterActionMenuProps) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const launchEditEncounterForm = useCallback(() => {
    launchPatientWorkspace(ettorsWorkspace, {
      workspaceTitle: t('editEncounter', 'Edit Encounter'),
      encounter,
      formContext: 'editing',
    });
  }, [encounter, t]);

  const launchAddVLResultForm = useCallback(() => {
    launchPatientWorkspace(vlResultWorkspace, {
      workspaceTitle: t('editEncounter', 'Viral Load Result'),
      encounter,
      formContext: 'editing',
    });
  }, [encounter, t]);

  const launchDeleteEncounterDialog = (encounterUuid: string) => {
    const abortController = new AbortController(); // Create an AbortController

    const dispose = showModal('encounter-delete-confirmation-dialog', {
      closeDeleteModal: () => dispose(),
      encounterUuid,
      patientUuid,
      onConfirmDelete: async () => {
        try {
          // Call the deleteEncounter function
          await deleteEncounter(patientUuid ?? '', encounterUuid, abortController);
          // Call mutateEncounters to reload the list

          dispose(); // Close the modal after success
        } catch (error) {
          console.error('Error deleting encounter:', error);
        }
      },
    });
  };

  return (
    <Layer className={styles.layer}>
      <OverflowMenu
        aria-label={t('editOrDeleteEncounter', 'Edit or delete Encounter')}
        size={isTablet ? 'lg' : 'sm'}
        flipped
        align="left"
      >
        <OverflowMenuItem
          className={styles.menuItem}
          id="editEncounter"
          onClick={launchEditEncounterForm}
          itemText={
            encounter.exchangeStatus === 'SENT'
              ? t('viewOrder', 'View Order')
              : encounter.orderStatus === 'INCOMPLETE'
              ? t('completeOrder', 'Complete Order')
              : t('modifyOrder', 'Edit Order')
          }
        />
        <OverflowMenuItem
          className={styles.menuItem}
          id="addEncounter"
          onClick={launchAddVLResultForm}
          //itemText={t('edit', 'Add result')}
          itemText={
            encounter.resultStatus === 'MANUAL_ETTORS'
              ? t('editResult', 'Edit Result')
              : encounter.resultStatus === '--'
              ? t('editResult', 'Add Result')
              : encounter.resultStatus === null
              ? t('editResult', 'Add Result')
              : t('view', 'View result')
          }
          disabled={encounter.orderStatus === 'INCOMPLETE'}
        />
      </OverflowMenu>
    </Layer>
  );
};
