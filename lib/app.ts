import { App } from 'aws-cdk-lib';
import { DyondoApiEcsStack } from './stack/dyondo-api-ecs-stack';
import { DEV_DUB } from './constants';

const app = new App();

new DyondoApiEcsStack(app, 'BlogApiEcsStack', {
  dockerFilePath: 'dyondo-api', // Path where Dockerfile resides
  env: {
    account: DEV_DUB.awsAccountId,
    region: DEV_DUB.awsRegion
  }
});