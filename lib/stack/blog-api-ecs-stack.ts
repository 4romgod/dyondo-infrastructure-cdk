import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, ContainerImage } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class BlogApiEcsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const blogApiVpc = new Vpc(this, "BlogApiVpc", {
            maxAzs: 3
        });

        const blogApiEcsCluster = new Cluster(this, "BlogApiEcsCluster", {
            vpc: blogApiVpc
        });

        new ApplicationLoadBalancedFargateService(this, "BlogApiFargateService", {
            cluster: blogApiEcsCluster,
            cpu: 512,
            desiredCount: 6,
            taskImageOptions: { image: ContainerImage.fromRegistry("amazon/amazon-ecs-sample") },
            memoryLimitMiB: 2048,
            publicLoadBalancer: true
        });
    }
}