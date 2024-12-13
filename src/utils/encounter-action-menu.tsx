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

interface EncounterActionMenuProps {
  encounter: OpenmrsEncounter;
  patientUuid?: string;
  mutateEncounters: () => void;
}

export const EncounterActionMenu = ({ encounter, patientUuid, mutateEncounters }: EncounterActionMenuProps) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  console.log('Patient:', patientUuid);
  // const handleCancelOrder = async () => {
  //   const abortController = new AbortController(); // Create an AbortController instance
  //   const clearedPayload = {
  //     encounterId: encounter.encounterId,
  //     patientUUID: patientUuid,
  //     specimenCollectedDate: null,
  //     specimenType: null,
  //     providerPhoneNo: null,
  //     requestedDate: encounter.requestedDate,
  //     orderStatus: 'INCOMPLETE',
  //     requestedBy: null,
  //     specimenSentToReferralDate: null,
  //   };

  //   try {
  //     // Call the save function
  //     console.log("Patient-UUID", encounter);
  //     console.log("the cleared payload", clearedPayload);
  //     await saveVlTestRequestResult(abortController, clearedPayload);

  //     // Optionally refresh the UI or show a success message
  //     mutateEncounters();
  //     console.log('Order successfully canceled and cleared');
  //   } catch (error) {
  //     console.error('Error canceling and clearing order:', error);
  //     // Optionally show an error message to the user
  //   }
  // };
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
          mutateEncounters();

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
              : t('view', 'View result')
          }
          disabled={encounter.orderStatus === 'INCOMPLETE'}
        />
        {/* {encounter.orderStatus === 'COMPLETE' && encounter.exchangeStatus !== 'SENT' && (
        <OverflowMenuItem
          className={styles.menuItem}
          id="deleteEncounter"
          itemText={t('cancelOrder', 'Cancel Order')}
          //onClick={() => launchDeleteEncounterDialog(encounter.uuid)}
          onClick={handleCancelOrder}
          isDelete
          hasDivider
          aria-label={t('cancelOrder', 'Cancel Order')}
        />
      )} */}
      </OverflowMenu>
    </Layer>
  );
};
