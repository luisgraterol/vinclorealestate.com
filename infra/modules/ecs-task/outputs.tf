output "task_definition_arn" {
  description = "ARN de la task definition (con revisión)."
  value       = aws_ecs_task_definition.this.arn
}

output "task_definition_arn_without_revision" {
  description = "ARN de la task definition sin revisión (para IAM: añadir :*)."
  value       = aws_ecs_task_definition.this.arn_without_revision
}

output "family" {
  description = "Familia de la task definition."
  value       = aws_ecs_task_definition.this.family
}

output "task_role_arn" {
  description = "ARN del task role."
  value       = aws_iam_role.task.arn
}

output "execution_role_arn" {
  description = "ARN del execution role."
  value       = aws_iam_role.execution.arn
}
