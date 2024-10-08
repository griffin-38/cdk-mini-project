
# Infrastructure Mini-Project
Welcome to the Infrastructure Mini-Project Mini-Project to create an AWS Fargate service using the AWS CDK! This challenge is designed to help you learn and enhance your skills in AWS Networking, AWS CDK, Docker, TypeScript, and Python through practical, hands-on tasks. This project serves as an opportunity to grow your understanding of key DevOps/Infra concepts and technologies by working through real-world scenarios.

## Project Overview
Originally developed as a quick prototype to validate concepts, the application's infrastructure was directly accessible from the internet. Your challenge is to improve the security and infrastructure setup so that the application is only accessible via a load balancer. This hands-on project will guide you through learning how to:

- AWS Networking
- AWS CDK
- Docker
- TypeScript
- Python

## Preparation
Before you begin, make sure you have the following:

- An active AWS account
- AWS CDK for TypeScript installed
- AWS CDK prerequisites installed

This project is a learning journey, so take your time exploring the technologies, experimenting with solutions, and enhancing your skills as you go!

## Install Docker

1. Install the `Docker`

```bash
   npm install -g docker
 ```
2. Validate install and version

```bash
  npm docker -v
```
### Install TypeScript

1. Install `TypeScript` globally:

```bash
  npm install -g typescript
```

2. Test the installation by running:

```bash
   tsc -v
```

### Install AWS CDK Toolkit

1. Install the `AWS CDK Toolkit` (the `cdk` command):

```bash
   npm install -g aws-cdk
```

2. Test the installation by running:

```bash
   cdk --version
```

### Configure AWS Credentials

1. Set up your `AWS Credentials` by running:

```bash
   aws configure
 ```

2. Enter your `Access Key ID` and press Enter.
3. Enter your `Secret Access Key` and press Enter.


### Initialize the App

1. Initialize the app using the `cdk init` command:

```bash
   cdk init app --language typescript
```

- The `cdk init` command creates a number of files and folders inside the `{project}` directory.
- Each AWS CDK app should be in its own directory, with its own local module dependencies.

<span style="color:red"> Troubleshooting</span>: If the `cdk init` command does not run then you need to make sure you have the rifght version of Node installed. Steps noted in the next section.

### Node 18.0+ 

1. Verify version
```bash
   $ node -v 
```
2. List available installed versions.
```bash
  $ nvm ls v10
```
3. Install a target Node - `Node 18.0` or higher installed. 
```bash
  $ nvm install 18.7
 ```
4. Select the installed version.
```bash
  $ nvm use 18 Now using node v18.7.0 (npm v6.14.8)
```
5. Check that your target Node. js version works (`v18.7.0` & `6.14.8`).  
```bash
  $ node -v && $ npm -v
```

## Existing AWS CDK Infrastructure Resources

The project comes with the following pre-configured AWS resources:

- VPC
- Load Balancer
- AWS Fargate Service
- Docker container
- S3 bucket

# Tasks to Complete


## 1. Container Communication

**Goal:** Standardize internal and external port settings for a Dockerized application.

**Challenge:** Modify the Dockerfile and ECS task definition to expose and map the correct ports. Ensure the ECS service references these port settings accurately.

**Steps:**

- **Dockerfile:** Use `EXPOSE` to define the internal port.
- **ECS Task Definition:** Map the internal port to the external port using `portMappings`.
- **ECS Service:** Ensure the service routes traffic correctly, using load balancers and target groups if necessary.

## 2. Network Security

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

## 3. Environment Configuration

**Goal:** Implement and display a specified environment variable within the application.

**Challenge:** Add the `FAVORITE_DESSERT` environment variable to the Fargate task definition. Modify the application to display this variable correctly, ensuring it reads and shows the variable as intended.

## 4. Logging and Setup

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

## 5. Useful Commands (Build, Deploy, and Test)

