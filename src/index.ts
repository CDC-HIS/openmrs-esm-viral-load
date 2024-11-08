import { getAsyncLifecycle, defineConfigSchema, getSyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import { dashboardMeta } from './dashboard.meta';
import EttorsSummary from './viral-load/viral-load-summary.component';
import EttorsCurrent from './viral-load/viral-load-current.component';

const moduleName = '@openmrs/esm-ethio-ettors';

const options = {
  featureName: 'ettors',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(() => import('./root.component'), options);
export const ettorsSummary = getSyncLifecycle(EttorsSummary, options);
export const ettorsCurrent = getSyncLifecycle(EttorsCurrent, options);

//Care & treatment dashboard link
export const ettorsDashboardLink = getSyncLifecycle(
  createDashboardLink({
    ...dashboardMeta,
    moduleName,
  }),
  options,
);
export const ettorsWorkspace = getAsyncLifecycle(() => import('./forms/viral-load-form.component'), options);
export const vlResultWorkspace = getAsyncLifecycle(() => import('./forms/viral-load-result-form.component'), options);

export const encounterDeleteConfirmationDialog = getAsyncLifecycle(() => import('./utils/Delete-Encounter.modal'), {
  featureName: 'encounters',
  moduleName: '@openmrs/esm-patient-encounters-app',
});
