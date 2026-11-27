output "web_extractor_task_definition_arn" {
  description = "ARN de la task definition web-extractor."
  value       = module.web_extractor.task_definition_arn
}

output "normalize_task_definition_arn" {
  description = "ARN de la task definition normalize."
  value       = module.normalize.task_definition_arn
}

output "gha_srv_role_arn" {
  description = "ARN del rol de CI gha-vinclo-tasks."
  value       = aws_iam_role.gha_srv.arn
}

output "run_task_parameter_name" {
  description = "Nombre del parámetro SSM con la config para run-task."
  value       = aws_ssm_parameter.run_task.name
}
