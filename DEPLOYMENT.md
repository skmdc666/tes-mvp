# Deployment Guide for TES MVP

This guide covers deploying TES MVP to AWS and production environments.

## Prerequisites

- AWS Account with appropriate permissions
- Docker and Docker Compose installed locally
- GitHub account with repository access
- Railway account (alternative to AWS)
- Domain name registered (optional but recommended)

## Deployment Options

### Option 1: Railway (Recommended for MVP)

Railway is the fastest path to production for this MVP.

#### Steps

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with GitHub account

2. **Connect GitHub Repository**
   - Create new project
   - Select repository
   - Railway automatically detects Node.js project

3. **Configure Environment Variables**
   - Go to project settings
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=3000
     DATABASE_URL=<Railway PostgreSQL URL>
     REDIS_URL=<Railway Redis URL>
     JWT_SECRET=<random-secret-key>
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=<secure-password>
     ```

4. **Deploy**
   - Push to main branch
   - Railway automatically builds and deploys
   - View logs in Railway dashboard

5. **Custom Domain (Optional)**
   - Add custom domain in Railway settings
   - Configure DNS records
   - Railway provides free SSL certificate

### Option 2: AWS Deployment

For more control and scalability, deploy to AWS using ECS, RDS, and ElastiCache.

#### Architecture

```
┌─────────────────────────────────────────┐
│         Route 53 (DNS)                   │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│   CloudFront (CDN) + WAF                │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│  Application Load Balancer (ALB)        │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│  ECS Cluster (Auto-scaled containers)   │
└────────────────┬──┬──┬──────────────────┘
                 │  │  │
        ┌────────┘  │  └────────┐
        │           │           │
        ▼           ▼           ▼
     Container  Container  Container
     (Fargate)  (Fargate)   (Fargate)
        │           │           │
        └────────┬──┬───────────┘
                 │  │
        ┌────────┘  └────────┐
        │                    │
        ▼                    ▼
    RDS PostgreSQL      ElastiCache Redis
```

#### Step 1: Prepare AWS Account

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)

# Verify configuration
aws sts get-caller-identity
```

#### Step 2: Create RDS PostgreSQL Database

```bash
# Using AWS Console (recommended for first-time setup)
# Alternative: Using AWS CLI

aws rds create-db-instance \
  --db-instance-identifier tes-mvp-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --storage-type gp2 \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx
```

#### Step 3: Create ElastiCache Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id tes-mvp-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx
```

#### Step 4: Build and Push Docker Image

```bash
# Login to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name tes-mvp

# Build image
docker build -t tes-mvp:latest .

# Tag image for ECR
docker tag tes-mvp:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/tes-mvp:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/tes-mvp:latest
```

#### Step 5: Create ECS Cluster and Task Definition

```bash
# Create cluster
aws ecs create-cluster --cluster-name tes-mvp

# Register task definition (create tes-mvp-task.json first)
aws ecs register-task-definition --cli-input-json file://tes-mvp-task.json
```

**tes-mvp-task.json**:
```json
{
  "family": "tes-mvp",
  "taskRoleArn": "arn:aws:iam::123456789:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "tes-mvp",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/tes-mvp:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "/tes-mvp/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "/tes-mvp/redis-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "/tes-mvp/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tes-mvp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 6: Create Application Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name tes-mvp-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx

# Create load balancer
aws elbv2 create-load-balancer \
  --name tes-mvp-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/tes-mvp-alb/xxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/tes-mvp-tg/xxxxx
```

#### Step 7: Create ECS Service

```bash
aws ecs create-service \
  --cluster tes-mvp \
  --service-name tes-mvp-service \
  --task-definition tes-mvp:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/tes-mvp-tg/xxxxx,containerName=tes-mvp,containerPort=3000
```

#### Step 8: Configure Auto Scaling

```bash
# Create auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/tes-mvp/tes-mvp-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name tes-mvp-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/tes-mvp/tes-mvp-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "TargetValue=70.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization}"
```

#### Step 9: Setup CloudWatch Monitoring

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/tes-mvp

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name tes-mvp-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:tes-mvp-alerts
```

### Option 3: Docker Compose (Local/VPS)

For small-scale deployments on a VPS:

```bash
# SSH into VPS
ssh user@your-vps.com

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repository
git clone <repository-url>
cd tes-mvp

# Create production environment file
nano .env.prod
# Set all environment variables

# Start with production compose file
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## Post-Deployment

### 1. Database Initialization

```bash
# Connect to running container
docker exec -it tes-mvp-app npm run db:migrate

# Seed initial data (if needed)
docker exec -it tes-mvp-app npm run db:seed
```

### 2. Health Checks

```bash
# Verify application health
curl https://your-domain.com/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-04-29T16:00:00Z",
  "websocket": "enabled"
}
```

### 3. Create Admin User

```bash
# Set admin credentials via environment or API
curl -X POST https://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### 4. Configure Monitoring

