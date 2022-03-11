import { ContainerImage, LogDrivers } from 'aws-cdk-lib/aws-ecs';
import { FargateTaskDefinition, Protocol } from 'aws-cdk-lib/aws-ecs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { DyondoEnvVars } from '../interfaces';
import { Repository } from 'aws-cdk-lib/aws-ecr';

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
            containerName: `${props.appName}ApiContainer`,
            portMappings: [{
                protocol: Protocol.TCP,
                containerPort: 8000
            }],
            image: ContainerImage.fromRegistry(props.ecrRepositoryUri),
            environment: {...props.envVars},
            logging: LogDrivers.awsLogs({
                streamPrefix: `${props.appName}-api-on-fargate`,
                logRetention: RetentionDays.ONE_MONTH
            })
        });

        this.fargateTask = taskDefinition;
    }
}