import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

// Define the app
const app = new cdk.App();

// Fetching values from context or environment variables
const logGroupName = process.env.LOG_GROUP_NAME || app.node.tryGetContext('logGroupName') || 'ecs-task-logs';
const stackName = process.env.STACK_NAME || app.node.tryGetContext('stackName') || 'FargateService-1';

// Create a stack
const stack = new cdk.Stack(app, `${stackName}`, {
  env: { account: '831926628088', region: 'us-east-1' }
});

// Create VPC with Public and Private subnets
const vpc = new ec2.Vpc(stack, 'VPC', {
  maxAzs: 2,  // Two availability zones for better redundancy
  natGateways: 2, 
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, 
      cidrMask: 24,
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

// Create Load Balancer (public-facing) and associate it with the ALB security group
const alb = new elbv2.ApplicationLoadBalancer(stack, 'ApplicationLoadBalancer', {
  vpc: vpc,
  internetFacing: true,
  ipAddressType: elbv2.IpAddressType.IPV4,
  securityGroup: albSecurityGroup,
});

// Create ECS Cluster
const cluster = new ecs.Cluster(stack, 'ECSCluster', {
  vpc,
  containerInsights: true,
});

// IAM Role for Task Execution with ECR permissions and logging
const taskExecutionRole = new iam.Role(stack, 'TaskExecutionRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  inlinePolicies: {
    ecrPermissions: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage",
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
      ],
    }),
  },
});

// IAM Role for the ECS Task with necessary log permissions
const taskRole = new iam.Role(stack, 'TaskRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  inlinePolicies: {
    taskPolicy: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
      ],
    }),
  },
});

// Create ECS Task Definition
const fargateTaskDefinition = new ecs.FargateTaskDefinition(stack, 'FargateTaskDefinition', {
  family: 'CDK-FargateTaskDefinition',
  memoryLimitMiB: 512,
  cpu: 256,
  executionRole: taskExecutionRole,
  taskRole: taskRole,
});

// Create Log Group for ECS Task
const logGroup = new logs.LogGroup(stack, 'TaskLogGroup', {
  logGroupName: logGroupName,
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// Add Container to ECS Task Definition
fargateTaskDefinition.addContainer('FargateContainer', {
  // image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../local-image')), // Local Docker Image
  image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"), 
  containerName: 'FargateContainer',
  logging: ecs.LogDriver.awsLogs({
    streamPrefix: 'ecs-task',
    logGroup: logGroup,
  }),
  portMappings: [
    {
      hostPort: 8080,
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    }
  ],
  environment: {
    FAVORITE_DESSERT: 'CHEESECAKE',  // Environment variable for the task
  },
  healthCheck: {
    // command: ["CMD-SHELL", "curl -f http://localhost:80/health || exit 1"],  // Update port here as needed 
    command: ["CMD-SHELL", "exit 0"], 
    interval: cdk.Duration.minutes(1),
    timeout: cdk.Duration.seconds(10),
    retries: 3,
    startPeriod: cdk.Duration.seconds(240),
  },
});

// Create Fargate Service in Private Subnet
const fargateService = new ecs.FargateService(stack, 'FargateService', {
  cluster: cluster,
  taskDefinition: fargateTaskDefinition,
  platformVersion: ecs.FargatePlatformVersion.LATEST,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  assignPublicIp: false,  // No public IP as it resides in private subnet
  securityGroups: [ecsTaskSecurityGroup],
});

// // Create Target Group for ALB
// const targetGroup = new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
//   vpc: vpc,
//   port: 80,
//   protocol: elbv2.ApplicationProtocol.HTTP,
//   targets: [fargateService],
//   healthCheck: { path: '/health' },
// });

// // Add Listener to ALB on Port 80
// alb.addListener('HTTPListener', {
//   port: 80,
//   open: true,
//   protocol: elbv2.ApplicationProtocol.HTTP,
//   defaultTargetGroups: [targetGroup],
// });

// // Add listener target (ECS service listening on port 8080)
// httpListener.addTargets('ECS', {
//   port: 8080,
//   protocol: elbv2.ApplicationProtocol.HTTP,
//   targets: [service.loadBalancerTarget({
//     containerName: 'FargateContainer',
//     containerPort: 8080
//   })],
//   healthCheck: {
//     path: "/health",
//     interval: cdk.Duration.minutes(1),
//     timeout: cdk.Duration.seconds(10),
//   }
// });

// Create S3 Bucket for logs
const logBucket = new s3.Bucket(stack, 'LogBucket', {
  bucketName: generateBucketName(stack),
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  versioned: true,
});

// Function to generate unique bucket name for S3
function generateBucketName(stack: cdk.Stack): string {
  const prefix = 'wolfman';
  const region = stack.region.toLowerCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const wildcard = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${wildcard}-${region}-${date}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
};

// Enable Access Logging for ALB
alb.logAccessLogs(logBucket, 'alb-logs');

// Synthesize the stack
app.synth();

