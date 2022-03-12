import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Stack, StackProps, App } from 'aws-cdk-lib';

export type DyondoRoute53Props = StackProps

export class DyondoApiEcsStack extends Stack {
    constructor(scope: App, id: string, props: DyondoRoute53Props) {
        super(scope, id, props);

        new PublicHostedZone(this, 'HostedZone', {
            zoneName: 'fully.qualified.domain.com',
        });
    }
}