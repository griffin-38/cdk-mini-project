# DevOps Mini-Project

Welcome to the DevOps(CDK) Mini-Project! This challenge is designed to test your skills in AWS Networking, AWS CDK, Docker, TypeScript, and Python through practical, hands-on tasks. Below, you will find a comprehensive guide to help you understand what is expected in your project submission.

## Project Overview

Initially crafted in haste to validate concepts, the application’s infrastructure was made directly accessible from the internet, which was suitable for a prototype. Your task is to enhance the security and infrastructure setup of this web application to ensure it is only accessible via a load balancer. This project will challenge your skills in:

- AWS Networking
- AWS CDK
- Docker
- TypeScript
- Python

## Preparation

Before starting the project, make sure you have:

- An active AWS account
- AWS CDK for TypeScript installed

#### AWS CDK prerequisites
***Install typescript***
- ```npm install -g typescript```
- Test the installation by issuing tsc -v

***AWS CDK Toolkit, install the AWS CDK Toolkit (the cdk command)***
 - ```npm install -g aws-cdk```
 - Test the installation by issuing ```cdk --version```

***AWS credentials write following command in terminal***
 - ```aws configure```
 - Enter your Access Key Id and press enter
 - Now, Enter your Secret Access Key and press enter

***Now initialize the app by using the cdk init command***
- The cdk init command creates a number of files and folders inside the test-project directory
- NOTE: Each AWS CDK app should be in its own directory, with its own local module dependencies
- ```cdk init app --language typescript```

### Existing AWS CDK Infrastructure Resources

The project comes with the following pre-configured AWS resources:

- VPC
- Load Balancer
- AWS Fargate Service
- Docker container
- S3 bucket

# Tasks to Complete

## 1. Container Communication

**Standardize internal and external port settings for a Dockerized application.**

**Challenge:** Modify the Dockerfile and ECS task definition to expose and map the correct ports. Ensure the ECS service references these port settings accurately.

#### Summary
* Dockerfile: Use EXPOSE to define the internal port (e.g., 8080).
* ECS Task Definition: Map the internal port to the external port using portMappings (e.g., 8080 -> 80).
* ECS Service: Ensure the service routes traffic correctly, using load balancers and target groups if necessary.
By following these steps, you can standardize the internal and external port settings for your Dockerized application.

## 2. Network Security

**Restructure the AWS network to secure the application within a private subnet.**

- **Challenge:** Modify the VPC to utilize private subnets for the ECS tasks. Configure the routing table to use a NAT Gateway for outbound traffic and update the security groups to limit inbound traffic solely to the load balancer.

#### Step 1: Modify the VPC to Use Private Subnets for ECS Tasks

1. **Create Private Subnets**:
   - In your existing VPC, create private subnets across different availability zones to ensure high availability.
   - Ensure the subnets are marked as private by not associating them with an Internet Gateway.

2. **Update ECS Cluster Configuration**:
   - When launching ECS tasks, specify the private subnets you’ve created.
   - Make sure to use the private subnet IDs in the ECS service or task definition.

#### Step 2: Configure the Routing Table for Outbound Traffic

1. **Create a NAT Gateway**:
   - Deploy a NAT Gateway in a public subnet. This allows the instances in the private subnets to send outbound traffic (e.g., updates, patches) to the internet while preventing inbound traffic from the internet.

2. **Modify the Private Subnets' Routing Tables**:
   - Update the routing table associated with the private subnets to route all outbound traffic to the NAT Gateway.
   - Example routing table entry:
     ```bash
     Destination: 0.0.0.0/0
     Target: NAT Gateway ID

#### Step 3: Update Security Groups to Restrict Inbound Traffic

1. **Load Balancer Security Group**:
   - Ensure the load balancer’s security group allows inbound traffic only on the necessary ports (e.g., port 80 for HTTP, port 443 for HTTPS).
   - Restrict the inbound rules to allow traffic from the public internet.

2. **ECS Tasks Security Group**:
   - Assign a security group to the ECS tasks that only allows inbound traffic from the load balancer’s security group.
   - Example inbound rule:
     ```bash
     Type: Custom TCP Rule
     Protocol: TCP
     Port Range: 8080 (or the port your application listens on)
     Source: Load Balancer Security Group
     ```
3. **NAT Gateway Security Group**:
   - Ensure the NAT Gateway is associated with a security group that allows outbound traffic to the internet but restricts inbound traffic.

#### Step 4: Review and Test
1. **Deploy the Changes**:
   - Deploy the updated ECS tasks within the private subnets and ensure they are functioning correctly.
   - Ensure that the ECS tasks can still reach the internet for necessary updates via the NAT Gateway.

2. **Test Connectivity**:
   - Verify that the load balancer can successfully route traffic to the ECS tasks.
   - Test that no direct inbound traffic reaches the ECS tasks without going through the load balancer.

3. **Monitor and Audit**:
   - Use AWS CloudWatch and VPC Flow Logs to monitor traffic and ensure that the security configurations are functioning as intended.

#### Summary

- **Private Subnets:** Isolate ECS tasks within private subnets.
- **NAT Gateway:** Enable outbound traffic from private subnets while blocking inbound traffic.
- **Security Groups:** Limit inbound traffic to ECS tasks by only allowing connections from the load balancer, ensuring secure communication within your AWS network.

This setup enhances the security of your application by restricting direct internet access to your ECS tasks while still allowing necessary outbound communication.

## 3. Environment Configuration
**Implement and display a specified environment variable within the application.**

- **Challenge:** Add the `FAVORITE_DESSERT` environment variable to the Fargate task definition. Modify the application to display this variable correctly, ensuring it reads and shows the variable as intended.

## 4. Logging and Setup
**Establish and configure an S3 bucket for logging, ensuring the bucket name is dynamically generated and complies with AWS standards.**

- **Challenge:** 
  - Develop a function to generate a compliant bucket name containing environment, region, and date. Ensure the name adheres to AWS naming rules, which demand lowercase letters and prohibit special characters and certain starting or ending characters.
  - Configure the ALB to enable logging to this new bucket, ensuring proper permissions and settings are in place.

**Example Implementation:**
```typescript
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

```
## 5. Useful Commands
* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
 * `npm run test`    perform the jest unit tests OR
* `tsc && npm test` use this to run your test and you should get the following

**Example Output:**
```
- `PASS`  test/infra.test.ts (12.553 s)
- `✓ SQS Queue Created (368 ms)`
- `Test Suites:` 1 passed, 1 total
- `Tests:`       1 passed, 1 total
- `Snapshots:`   0 total
- `Time:`       12.824 s
- `Ran all test suites.`
```