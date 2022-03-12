import { ContainerImage, LogDrivers } from 'aws-cdk-lib/aws-ecs';
import { FargateTaskDefinition, Protocol } from 'aws-cdk-lib/aws-ecs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { DyondoEnvVars } from '../interfaces';
import { API_CONTAINER_NAME } from '../constants';

export interface FargateTaskConstructProps {
    appName: string;
    ecrRepositoryUri: string
    envVars: DyondoEnvVars;
}

export class FargateTaskConstruct extends Construct {

    public readonly fargateTask: FargateTaskDefinition;

    constructor(scope: Construct, id: string, props: FargateTaskConstructProps) {
        super(scope, id);

        const taskDefinition = new FargateTaskDefinition(this, `${props.appName}ApiTaskDefinitionId`, {
            memoryLimitMiB: 1024,
            cpu: 512
        });

        taskDefinition.addContainer(`${props.appName}ApiContainterId`, {
            containerName: `${API_CONTAINER_NAME}`,
            portMappings: [{
                protocol: Protocol.TCP,
                containerPort: 8000
            }],
            image: ContainerImage.fromRegistry('public.ecr.aws/itx-devops/curlimages_curl:latest'), // find a way to use own repo, and bootstrap the repo
            environment: {...props.envVars},
            logging: LogDrivers.awsLogs({
                streamPrefix: `${props.appName}-api-on-fargate`,
                logRetention: RetentionDays.ONE_MONTH
            })
        });

        this.fargateTask = taskDefinition;
    }
}