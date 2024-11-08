import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { showModal, useLayoutType } from '@openmrs/esm-framework';
import styles from './encounter-action-menu.scss';
import { type OpenmrsEncounter } from '../types';
import { ettorsWorkspace, vlResultWorkspace } from '../constants';
import { deleteEncounter } from './encounter.resource';

interface EncounterActionMenuProps {
  encounter: OpenmrsEncounter;
  patientUuid?: string;
  mutateEncounters: () => void;
}

export const EncounterActionMenu = ({ encounter, patientUuid, mutateEncounters }: EncounterActionMenuProps) => {
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
      workspaceTitle: t('addEncounter', 'Viral Load Result'),
      encounter,
      formContext: 'adding',
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
          itemText={t('edit', 'Modify order')}
        />
        <OverflowMenuItem
          className={styles.menuItem}
          id="addEncounter"
          onClick={launchAddVLResultForm}
          itemText={t('add', 'Add result')}
        />
        <OverflowMenuItem
          className={styles.menuItem}
          id="deleteEncounter"
          itemText={t('delete', 'Delete')}
          onClick={() => launchDeleteEncounterDialog(encounter.uuid)}
          isDelete
          hasDivider
          aria-label={t('deleteEncounter', 'Cancel order')} // Added aria-label for accessibility
        />
      </OverflowMenu>
    </Layer>
  );
};
