export const moduleName = '@openmrs/esm-patient-chart-app';

export const encounterRepresentation =
  'custom:(uuid,encounterDatetime,encounterType,location:(uuid,name),' +
  'patient:(uuid,display),encounterProviders:(uuid,provider:(uuid,name)),' +
  'obs:(uuid,obsDatetime,voided,groupMembers,formFieldNamespace,formFieldPath,concept:(uuid,name:(uuid,name)),value:(uuid,name:(uuid,name),' +
  'names:(uuid,conceptNameType,name))))';

export const viralLoadFieldConcepts = {  
  dateOfSampleCollectionDate: '159951AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  dateOfSpecimenSent: '82240b0c-f519-4608-af5e-642864aeea5e',
  specimenType: '4c1fed7f-7346-498d-9846-effd0629ecff',
  providerName: '1473AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  providerTelephoneNumber: '5587f1b1-1917-4345-a284-a0ed6a56a522',
  requestedDate: '163281AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  testDate: '67e5e461-c1bd-44fc-8b74-5929a388df9a',
  viralLoadCount: '856AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  testedBy: '164422AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  reviewedBy: '161562AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
};

export const ettorsWorkspace = 'ettors-workspace';
export const vlResultWorkspace = 'viral-load-result-workspace';
export const phdpEncounterTypeUuid = 'f1b397c1-46bd-43e6-a23d-ae2cedaec881';

export const FOLLOWUP_ENCOUNTER_TYPE_UUID = '136b2ded-22a3-4831-a39a-088d35a50ef5';
export const VIRALLOAD_ENCOUNTER_TYPE_UUID = 'f0979041-4a1e-44e6-b8c2-6e6631b75548';
export const VIRALLOAD_FORM_UUID = '2bc4595c-3714-411f-ae1f-986acc95161e';
export const VIRALLOAD_RESULT_FORM_UUID = 'ae6d50ba-dabc-41d9-9f3a-bf5aec29955c';
