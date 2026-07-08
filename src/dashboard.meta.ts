import { type DashboardLinkConfig } from '@openmrs/esm-patient-common-lib';

export const dashboardMeta: DashboardLinkConfig & { slot: string; hideDashboardTitle: boolean } = {
  slot: 'ettors-dashboard-slot',
  path: 'etorrs',
  title: 'VL-ETORRS',
  icon: 'omrs-icon-lab-order',
  hideDashboardTitle: true,
};
