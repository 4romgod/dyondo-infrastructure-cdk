import { Stage, ServiceAccount } from './interfaces';

export const DEV_DUB: ServiceAccount = {
    name: 'Dyondo Api Dev Dub',
    awsAccountId: '045383269136',
    awsRegion: 'eu-west-2',
    stage: Stage.DEV
};

export const APP_NAME = 'Dyondo';
export const API_NAME = `${APP_NAME}Api`;