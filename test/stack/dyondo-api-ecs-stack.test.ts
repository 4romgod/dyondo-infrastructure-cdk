import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DyondoApiEcsStack } from '../../lib/stack/dyondo-api-ecs-stack';

describe('BlogApiEcsStack', () => {
    const app = new App();
    const stack = new DyondoApiEcsStack(app, 'DyondoApiEcsStack', {
        dockerFilePath: 'dyondo-api'
    });
    const template = Template.fromStack(stack);

    test('VPC Created', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '10.0.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: 'default',
            Tags: [
                {
                  Key: 'Name',
                  Value: 'DyondoApiVpc'
                }
              ]
        });
    });

    test('Subnet Created', () => {
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: '10.0.0.0/18',
            MapPublicIpOnLaunch: true,
        });
    });

    test('RouteTable Created', () => {
        template.hasResourceProperties('AWS::EC2::RouteTable', {});
    });

    test('ECS Cluster Created', () => {
        template.hasResourceProperties('AWS::ECS::Cluster', {
            ClusterName: 'DyondoApiEcsCluster',
            ClusterSettings: [
              {
                Name: 'containerInsights',
                Value: 'enabled'
              }
            ]
        });
    });

    test('ElasticLoadBalancingV2::LoadBalancer Created', () => {
        template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
            LoadBalancerAttributes: [
                {
                    Key: 'deletion_protection.enabled',
                    Value: 'false'
                }
            ],
            Scheme: 'internet-facing'
        });
    });

    test('SecurityGroup Created', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            SecurityGroupIngress: [
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow from anyone on port 80',
                    FromPort: 80,
                    IpProtocol: 'tcp',
                    ToPort: 80
                }
            ],
        });
    });

    test('SecurityGroupEgress Created', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
            IpProtocol: 'tcp',
            FromPort: 8000,
            ToPort: 8000
        });
    });

});
