import { RemovalPolicy } from 'aws-cdk-lib';
import { Repository, TagStatus } from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface EcrConstructProps {
    appName: string;
}

export class EcrRepoConstruct extends Construct {

    readonly ecrRepo: Repository;

    constructor(scope: Construct, id: string, props: EcrConstructProps) {
        super(scope, id);

        this.ecrRepo = new Repository(this, `${props.appName}RepositoryId`, {
            repositoryName: `${props.appName.toLowerCase()}-api-ecr-repo`,
            removalPolicy: RemovalPolicy.DESTROY,
            imageScanOnPush: true,
            lifecycleRules: [
                {
                    rulePriority: 1,
                    description: 'Keep images to a maximum',
                    maxImageCount: 10,
                    tagStatus: TagStatus.ANY,
                }
            ]
        });
    }
}