- `npm run build`: Compile TypeScript to JavaScript.
- `npm run watch`: Watch for changes and compile automatically.
- `npx cdk deploy` OR `cdk deploy`: Deploy this stack to your default AWS account/region. After you have deployed, you should see changes reflected in `AWS Console`.
- `npx cdk diff` OR `cdk diff`: Compare the deployed stack with the current state.
- `npx cdk synth` OR `cdk synth`: Emit the synthesized CloudFormation template.
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

## Design Choices
This section explains the significant design decisions made during the implementation of the project. These choices were made to ensure the project aligns with best practices, security considerations, and overall project goals.

1. **AWS CDK for Infrastructure as Code:**
   - **Choice:** The project uses AWS Cloud Development Kit (CDK) for managing and provisioning AWS resources.
   - **Reason:** AWS CDK allows for infrastructure as code using familiar programming languages like TypeScript. This approach provides flexibility, scalability, and better version control compared to manual or template-based resource provisioning.

2. **VPC and Networking Configuration:**
   - **Choice:** A Virtual Private Cloud (VPC) was created to isolate the resources and control the network traffic.
   - **Reason:** Using a VPC enhances security by allowing resources to communicate in a private network, reducing exposure to the public internet. Subnets, route tables, and security groups were configured to ensure that only necessary traffic is allowed.

3. **Load Balancer Setup:**
   - **Choice:** An Application Load Balancer (ALB) was used to distribute traffic to the application.
   - **Reason:** The ALB ensures that the application can handle increased traffic by distributing requests across multiple instances, improving availability and fault tolerance. Additionally, it provides a single entry point, allowing better control over incoming requests.

4. **S3 Bucket Configuration:**
   - **Choice:** S3 buckets were configured with specific naming conventions, versioning, and lifecycle policies.
   - **Reason:** The naming convention ensures compliance with AWS rules and provides a consistent and predictable bucket structure. Versioning is enabled to maintain data integrity, and lifecycle policies manage storage costs by transitioning older versions to cheaper storage classes or deleting them when no longer needed.

5. **Security Best Practices:**
   - **Choice:** Security groups and IAM roles/policies were carefully defined to limit access to only what is necessary.
   - **Reason:** Following the principle of least privilege, only essential permissions were granted to resources and users. This reduces the risk of unauthorized access or accidental exposure of sensitive data.

6. **Docker for Containerization:**
   - **Choice:** Docker was used to containerize the application for consistent deployment across different environments.
   - **Reason:** Containerization ensures that the application runs consistently regardless of the environment, reducing the "it works on my machine" problem. Docker also simplifies dependency management and enhances portability.

7. **TypeScript for AWS CDK:**
   - **Choice:** TypeScript was chosen as the programming language for AWS CDK scripts.
   - **Reason:** TypeScript offers static typing, which reduces runtime errors and enhances code quality. Its compatibility with JavaScript allows for a smooth transition for developers familiar with the JavaScript ecosystem.

8. **Automated Testing and Deployment:**
   - **Choice:** Scripts for automated testing (`npm run test`) and deployment (`npx cdk deploy`) were included.
   - **Reason:** Automation improves reliability and efficiency by ensuring that tests are run and deployments are executed consistently. It also reduces manual intervention, minimizing the risk of human error.

These design choices were made to balance security, scalability, and ease of management while adhering to AWS best practices. They contribute to the overall robustness and reliability of the project.


## Innovative Approaches and Problem-Solving
This project incorporates several innovative approaches to address challenges and optimize the infrastructure setup:

1. **Dynamic S3 Bucket Naming Convention:**
   - **Innovation:** The implementation of a custom bucket naming convention that dynamically generates names based on the environment, region, and date. This ensures uniqueness and compliance with AWS naming rules while maintaining a clear and organized structure.
   - **Problem Solved:** This approach eliminates naming conflicts and provides a systematic way to manage S3 buckets across different environments and regions.

