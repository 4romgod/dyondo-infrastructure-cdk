import { ContainerImage, LogDrivers } from 'aws-cdk-lib/aws-ecs';
import { FargateTaskDefinition, Protocol } from 'aws-cdk-lib/aws-ecs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { DyondoEnvVars } from '../interfaces';
import * as path from 'path';

export interface FargateTaskConstructProps {
    appName: string;
    dockerFilePath: string;
    envVars: DyondoEnvVars;
}

export class FargateTaskConstruct extends Construct {

    public readonly fargateTask: FargateTaskDefinition;

    constructor(scope: Construct, id: string, props: FargateTaskConstructProps) {
        super(scope, id);

        const taskDefinition = new FargateTaskDefinition(this, `${props.appName}TaskDefinitionId`, {
            memoryLimitMiB: 1024,
            cpu: 512
        });

        taskDefinition.addContainer(`${props.appName}ContainterId`, {
            containerName: `${props.appName}Container`,
            portMappings: [{
                protocol: Protocol.TCP,
                containerPort: 8000
            }],
            image: ContainerImage.fromAsset(path.resolve(props.dockerFilePath)),
            environment: {...props.envVars},
            logging: LogDrivers.awsLogs({
                streamPrefix: `${props.appName}-on-fargate`,
                logRetention: RetentionDays.ONE_MONTH
            })
        });

        this.fargateTask = taskDefinition;
    }
}