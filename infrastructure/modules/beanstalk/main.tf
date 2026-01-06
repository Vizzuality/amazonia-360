resource "aws_s3_bucket" "application_bucket" {
  bucket = "${var.project}-${var.environment}-bucket"
  tags = merge(
    {
      Name = "Elastic Beanstalk S3 Bucket"
    },
    var.tags
  )
}

# Site Server Security Groups
#
# SSH access to and from the world (disabled by default via count = 0: ideally
# this should not be enabled, past initial pre-release stages where it may be
# useful to inspect things quickly in live EC2 instances via SSH)
#
# HTTP(S) access from the world
#
resource "aws_security_group" "site_server_ssh_security_group" {
  count       = 1
  vpc_id      = var.vpc.id
  name        = "${var.project}-${var.environment}-public-ssh-sg"
  description = "Security group for SSH access to and from the world - ${var.project} ${var.environment}"

  tags = merge(
    {
      Name = "EC2 SSH access SG"
    },
    var.tags
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "ssh_ingress" {
  count             = length(aws_security_group.site_server_ssh_security_group) > 0 ? 1 : 0
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.site_server_ssh_security_group[0].id
}

resource "aws_security_group_rule" "ssh_egress" {
  count       = length(aws_security_group.site_server_ssh_security_group) > 0 ? 1 : 0
  type        = "egress"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = [var.vpc.cidr_block]

  security_group_id = aws_security_group.site_server_ssh_security_group[0].id
}

# Create elastic beanstalk application
resource "aws_elastic_beanstalk_application" "application" {
  name = var.application_name
}

data "aws_region" "current" {}

# Settings for the elastic beanstalk environment
locals {
  # Convert environment_variables_for_db_init map to EB settings format
  custom_env_settings_for_db_init = [
    for key, value in var.environment_variables_for_db_init : {
      namespace = "aws:elasticbeanstalk:application:environment"
      name      = key
      value     = value
    }
  ]

  environment_settings = concat([
    {
      namespace = "aws:elasticbeanstalk:application:environment"
      name      = "S3_BUCKET_NAME"
      value     = aws_s3_bucket.application_bucket.bucket
    },
    {
      namespace = "aws:elasticbeanstalk:application:environment"
      name      = "AWS_REGION"
      value     = data.aws_region.current.region
    },
    {
      namespace = "aws:ec2:vpc"
      name      = "VPCId"
      value     = var.vpc.id
    },
    {
      namespace = "aws:ec2:vpc"
      name      = "Subnets"
      value     = join(",", var.public_subnets)
    },
    {
      namespace = "aws:ec2:vpc"
      name      = "AssociatePublicIpAddress"
      value     = "true"
    },
    {
      namespace = "aws:ec2:vpc"
      name      = "ELBScheme"
      value     = "internet facing"
    },
    {
      namespace = "aws:elasticbeanstalk:environment:process:default"
      name      = "MatcherHTTPCode"
      value     = "200"
    },
    {
      namespace = "aws:elasticbeanstalk:environment"
      name      = "LoadBalancerType"
      value     = "application"
    },
    {
      namespace = "aws:elasticbeanstalk:environment"
      name      = "ServiceRole"
      value     = var.elasticbeanstalk_iam_service_linked_role_name
    },
    {
      namespace = "aws:autoscaling:launchconfiguration"
      name      = "IamInstanceProfile"
      value     = aws_iam_instance_profile.beanstalk_ec2.name
    },
    {
      namespace = "aws:autoscaling:launchconfiguration"
      name      = "InstanceType"
      value     = var.ec2_instance_type
    },
    {
      namespace = "aws:autoscaling:launchconfiguration"
      name      = "RootVolumeSize"
      value     = "40"
    },
    {
      namespace = "aws:autoscaling:launchconfiguration"
      name      = "DisableIMDSv1"
      value     = true
    },
    {
      namespace = "aws:autoscaling:launchconfiguration"
      name      = "SecurityGroups"
      value     = try(aws_security_group.site_server_ssh_security_group[0].id, "")
    },
    {
      namespace = "aws:autoscaling:asg"
      name      = "MinSize"
      value     = 1
    },
    {
      namespace = "aws:autoscaling:asg"
      name      = "MaxSize"
      value     = 1
    },
    {
      namespace = "aws:elasticbeanstalk:healthreporting:system"
      name      = "SystemType"
      value     = "enhanced"
    },
    {
      namespace = "aws:elasticbeanstalk:cloudwatch:logs"
      name      = "StreamLogs"
      value     = "true"
    },
    {
      namespace = "aws:elasticbeanstalk:cloudwatch:logs"
      name      = "RetentionInDays"
      value     = "7"
    },
    {
      namespace = "aws:elasticbeanstalk:cloudwatch:logs"
      name      = "DeleteOnTerminate"
      value     = "false"
    },
    {
      namespace = "aws:elbv2:listener:443"
      name      = "ListenerEnabled"
      value     = var.acm_certificate.arn == "" ? "false" : "true"
    },
    {
      namespace = "aws:elbv2:listener:443"
      name      = "Protocol"
      value     = "HTTPS"
    },
    {
      namespace = "aws:elbv2:listener:443"
      name      = "SSLCertificateArns"
      value     = var.acm_certificate.arn
    },
    // Some reports can take a very long time to render. Thanks Esri
    // for the endless wait on some of your web components :shrug:
    {
      namespace = "aws:elbv2:loadbalancer"
      name      = "IdleTimeout"
      value     = "240"
    },
    // Health check path
    {
      namespace = "aws:elasticbeanstalk:environment:process:default"
      name      = "HealthCheckPath"
      value     = "/local-api/health"
    }
  ], local.custom_env_settings_for_db_init)
}

# Create a map of domain aliases with their indices for priority calculation
locals {
  domain_alias_map = { for idx, domain in var.domain_aliases : domain => idx }
}

# Create elastic beanstalk environment

resource "aws_elastic_beanstalk_environment" "application_environment" {
  name                   = var.application_environment
  application            = aws_elastic_beanstalk_application.application.name
  solution_stack_name    = var.solution_stack_name
  tier                   = var.tier
  wait_for_ready_timeout = "20m"
  cname_prefix           = var.cname_prefix != null ? var.cname_prefix : null

  dynamic "setting" {
    for_each = local.environment_settings
    content {
      namespace = setting.value["namespace"]
      name      = setting.value["name"]
      value     = setting.value["value"]
    }
  }
}

data "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_elastic_beanstalk_environment.application_environment.load_balancers[0]
  port              = 80
}

resource "aws_lb_listener_rule" "redirect_http_to_https" {
  listener_arn = data.aws_lb_listener.http_listener.arn
  priority     = 1

  action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# Get HTTPS listener to add alias certificates and redirect rules
data "aws_lb_listener" "https_listener" {
  count             = length(var.domain_aliases) > 0 ? 1 : 0
  load_balancer_arn = aws_elastic_beanstalk_environment.application_environment.load_balancers[0]
  port              = 443
}

# Attach additional certificates for domain aliases to the HTTPS listener
resource "aws_lb_listener_certificate" "alias_certificates" {
  for_each = length(var.domain_aliases) > 0 ? var.acm_certificate_aliases : {}

  listener_arn    = data.aws_lb_listener.https_listener[0].arn
  certificate_arn = each.value.arn

  depends_on = [var.acm_certificate_alias_validations]
}

# Create redirect rules for each domain alias
resource "aws_lb_listener_rule" "redirect_alias_to_main_domain" {
  for_each = length(var.domain_aliases) > 0 ? local.domain_alias_map : {}

  listener_arn = data.aws_lb_listener.https_listener[0].arn
  priority     = 100 + each.value

  action {
    type = "redirect"

    redirect {
      host        = var.domain
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  condition {
    host_header {
      values = [each.key]
    }
  }
}