2. **Security-First Networking Configuration:**
   - **Innovation:** A focus on security by isolating resources within a VPC and using restrictive security groups and IAM policies. This setup minimizes exposure to the public internet and follows the principle of least privilege.
   - **Problem Solved:** This configuration significantly reduces the attack surface, ensuring that only necessary traffic can reach the application, thus enhancing the overall security posture of the deployment.

3. **Automated Infrastructure Testing:**
   - **Innovation:** The inclusion of automated testing scripts that validate the infrastructure setup before deployment. This includes checks for S3 bucket creation, security group rules, and other critical components.
   - **Problem Solved:** Automated testing ensures that infrastructure changes do not introduce errors or vulnerabilities, allowing for safer and more reliable deployments.

4. **Efficient Containerization with Docker:**
   - **Innovation:** Utilizing Docker to containerize the application, ensuring consistent environments across development, staging, and production.
   - **Problem Solved:** This approach addresses the common "it works on my machine" problem, providing a reproducible and portable deployment environment that behaves consistently regardless of the underlying infrastructure.

These innovative solutions demonstrate a strong focus on security, reliability, and efficient problem-solving, making the infrastructure setup both robust and adaptable to changing requirements.


## Troubleshooting

### Validation Steps

#### 1. **IAM Permissions:**
   - **Check IAM Roles**:
     - Go to the AWS Management Console.
     - Navigate to the **IAM** service.
     - Find and inspect the `TaskExecutionRole` and ensure it has the `AmazonECSTaskExecutionRolePolicy` attached.
     - Validate that the policy includes permissions to pull container images from ECR and log to CloudWatch.

   **Changes/Updates**:
   - Ensure the following policy is attached to the `TaskExecutionRole`:

     ```typescript
     executionRole: new iam.Role(stack, 'TaskExecutionRole', {
       assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
       managedPolicies: [
         iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
       ],
     }),
     ```

#### 2. **VPC and Subnet Configuration:**
   - **Check Subnet Routing**:
     - In the AWS Management Console, go to **VPC**.
     - Navigate to **Subnets** and locate your private subnets.
     - Ensure the private subnets have a route to a NAT Gateway by checking the **Route Tables** associated with them.

   **Changes/Updates**:
   - Ensure your subnets are configured with the `PRIVATE_WITH_EGRESS` type:

     ```typescript
     const vpc = new ec2.Vpc(stack, 'VPC', {
       maxAzs: 2,
       natGateways: 1,
       subnetConfiguration: [
         {
           name: 'Public',
           subnetType: ec2.SubnetType.PUBLIC,
         },
         {
           name: 'Private',
           subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Ensure NAT Gateway is configured
         }
       ]
     });
     ```

   - Ensure your Fargate service is assigned to these subnets:

     ```typescript
     const service = new ecs.FargateService(stack, 'EMD-ecs-service', {
       cluster,
       taskDefinition: fargateTaskDefinition,
       platformVersion: ecs.FargatePlatformVersion.LATEST,
       securityGroups: [ec2SecurityGroup],
       vpcSubnets: {
         subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
       },
       assignPublicIp: false,
     });
     ```

#### 3. **Security Group Configuration:**
   - **Check Security Group Rules**:
     - In the AWS Management Console, go to **EC2**.
     - Navigate to **Security Groups**.
     - Find the security groups associated with your ECS tasks and Load Balancer.
     - Ensure inbound rules allow traffic on the necessary ports (80, 8080).

   **Changes/Updates**:
   - Make sure your `SecurityGroup` settings allow traffic on both ports 80 and 8080:

     ```typescript
     ec2SecurityGroup.addIngressRule(
       ec2.Peer.anyIpv4(),
       ec2.Port.tcp(8080),
       'Allow All HTTP traffic on port 8080'
     );

     ec2SecurityGroup.addIngressRule(
       ec2.Peer.anyIpv4(),
       ec2.Port.tcp(80),
       'Allow All HTTP traffic on port 80'
     );

     ec2SecurityGroup.addIngressRule(
       lbSecurityGroup,
       ec2.Port.tcp(8080),
       'Allow HTTP traffic from Load Balancer only on port 8080'
     );

     ec2SecurityGroup.addIngressRule(
       lbSecurityGroup,
       ec2.Port.tcp(80),
       'Allow HTTP traffic from Load Balancer only on port 80'
     );
     ```

