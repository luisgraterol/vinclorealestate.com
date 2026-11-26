variable "cluster_arn" {
  description = "ARN del cluster ECS donde se lanzan las tareas."
  type        = string
}

variable "subnet_ids" {
  description = "Subredes para las tareas."
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security groups para las tareas."
  type        = list(string)
}

variable "timezone" {
  description = "Zona horaria de las expresiones cron."
  type        = string
  default     = "America/Chicago"
}

variable "schedules" {
  description = "Schedules por nombre: task definition, cron de EventBridge (sin el envoltorio cron(...)) y comando."
  type = map(object({
    task_definition_arn = string
    cron                = string
    command             = list(string)
  }))
}

variable "pass_role_arns" {
  description = "Roles (task y execution) que el scheduler puede pasar a ECS."
  type        = list(string)
}
