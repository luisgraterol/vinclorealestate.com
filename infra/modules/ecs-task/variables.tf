variable "family" {
  description = "Familia de la task definition (también prefijo de roles y logs)."
  type        = string
}

variable "image" {
  description = "Imagen de contenedor (repo:tag)."
  type        = string
}

variable "cpu" {
  description = "CPU de la tarea Fargate (unidades)."
  type        = number
}

variable "memory" {
  description = "Memoria de la tarea Fargate (MiB)."
  type        = number
}

variable "command" {
  description = "Comando por defecto del contenedor."
  type        = list(string)
  default     = []
}

variable "environment" {
  description = "Variables de entorno del contenedor."
  type        = map(string)
  default     = {}
}

variable "log_group_name" {
  description = "Log group de CloudWatch donde escribe el contenedor."
  type        = string
}

variable "region" {
  description = "Región AWS (para el driver awslogs)."
  type        = string
}

variable "task_policy_json" {
  description = "Política IAM (JSON) del task role."
  type        = string
}