#### 4. **Load Balancer and Target Group:**
   - **Check Load Balancer Health Check**:
     - Go to the **EC2** service in the AWS Management Console.
     - Navigate to **Load Balancers**.
     - Select your Application Load Balancer and go to the **Target Groups** tab.
     - Ensure that the health check path is correct (`/`) and matches what your application serves.

   **Changes/Updates**:
   - Make sure your ALB listener and target group are correctly configured:

     ```typescript
     httpListener.addTargets('EMD-ECS', {
       protocol: ApplicationProtocol.HTTP,
       targets: [service],
       healthCheck: {
         path: '/',
         interval: cdk.Duration.minutes(1),
       },
     });
     ```

#### 5. **Container Image Configuration:**
   - **Validate Container Image**:
     - Ensure your Docker image is built and available in the expected location (e.g., ECR).
     - If using a local image, ensure it’s correctly built and accessible.

   **Changes/Updates**:
   - Validate the `image` property in your container definition:

     ```typescript
     const fargateContainer = fargateTaskDefinition.addContainer('EMD-FargateContainer', {
       image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../local-image')), // Ensure this path is correct
       memoryLimitMiB: 512,
       cpu: 256,
       logging: new ecs.AwsLogDriver({ streamPrefix: "infra" }),
       portMappings: [
         {
           containerPort: 8080,
           protocol: ecs.Protocol.TCP
         }
       ],
       environment: {
         EMD_VAR: 'option 1',
       },
     });
     ```

#### 6. **Logging and Monitoring:**
   - **Check CloudWatch Logs**:
     - Go to **CloudWatch** in the AWS Management Console.
     - Look for logs from your ECS tasks under **Logs** -> **Log Groups**.
     - Review any error logs or issues reported during the task launch.

   **Changes/Updates**:
   - Ensure that logging is correctly set up in your container definition:

     ```typescript
     logging: new ecs.AwsLogDriver({ streamPrefix: "infra" }),
     ```

#### 7. **ECS Task Events:**
   - **Check ECS Task Events**:
     - In the AWS Management Console, go to the **ECS** service.
     - Select your cluster, then the service that’s not starting correctly.
     - Check the **Events** tab for any errors or warnings during the task launch process.

### Summary:
- Ensure IAM roles have the correct policies attached.
- Validate subnet routing and NAT Gateway configuration.
- Confirm security group rules are correct.
- Double-check container image availability and configuration.
- Inspect CloudWatch logs and ECS events for detailed error information.

By following these steps, you should be able to identify and resolve the issue preventing your Fargate container from launching.


### Bootstrap Template

#### 1. **IAM Roles and Permissions:**
   - **FilePublishingRole, ImagePublishingRole, and DeploymentActionRole**: These roles are essential for deploying CDK applications. 
   - If these roles do not have the correct permissions, it could prevent resources from being deployed correctly.
   - **Action**: Check that these IAM roles are correctly created and that they have the necessary permissions to manage S3 buckets, ECR repositories, and CloudFormation stacks.

   **How to Check**:
   - In the AWS Management Console, go to **IAM**.
   - Check the roles created by the bootstrap stack, particularly the `cdk-*` prefixed roles (e.g., `cdk-hnb659fds-file-publishing-role-<account-id>-<region>`).
   - Ensure they have the correct managed policies and permissions.

