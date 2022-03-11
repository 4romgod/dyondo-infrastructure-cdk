import { Stack, StackProps, App, SecretValue } from 'aws-cdk-lib';
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { GitHubSourceAction, GitHubTrigger, CodeBuildAction, CloudFormationCreateUpdateStackAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { APP_NAME } from '../constants';

export interface DyondoPipelineStackProps extends StackProps {
    readonly githubToken: string;
    readonly githubRepoOwner: string;   // 4romgod
    readonly githubDyondoApiRepo: string;   // dyondo-api
    readonly githubDyondoCdkRepo: string;   // dyondo-infrastructure-cdk
};

export class DyondoPipelineStack extends Stack {
    constructor(scope: App, id: string, props: DyondoPipelineStackProps) {
        super(scope, id, props);

        // Artifacts
        const cdkSourceOutput = new Artifact("SrcOutput");
        const cdkBuildOutput = new Artifact('CdkBuildOutput');
        const dyondoApiSourceOutput = new Artifact("SrcOutput");
        const dyondoApiBuildOutput = new Artifact('DyondoApiBuildOutput');

        // Actions
        const cdkSourceAction = new GitHubSourceAction({
            actionName: 'CheckoutCdkRepo',
            output: cdkSourceOutput,
            owner: props.githubRepoOwner,
            repo: props.githubDyondoCdkRepo,
            branch: "master",
            oauthToken: SecretValue.plainText(props.githubToken),
            trigger: GitHubTrigger.WEBHOOK,
        });

        const cdkBuildAction = new CodeBuildAction({
            actionName: 'CDK_Build',
            project: buildCdkRepo(this),
            input: cdkSourceOutput,
            outputs: [cdkBuildOutput],
        });

        const dyondoApiSourceAction = new GitHubSourceAction({
            actionName: `Checkout${APP_NAME}ApiRepo`,
            output: dyondoApiSourceOutput,
            owner: props.githubRepoOwner,
            repo: props.githubDyondoApiRepo,
            branch: "master",
            oauthToken: SecretValue.plainText(props.githubToken),
            trigger: GitHubTrigger.WEBHOOK,
        });
        
        const dyondoApiBuildAction = new CodeBuildAction({
            actionName: `${APP_NAME}ApiBuild`,
            project: buildApiRepo(this),
            input: dyondoApiSourceOutput,
            outputs: [dyondoApiBuildOutput],
        });

        const deployAction = new CloudFormationCreateUpdateStackAction({
            actionName: 'Dyondo_CFN_Deploy',
            templatePath: cdkBuildOutput.atPath('BlogApiEcsStack.template.json'),
            stackName: 'BlogApiEcsStack',
            adminPermissions: true,
            extraInputs: [dyondoApiBuildOutput],
        });

        new Pipeline(this, `${APP_NAME}PipelineId`, {
            pipelineName: `${APP_NAME}Pipeline`,
            crossAccountKeys: false,
            stages: [
                {
                    stageName: 'Source',
                    actions: [ cdkSourceAction, dyondoApiSourceAction ]
                },
                {
                    stageName: 'Build',
                    actions: [ cdkBuildAction,dyondoApiBuildAction ]
                },
                {
                    stageName: 'Deploy',
                    actions: [ deployAction ]
                }
            ]
        });
    }
}

const buildApiRepo = (stack: Stack) => {
    return new PipelineProject(stack, "LambdaBuild", {
        buildSpec: BuildSpec.fromObject({
            version: "0.2",
            phases: {
                install: {
                    commands: [
                        'cd lambda',
                        "npm i"
                    ]
                },
                build: {
                    commands: "npm run build"
                }
            },
            artifacts: {
                "base-directory": "lambda",
                files: [
                    "build/**/*",
                    "node_modules/**/*",
                    "@types"
                ]
            }
        }),
        environment: {
            buildImage: LinuxBuildImage.STANDARD_4_0
        }
    });
};

const buildCdkRepo = (stack: Stack) => {
    return new PipelineProject(stack, 'CdkBuild', {
        buildSpec: BuildSpec.fromObject({
            version: '0.2',
            phases: {
                install: {
                    commands: [
                        'npm install'
                    ],
                },
                build: {
                    commands: [
                        'npm run build',
                        'npm run cdk synth -- -o dist'
                    ],
                },
            },
            artifacts: {
                'base-directory': 'dist',
                files: [
                    'LambdaStack.template.json',
                ],
            },
        }),
        environment: {
            buildImage: LinuxBuildImage.STANDARD_4_0,
        },
    });
};