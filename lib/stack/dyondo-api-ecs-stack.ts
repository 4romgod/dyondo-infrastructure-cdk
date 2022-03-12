import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { FargateTaskConstruct } from '../construct/fargate-task-construct';
import { EcrRepoConstruct } from '../construct/ecr-construct';
import { DyondoPipelineConstruct } from '../construct/ecr-pipeline-construct';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { APP_NAME } from '../constants';
import 'dotenv/config';

export interface DyondoApiEcsServiceProps extends StackProps {
    readonly dockerFilePath: string
}

export class DyondoApiEcsStack extends Stack {

    readonly vpc: Vpc;
    readonly ecsCluster: Cluster;
    readonly ecrRepository: EcrRepoConstruct;
    readonly fargateService: ApplicationLoadBalancedFargateService;
    readonly fargateTaskDefinition: FargateTaskConstruct;

    constructor(scope: App, id: string, props: DyondoApiEcsServiceProps) {
        super(scope, id, props);

        this.vpc = new Vpc(this, `${APP_NAME}ApiVpcId`, {
            vpcName: `${APP_NAME}ApiVpc`,
            maxAzs: 3
        });

        this.ecsCluster = new Cluster(this, `${APP_NAME}ApiEcsClusterId`, {
            clusterName: `${APP_NAME}ApiEcsCluster`,
            vpc: this.vpc,
            containerInsights: true
        });

        this.ecrRepository = new EcrRepoConstruct(this, `${APP_NAME}ApiEcrRepoConstructId`, {
            appName: APP_NAME
        });

        this.fargateTaskDefinition = new FargateTaskConstruct(this, `${APP_NAME}ApiFargateTaskConstructId`, {
            appName: APP_NAME,
            ecrRepositoryUri: this.ecrRepository.ecrRepo.repositoryUri,
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
        
        this.fargateService = new ApplicationLoadBalancedFargateService(this, `${APP_NAME}ApiFargateServiceId`, {
            serviceName: `${APP_NAME}ApiFargateService`,
            cluster: this.ecsCluster,
            desiredCount: 1,
            taskDefinition: this.fargateTaskDefinition.fargateTask,
            publicLoadBalancer: true
        });
        
        new DyondoPipelineConstruct(this, `${APP_NAME}EcrPipelineId`, {
            github: {
                Branch: 'master',
                Token: `${process.env.GITHUB_ACCESS_TOKEN}`,
                RepoOwner: '4romgod',
                DyondoApiRepo: 'dyondo-api'
            },
            ecsCluster: this.ecsCluster,
            fargateService: this.fargateService,
            ecrRepo: this.ecrRepository.ecrRepo
        });
    }
}