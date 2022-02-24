import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BlogApiEcsStack } from '../../lib/stack/dyondo-api-ecs-stack';

describe('BlogApiEcsStack', () => {
    const app = new App();
    const stack = new BlogApiEcsStack(app, 'BlogApiEcsStack');
    const template = Template.fromStack(stack);

    test('EC2 VPC Created', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '10.0.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: "default"
        });
    });

    test('EC2 Subnet Created', () => {
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: "10.0.0.0/18",
            MapPublicIpOnLaunch: true,
        });
    });

    test('EC2 RouteTable Created', () => {
        template.hasResourceProperties('AWS::EC2::RouteTable', {});
    });

    test('ECS Cluster Created', () => {
        template.hasResourceProperties('AWS::ECS::Cluster', {});
    });

    test('ElasticLoadBalancingV2::LoadBalancer Created', () => {
        template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
            LoadBalancerAttributes: [
                {
                    Key: "deletion_protection.enabled",
                    Value: "false"
                }
            ],
            Scheme: "internet-facing"
        });
    });

    test('EC2 SecurityGroup Created', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            SecurityGroupIngress: [
                {
                    CidrIp: "0.0.0.0/0",
                    Description: "Allow from anyone on port 80",
                    FromPort: 80,
                    IpProtocol: "tcp",
                    ToPort: 80
                }
            ],
        });
    });

    test('EC2 SecurityGroupEgress Created', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
            IpProtocol: "tcp",
            FromPort: 80,
            ToPort: 80
        });
    });

});
