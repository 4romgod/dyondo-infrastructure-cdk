import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { FargateTaskConstruct } from '../construct/fargate-task-construct';
import { APP_NAME } from '../constants';

export interface DyondoApiEcsServiceProps extends StackProps {
    readonly dockerFilePath: string
}

export class DyondoApiEcsStack extends Stack {
    constructor(scope: App, id: string, props: DyondoApiEcsServiceProps) {
        super(scope, id, props);

        const dyondoApiVpc = new Vpc(this, `${APP_NAME}VpcId`, {
            vpcName: `${APP_NAME}Vpc`,
            maxAzs: 3
        });

        const dyondoApiEcsCluster = new Cluster(this, `${APP_NAME}EcsClusterId`, {
            clusterName: `${APP_NAME}EcsCluster`,
            vpc: dyondoApiVpc,
            containerInsights: true
        });

        const dyondoApiTaskDefinition = new FargateTaskConstruct(this, `${APP_NAME}FargateTaskConstructId`, {
            appName: APP_NAME,
            dockerFilePath: 'dyondo-api',
            envVars: {
                SENDGRID_API_KEY: `${process.env.SENDGRID_API_KEY}`,
                JWT_SECRET: `${process.env.SENDGRID_API_KEY}`,
                DATABASE_URL: `${process.env.DATABASE_URL}`,
                JWT_ACCOUNT_ACTIVATION: `${process.env.JWT_ACCOUNT_ACTIVATION}`,
                EMAIL_FROM: `${process.env.EMAIL_FROM}`,
                CLIENT_URL: `${process.env.CLIENT_URL}`,
                JWT_RESET_PASSWORD: `${process.env.JWT_RESET_PASSWORD}`,
                GOOGLE_CLIENT_ID: `${process.env.GOOGLE_CLIENT_ID}`,
                NODE_ENV: `${process.env.NODE_ENV}`
            }
        });

        new ApplicationLoadBalancedFargateService(this, `${APP_NAME}FargateServiceId`, {
            serviceName: `${APP_NAME}FargateService`,
            cluster: dyondoApiEcsCluster,
            desiredCount: 1,
            taskDefinition: dyondoApiTaskDefinition.fargateTask,
            publicLoadBalancer: true
        });
    }
}