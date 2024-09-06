import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs'; // Add this import for logging
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as path from 'path';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'FargateService-16', {
  env: { account: '831926628088', region: 'us-east-1' }
});

// Create VPC
const vpc = new ec2.Vpc(stack, 'VPC', {
  maxAzs: 3,
  natGateways: 3, 
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24, //IPs in Range - 256
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, 
      cidrMask: 24, //IPs in Range - 256
    }
  ]
});

// Create Security Group for the ALB
const albSecurityGroup = new ec2.SecurityGroup(stack, 'ALBSecurityGroup', {
  vpc,
  allowAllOutbound: true,
  description: 'Security group for ALB',
});

// Allow inbound HTTP and HTTPS traffic from anywhere (ports 80, 8080, 443)
albSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcpRange(80, 8080),
  'Allow inbound HTTP traffic on ports 80 and 8080'
);

albSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(443),
  'Allow inbound HTTPS traffic on port 443'
);

// Create Security Group for ECS Tasks
const ecsTaskSecurityGroup = new ec2.SecurityGroup(stack, 'ECSTaskSecurityGroup', {
  vpc,
  allowAllOutbound: true,
  description: 'Security group for ECS tasks',
});

// Allow inbound traffic from the ALB to ECS tasks on port 8080
ecsTaskSecurityGroup.addIngressRule(
  albSecurityGroup,
  ec2.Port.tcp(8080),
  'Allow inbound traffic from ALB on port 8080'
);

// Allow all outbound traffic from ECS tasks
ecsTaskSecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.allTraffic(),
  'Allow all outbound traffic'
);

// Create Load Balancer and associate it with the ALB security group
const alb = new elbv2.ApplicationLoadBalancer(stack, 'ApplicationLoadBalancer', {
  vpc: vpc,
  internetFacing: true,
  ipAddressType: elbv2.IpAddressType.IPV4,
  securityGroup: albSecurityGroup,  // Associate the ALB with the new security group
});

// Create Fargate Cluster
const cluster = new ecs.Cluster(stack, 'ECSCluster', {
  containerInsights: true,
  vpc,
});

// Create IAM Role for Task Execution with additional ECR permissions
const taskExecutionRole = new iam.Role(stack, 'TaskExecutionRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'), // Required for ECS to pull from ECR and log to CloudWatch
  ],
  inlinePolicies: {
    ecrPermissions: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:GetDownloadUrlForLayer',
            "ecr:BatchCheckLayerAvailability",
            'ecr:BatchGetImage',
            'ecr:CompleteLayerUpload',
            'ecr:UploadLayerPart',
            'ecr:InitiateLayerUpload',
            'ecr:PutImage',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],  // You can scope this to specific ECR repositories or logs if needed
        }),
      ],
    }),
  },
});

// Create IAM Roles with Necessary Policies
const taskRole = new iam.Role(stack, 'TaskRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  inlinePolicies: {
    taskPolicy: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],  
          actions: [
            's3:GetObject',
            's3:PutObject',
            'dynamodb:Query',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            "ecr:getauthorizationtoken",
            "ecr:batchchecklayeravailability",
            "ecr:getdownloadurlforlayer",
            "ecr:batchgetimage",
            "logs:createlogstream",
            "logs:putlogevents"
          ],
        }),
      ],
    }),
  },
});

// Create ECS Task Definition
const fargateTaskDefinition = new ecs.FargateTaskDefinition(stack, 'FargateTaskDefinition', {
  family: 'CDK-fargateTaskDefinition',
  memoryLimitMiB: 512,
  cpu: 256,
  executionRole: taskExecutionRole,  // The task execution role
  taskRole: taskRole,  // The task role
});

// To enable better logging in CloudWatch, you can define a log group and use it for the container:
const logGroup = new logs.LogGroup(stack, 'LogGroup', {
  logGroupName: 'ecs-task-log-group-87', // Name of log group, might need to be updated when deploying
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: cdk.RemovalPolicy.DESTROY,  // This will delete the log group when the stack is destroyed
});

// Add Container to Task Definition with Health Check
const fargateContainer = fargateTaskDefinition.addContainer('FargateContainer', {
  image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),// Optional: Use an existing image 
  // image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../local-image')),
  logging: ecs.LogDriver.awsLogs({
    streamPrefix: 'ecs-task',
    logGroup: logGroup
  }),
  portMappings: [
    {
      containerPort: 8080,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP
    }
  ],
  environment: {
    FAVORITE_DESSERT: 'CHEESECAKE',
  },
});

// Create Fargate Service
const service = new ecs.FargateService(stack, 'FargateEcsService', {
  cluster: cluster,
  taskDefinition: fargateTaskDefinition,
  platformVersion: ecs.FargatePlatformVersion.LATEST,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  },
  assignPublicIp: false,  // Disable public IP for private subnets
});

// S3 Bucket for logs
const logBucket = new s3.Bucket(stack, 'LogBucket', {
  bucketName: generateBucketName(stack),
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  versioned: true,
});

// S3 Bucket name generator
function generateBucketName(stack: cdk.Stack): string {
  const prefix = 'WolfMan';
  const region = stack.region.toLowerCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const wildcard = Math.random().toString(36).substring(2, 8);
  let bucketName = `${prefix}-${wildcard}-${region}-${date}`;
  bucketName = bucketName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  bucketName = bucketName.replace(/^-+|-+$/g, '');
  return bucketName;
}

// Enable Access Logging for ALB
alb.logAccessLogs(logBucket, 'alb-logs');

app.synth();

