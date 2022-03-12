import { SecretValue } from 'aws-cdk-lib';
import { Pipeline, Artifact, ArtifactPath } from 'aws-cdk-lib/aws-codepipeline';
import { GitHubSourceAction, GitHubTrigger, CodeBuildAction, EcsDeployAction, ManualApprovalAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { BuildSpec, LinuxBuildImage, Source, Project, FilterGroup, EventAction } from 'aws-cdk-lib/aws-codebuild';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';
import { APP_NAME, API_CONTAINER_NAME } from '../constants';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Cluster } from 'aws-cdk-lib/aws-ecs';

export interface DyondoPipelineConstructProps {
    readonly github: {
        Token: string;
        RepoOwner: string;
        DyondoApiRepo: string;
        Branch: string;
    };
    readonly ecsCluster: Cluster;
    readonly fargateService: ApplicationLoadBalancedFargateService;
    readonly ecrRepo: Repository;
}

export class DyondoPipelineConstruct extends Construct {
    constructor(scope: Construct, id: string, props: DyondoPipelineConstructProps) {
        super(scope, id);

        const dyondoApiSourceOutput = new Artifact();
        const dyondoApiBuildOutput = new Artifact();

        const dyondoApiSourceAction = new GitHubSourceAction({
            actionName: `Checkout${APP_NAME}ApiRepo`,
            output: dyondoApiSourceOutput,
            owner: props.github.RepoOwner,
            repo: props.github.DyondoApiRepo,
            branch: props.github.Branch,
            oauthToken: SecretValue.plainText(props.github.Token),
            trigger: GitHubTrigger.WEBHOOK,
        });

        const dyondoApiBuildAction = new CodeBuildAction({
            actionName: `Build${APP_NAME}ApiImage`,
            project: buildDyondoApiImage(this, props),
            input: dyondoApiSourceOutput,
            outputs: [dyondoApiBuildOutput],
        });

        const manualApprovalAction = new ManualApprovalAction({
            actionName: 'Approve',
        });

        const dyondoApiDeployAction = new EcsDeployAction({
            actionName: `Deploy${APP_NAME}ApiService`,
            service: props.fargateService.service,
            imageFile: new ArtifactPath(dyondoApiBuildOutput, `imagedefinitions.json`)
        });

        new Pipeline(this, `${APP_NAME}PipelineId`, {
            pipelineName: `${APP_NAME}Pipeline`,
            crossAccountKeys: false,
            stages: [
                {
                    stageName: 'Source',
                    actions: [dyondoApiSourceAction]
                },
                {
                    stageName: 'Build',
                    actions: [dyondoApiBuildAction]
                },
                {
                    stageName: 'Approve',
                    actions: [manualApprovalAction],
                },
                {
                    stageName: 'Deploy',
                    actions: [dyondoApiDeployAction]
                }
            ]
        });
    }
}

const buildDyondoApiImage = (scope: Construct, props: DyondoPipelineConstructProps) => {
    const gitHubSource = Source.gitHub({
        owner: props.github.RepoOwner,
        repo: props.github.DyondoApiRepo,
        webhook: true,
        webhookFilters: [
            FilterGroup.inEventOf(EventAction.PUSH).andBranchIs(props.github.Branch),
            FilterGroup.inEventOf(EventAction.PULL_REQUEST_MERGED).andBranchIs(props.github.Branch),
        ],
    });

    const project = new Project(scope, `${APP_NAME}ApiEcrImageDeploymentProjectId`, {
        projectName: `${APP_NAME}ApiEcrImageDeployment`,
        description: 'This project retrives a Github repo, builds it, create a docker image, then push the image to ECR',
        source: gitHubSource,
        environment: {
            buildImage: LinuxBuildImage.AMAZON_LINUX_2_2,
            privileged: true
        },
        environmentVariables: {
            'CLUSTER_NAME': {
                value: `${props.ecsCluster.clusterName}`
            },
            'ECR_REPO_URI': {
                value: `${props.ecrRepo.repositoryUri}`
            },
            'CONTAINER_NAME': {
                value: `${API_CONTAINER_NAME}`
            }
        },
        buildSpec: BuildSpec.fromObject({
            version: '0.2',
            phases: {
                pre_build: {
                    commands: [
                        'env',
                        'export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}'
                    ]
                },
                build: {
                    commands: [
                        `docker build -t $ECR_REPO_URI:$TAG .`,
                        '$(aws ecr get-login --no-include-email)',
                        'docker push $ECR_REPO_URI:$TAG'
                    ]
                },
                post_build: {
                    commands: [
                        'echo "In Post-Build Stage"',
                        "printf '[{\"name\":\"%s\",\"imageUri\":\"%s\"}]' $CONTAINER_NAME $ECR_REPO_URI:$TAG > imagedefinitions.json",
                        "pwd; ls -al; cat imagedefinitions.json"
                    ]
                }
            },
            artifacts: {
                files: ['imagedefinitions.json']
            }
        })
    });

    props.ecrRepo.grantPullPush(project.role!);
    project.addToRolePolicy(new PolicyStatement({
        actions: [
            'ecs:DescribeCluster',
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:BatchGetImage',
            'ecr:GetDownloadUrlForLayer'
        ],
        resources: [`${props.ecsCluster.clusterArn}`],
    }));

    return project;
};