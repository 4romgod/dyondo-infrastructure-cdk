import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, ContainerImage } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Stack, StackProps, App } from "aws-cdk-lib";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";

export interface DyondoApiEcsServiceProps extends StackProps {
    readonly dockerFilePath: string
}

export class DyondoApiEcsStack extends Stack {
    constructor(scope: App, id: string, props: DyondoApiEcsServiceProps) {
        super(scope, id, props);

        const dyondoApiVpc = new Vpc(this, "DyondoApiVpcId", {
            maxAzs: 3
        });

        const dyondoApiEcsCluster = new Cluster(this, "DyondoApiEcsClusterId", {
            vpc: dyondoApiVpc
        });

        const dyondoApiDockerImage = new DockerImageAsset(this, 'DyondoApiDockerImageId', {
            directory: path.join(__dirname, props.dockerFilePath),
        });

        const dyondoApiFargateService = new ApplicationLoadBalancedFargateService(this, "DyondoApiFargateServiceId", {
            cluster: dyondoApiEcsCluster,
            cpu: 512,
            desiredCount: 6,
            taskImageOptions: {
                containerPort: 8000,
                image: ContainerImage.fromDockerImageAsset(dyondoApiDockerImage)
            },
            memoryLimitMiB: 2048,
            publicLoadBalancer: true
        });
    }
}