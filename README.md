
# DevOps Mini-Project

Welcome to the DevOps (CDK) Mini-Project! This challenge is crafted to assess your proficiency in AWS Networking, AWS CDK, Docker, TypeScript, and Python through practical, hands-on tasks. Below is a detailed guide to help you understand the expectations for your project submission.

## Project Overview

Initially crafted in haste to validate concepts, the application’s infrastructure was made directly accessible from the internet, which was suitable for a prototype. Your task is to enhance the security and infrastructure setup of this web application to ensure it is only accessible via a load balancer. This project will challenge your skills in:

- AWS Networking
- AWS CDK
- Docker
- TypeScript
- Python

## Preparation

Before starting the project, ensure you have the following:

- An active AWS account.
- AWS CDK for TypeScript installed.
- AWS CDK prerequisites installed.

### Install TypeScript

1. Install TypeScript globally:

   ```bash
   npm install -g typescript
   ```

2. Test the installation by running:

   ```bash
   tsc -v
   ```

### Install AWS CDK Toolkit

1. Install the AWS CDK Toolkit (the `cdk` command):

   ```bash
   npm install -g aws-cdk
   ```

2. Test the installation by running:

   ```bash
   cdk --version
   ```

### Configure AWS Credentials

1. Set up your AWS credentials by running:

   ```bash
   aws configure
   ```

2. Enter your Access Key ID and press Enter.
3. Enter your Secret Access Key and press Enter.

### Initialize the App

1. Initialize the app using the `cdk init` command:

   ```bash
   cdk init app --language typescript
   ```

   The `cdk init` command creates a number of files and folders inside the `test-project` directory.

   > **Note:** Each AWS CDK app should be in its own directory, with its own local module dependencies.

## Existing AWS CDK Infrastructure Resources

The project comes with the following pre-configured AWS resources:

- VPC
- Load Balancer
- AWS Fargate Service
- Docker container
- S3 bucket

## Tasks to Complete

### 1. Container Communication

**Goal:** Standardize internal and external port settings for a Dockerized application.

**Challenge:** Modify the Dockerfile and ECS task definition to expose and map the correct ports. Ensure the ECS service references these port settings accurately.

**Steps:**

- **Dockerfile:** Use `EXPOSE` to define the internal port (e.g., `8080`).
- **ECS Task Definition:** Map the internal port to the external port using `portMappings` (e.g., `8080 -> 80`).
- **ECS Service:** Ensure the service routes traffic correctly, using load balancers and target groups if necessary.

### 2. Network Security

**Goal:** Restructure the AWS network to secure the application within a private subnet.

**Challenge:** Modify the VPC to utilize private subnets for the ECS tasks. Configure the routing table to use a NAT Gateway for outbound traffic and update the security groups to limit inbound traffic solely to the load balancer.

**Steps:**

1. **Modify the VPC to Use Private Subnets for ECS Tasks:**

   - Create private subnets across different availability zones to ensure high availability.
   - Ensure the subnets are marked as private by not associating them with an Internet Gateway.
   - When launching ECS tasks, specify the private subnets you’ve created.

2. **Configure the Routing Table for Outbound Traffic:**

   - Deploy a NAT Gateway in a public subnet.
   - Update the routing table associated with the private subnets to route all outbound traffic to the NAT Gateway.

3. **Update Security Groups to Restrict Inbound Traffic:**

   - **Load Balancer Security Group:** Allow inbound traffic only on necessary ports (e.g., port 80 for HTTP, port 443 for HTTPS).
   - **ECS Tasks Security Group:** Only allow inbound traffic from the load balancer’s security group.

4. **Review and Test:**

   - Deploy the updated ECS tasks within the private subnets and ensure they are functioning correctly.
   - Verify that the load balancer can successfully route traffic to the ECS tasks.
   - Use AWS CloudWatch and VPC Flow Logs to monitor traffic.

### 3. Environment Configuration

**Goal:** Implement and display a specified environment variable within the application.

**Challenge:** Add the `FAVORITE_DESSERT` environment variable to the Fargate task definition. Modify the application to display this variable correctly, ensuring it reads and shows the variable as intended.

### 4. Logging and Setup

**Goal:** Establish and configure an S3 bucket for logging, ensuring the bucket name is dynamically generated and complies with AWS standards.

**Challenge:** Develop a function to generate a compliant bucket name containing environment, region, and date. Ensure the name adheres to AWS naming rules, which demand lowercase letters and prohibit special characters and certain starting or ending characters.

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

### 5. Useful Commands

- `npm run build`: Compile TypeScript to JavaScript.
- `npm run watch`: Watch for changes and compile automatically.
- `npx cdk deploy`: Deploy this stack to your default AWS account/region.
- `npx cdk diff`: Compare the deployed stack with the current state.
- `npx cdk synth`: Emit the synthesized CloudFormation template.
- `npm run test` or `tsc && npm test`: Run your tests and expect the following output:

  Example Output:

  ```
  PASS  test/infra.test.ts (12.553 s)
  ✓ SQS Queue Created (368 ms)
  Test Suites: 1 passed, 1 total
  Tests:       1 passed, 1 total
  Snapshots:   0 total
  Time:        12.824 s
  Ran all test suites.
  ```

## Conclusion

With this guide, you should be well-prepared to complete the DevOps Mini-Project. Refer back to this README as needed.

