output "cluster_arn" {
  description = "ARN del cluster ECS."
  value       = aws_ecs_cluster.this.arn
}

output "cluster_name" {
  description = "Nombre del cluster ECS."
  value       = aws_ecs_cluster.this.name
}

output "log_group_name" {
  description = "Nombre del log group de CloudWatch."
  value       = aws_cloudwatch_log_group.this.name
}

output "alerts_topic_arn" {
  description = "ARN del topic SNS de alertas."
  value       = aws_sns_topic.alerts.arn
}