**CloudWatch Dashboard**:
- Monitor CPU utilization
- Track memory usage
- Monitor error rates
- Track API latency

**Email Notifications**:
- Subscribe to SNS topic for alerts
- Configure alarms for critical metrics

### 5. Enable HTTPS

**Railway**: Automatic
**AWS**: 
```bash
# Request ACM certificate
aws acm request-certificate --domain-name your-domain.com

# Update ALB listener to use HTTPS
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --certificate-arn arn:aws:acm:...
```

**VPS**:
```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
```

## Backup and Recovery

### Database Backups

**RDS**: Automatic daily backups (7-day retention)

**VPS PostgreSQL**:
```bash
# Manual backup
pg_dump postgresql://user:pass@localhost/tes_db > backup.sql

# Automated backups (cron)
0 2 * * * pg_dump postgresql://user:pass@localhost/tes_db | gzip > /backups/backup-$(date +\%Y\%m\%d).sql.gz
```

### Application Backups

Version control handles code backups automatically via GitHub.

### Disaster Recovery

1. Database restoration: From RDS snapshot or pg_dump
2. Application redeployment: Push to main branch
3. Configuration restoration: From Environment variables backup

## Security in Production

### Network Security

- VPC with private subnets for databases
- Security groups restricting access
- WAF rules for common attacks
- Rate limiting on API endpoints

### Data Security

- SSL/TLS for all traffic
- Database encryption at rest
- Environment variables for secrets
- No sensitive data in logs

### Access Control

- IAM roles and policies
- SSH key-based authentication
- Audit logging
- Regular security updates

## Monitoring and Logging

### Application Logs

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# For Railway
railway logs

# For AWS
aws logs tail /ecs/tes-mvp --follow
```

### Performance Monitoring

- Prometheus metrics: `/metrics`
- Grafana dashboard: `http://your-domain:3000`
- CloudWatch dashboard

### Alerting

Set up alerts for:
- High error rates (>1%)
- High latency (>1s p99)
- Low uptime (<99.9%)
- Memory leaks
- Database connection pool exhaustion

## Scaling

### Horizontal Scaling

**Railway**: Automatically scales with demand

**AWS**: Configured via ECS auto-scaling policies

**VPS**: Use load balancer to distribute across multiple instances

### Vertical Scaling

**Railway**: Increase instance size in settings

**AWS**: Increase ECS task CPU/memory

**VPS**: Upgrade server hardware

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Code review completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Security scan completed
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team notified of deployment
- [ ] Post-deployment tests passing

## Rollback Procedure

### Railway

```bash
# Revert to previous deployment
# Via dashboard: Select previous deployment → Redeploy
```

### AWS

```bash
# Update ECS service with previous task definition
aws ecs update-service \
  --cluster tes-mvp \
  --service tes-mvp-service \
  --task-definition tes-mvp:N-1

# Monitor rollout
aws ecs wait services-stable --cluster tes-mvp --services tes-mvp-service
```

### VPS

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Pull previous code version
git checkout <previous-commit>

# Restart with previous version
docker-compose -f docker-compose.prod.yml up -d
```

## Common Deployment Issues

### Container fails to start

```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config | grep DATABASE_URL

# Test locally first
npm run build && npm run start
```

### Database connection issues

```bash
# Test connectivity
psql postgresql://user:pass@host:5432/tes_db

# Check security groups (AWS)
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Verify DATABASE_URL format
```

### Out of memory

```bash
# Check memory usage
docker stats

# Increase container memory
# Railway: Increase instance type
# AWS: Increase task memory in ECS
# VPS: Monitor and upgrade hardware
```

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs)
- [Docker Compose Documentation](https://docs.docker.com/compose)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)
