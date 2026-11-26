variable "cluster_name" {
  description = "Nombre del cluster ECS."
  type        = string
}

variable "alert_email" {
  description = "Correo que recibe las alertas de tareas fallidas."
  type        = string
}

variable "log_retention_days" {
  description = "Retención de logs en CloudWatch (días)."
  type        = number
  default     = 30
}
