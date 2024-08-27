import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as path from 'path';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'EMD-FargateService15',
 // { env: { account: AWS_ACCOUNT, region: AWS_REGION }}
);


// Create VPC
const vpc = new ec2.Vpc(stack, 'VPC', {
  maxAzs: 2,
  natGateways: 1,  // Added 1 NAT Gateway for outbound internet access from private subnets
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,  // Private subnet with NAT Gateway for outbound traffic
    }
  ]
});

// Create VPC
// const vpc = new ec2.Vpc(stack, 'VPC', {
//   maxAzs: 2,
//   natGateways: 0,
// });

// Create Load Balancer
const alb = new elbv2.ApplicationLoadBalancer(stack, 'EMD-ApplicationLoadBalancer', {
  vpc: vpc,
  internetFacing: true,
  ipAddressType: elbv2.IpAddressType.IPV4,
});

// Create Fargate Cluster
const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });

// Create ECS Task Definition Template
const fargateTaskDefinition = new ecs.FargateTaskDefinition(stack, `EMD-FargateTaskDefinition`, {
  family: `EMD-CDK-fargateTaskDefinition`,
  cpu: 512,
  memoryLimitMiB: 1024,
});

// Create AWS Fargate Container
const fargateContainer = new ecs.ContainerDefinition(stack, `EMD-FargateContainer`, {
  taskDefinition: fargateTaskDefinition,
  containerName: 'EMD-FargateContainer',
  image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../local-image')),
  portMappings: [
      {
          containerPort: 8080,
          hostPort: 8080, // Option 1: Make it the same as containerPort
          protocol: ecs.Protocol.TCP
      }
      // Or use:
      // {
      //     containerPort: 8080,
      //     protocol: ecs.Protocol.TCP
      // }
  ],
  environment: {
      EMD_VAR: 'option 1',
  },
  logging: new ecs.AwsLogDriver({ streamPrefix: "infra" })
});

// // Create Security Group firewall settings
const ec2SecurityGroup = new ec2.SecurityGroup(stack, 'EMD-EC2SecurityGroup', {
  vpc,
  allowAllOutbound: true,
});

// Allow HTTP traffic from the load balancer
ec2SecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(80),
  'Allow All HTTP traffic'
);

// Allow HTTP traffic only from the load balancer security group
const lbSecurityGroup = alb.connections.securityGroups[0];  // Assuming you are using the first security group of the ALB

ec2SecurityGroup.addIngressRule(
  lbSecurityGroup,  // Restrict traffic to only come from the load balancer
  ec2.Port.tcp(80),
  'Allow HTTP traffic from Load Balancer only'
);

// const service = new ecs.FargateService(stack, `EMD-ecs-service`, {
//   assignPublicIp: true,
//   cluster: cluster,
//   taskDefinition: fargateTaskDefinition,
//   platformVersion: ecs.FargatePlatformVersion.LATEST,
//   vpcSubnets: {
//       subnets: [
//           vpc.publicSubnets[0],
//           vpc.publicSubnets[1],
//       ]
//   },
//   securityGroups: [ec2SecurityGroup]
// });

// Updated Security Group Configuration:
const service = new ecs.FargateService(stack, `EMD-ecs-service`, {
  assignPublicIp: false,  // No public IP as tasks are in private subnets
  cluster: cluster,
  taskDefinition: fargateTaskDefinition,
  platformVersion: ecs.FargatePlatformVersion.LATEST,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED  // Use private subnets for ECS tasks (PRIVATE_WITH_NAT deprecated)
  },
  securityGroups: [ec2SecurityGroup]
});


// Add HTTP Listener
const httpListener = alb.addListener(`EMD-HTTPListner`, {
  port: 80,
  protocol: ApplicationProtocol.HTTP
});

// Add listener target 
httpListener.addTargets('EMD-ECS', {
  protocol: ApplicationProtocol.HTTP,
  targets: [service.loadBalancerTarget({
    containerName: 'EMD-FargateContainer'
  })],

});

// function generateBucketName(stack: cdk.Stack) : string {
//   const environmentType = 'Development';
//   const region = stack.region.toUpperCase();
//   const timestamp = new Date().toISOString();
//   return `${environmentType}-${region}-${timestamp}`;
// }

//  few adjustments to comply with AWS naming conventions. Here's how you can modify the function and integrate it with your S3 bucket setup
function generateBucketName(stack: cdk.Stack): string {
  const environmentType = 'development'; // AWS bucket names must be lowercase
  const region = stack.region.toLowerCase(); // AWS bucket names must be lowercase
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Use only the date part
  let bucketName = `${environmentType}-${region}-${date}`;

  // Ensure the name is compliant with AWS rules (lowercase, no special characters except hyphen)
  bucketName = bucketName.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Ensure the bucket name does not start or end with a hyphen
  bucketName = bucketName.replace(/^-+|-+$/g, '');
  return bucketName;
}


const logBucket = new s3.Bucket(stack, 'LogBucket', {
  bucketName: generateBucketName(stack),
  removalPolicy: cdk.RemovalPolicy.DESTROY, // Adjust this based on your retention policy
  autoDeleteObjects: true, // Be cautious with this setting in production
  versioned: true,
});