#### 2. **S3 Bucket for Assets:**
   **StagingBucket**: This bucket is used to store file assets that are part of your CDK deployment. If the bucket is misconfigured (e.g., missing encryption settings or permissions), it could cause issues.
   **Action**: Validate that the S3 bucket is created and has the correct encryption settings and policies.

   **How to Check**:
   - In the AWS Management Console, go to **S3**.
   - Locate the S3 bucket created by the bootstrap stack (e.g., `cdk-hnb659fds-assets-<account-id>-<region>`).
   - Ensure the bucket has encryption enabled and that its bucket policy allows the necessary actions.

#### 3. **KMS Keys:**
  **FileAssetsBucketEncryptionKey**: This KMS key is used to encrypt the S3 bucket. If the key is not correctly configured or if the associated IAM roles do not have the correct permissions, it could cause issues with asset encryption.
  **Action**: Ensure the KMS key is correctly created and that the necessary IAM roles have access to it.

   **How to Check**:
   - In the AWS Management Console, go to **KMS**.
   - Verify that the KMS key created by the bootstrap stack exists and has the correct key policy.
   - Ensure the roles like `FilePublishingRole` have the necessary `kms:Decrypt` and `kms:Encrypt` permissions on the key.

#### 4. **ECR Repository:**
   **ContainerAssetsRepository**:  This repository is used to store Docker images. If there are issues with the repository (e.g., permissions or misconfiguration), it could prevent the deployment of containerized applications.
   **Action**: Ensure the ECR repository is correctly configured and that the necessary roles have permissions to push and pull images.

   **How to Check**:
   - In the AWS Management Console, go to **ECR**.
   - Check that the repository created by the bootstrap stack exists (e.g., `cdk-hnb659fds-container-assets-<account-id>-<region>`).
   - Ensure the repository policy allows the `cdk-*` roles to push and pull images.

### How to Validate the Bootstrap Template

#### Step 1: Re-run the Bootstrap Command
If you suspect issues with the bootstrap resources, you can re-run the CDK bootstrap command. 
- This command ensures that the necessary resources are up-to-date and correctly configured.
- This command will deploy or update the bootstrap stack with the latest settings.
- Make sure you have the necessary permissions to run this command.

```bash
cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```
#### Step 2: Inspect the Resources Created by the Bootstrap Stack
After bootstrapping, go to the AWS CloudFormation console and check the stack named CDKToolkit or similar.
- Verify that all resources (S3 buckets, IAM roles, KMS keys, ECR repositories) have been created successfully.
- Check for any errors or warnings in the CloudFormation stack events.

#### Step 3: Test with a Minimal CDK Application
Deploy a minimal CDK application to ensure that the bootstrap resources are functioning correctly. For example, a simple S3 bucket or an ECS Fargate service.

#### Step 4: Review Logs and CloudTrail
If deployment issues persist, review CloudTrail logs for any failed API calls related to IAM, S3, ECR, or KMS. This can provide insights into permission issues.

### Summary:
- Bootstrap Stack: Ensure it is correctly set up with all necessary resources.
- IAM Roles: Check that the roles have the correct permissions.
- S3 Bucket and KMS Keys: Validate that they are properly configured.
- ECR Repository: Ensure it is accessible and correctly set up.
- Re-run Bootstrap: If in doubt, re-run the cdk bootstrap command to update resources.

## Conclusion

This project demonstrates a comprehensive approach to deploying and managing an AWS ECS Fargate service using AWS CDK. By leveraging the power of infrastructure as code, we ensure that our cloud infrastructure is consistent, repeatable, and easily scalable.

Throughout this guide, we've covered the essential steps for setting up and troubleshooting the deployment process, including IAM role configuration, VPC and subnet setup, security group management, and load balancer configuration. These components are crucial for a successful deployment and ongoing operation of your ECS Fargate services.

If you encounter any issues or need to customize the deployment further, refer to the troubleshooting section for detailed guidance. This documentation should serve as a strong foundation for deploying more complex and scalable architectures in AWS.

Thank you for following along, and happy coding!



