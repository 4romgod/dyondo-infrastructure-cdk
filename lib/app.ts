#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DyondoApiEcsStack } from './stack/dyondo-api-ecs-stack';

const app = new cdk.App();

const dyondoApiEcsStack = new DyondoApiEcsStack(app, 'BlogApiEcsStack', {
  dockerFilePath: "",
  env: { 
    account: "123456789012",
    region: "us-east-1"
  }
});