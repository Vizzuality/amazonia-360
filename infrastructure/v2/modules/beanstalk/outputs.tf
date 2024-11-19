output "environment_settings" {
  value = aws_elastic_beanstalk_environment.application_environment.all_settings
}

output "instances" {
  value       = aws_elastic_beanstalk_environment.application_environment.instances
  description = "Instances used by this environment"
}

output "load_balancers" {
  value       = aws_elastic_beanstalk_environment.application_environment.load_balancers
  description = "Elastic Load Balancers in use by this environment"
}

output "environment_cname" {
  value       = aws_elastic_beanstalk_environment.application_environment.cname
  description = "The URL of the environment"
}