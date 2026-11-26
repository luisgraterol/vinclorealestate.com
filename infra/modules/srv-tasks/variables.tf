variable "image" {
  description = "Imagen completa (repository_url:prod)."
  type        = string
}

variable "ecr_repository_arn" {
  description = "ARN del repositorio ECR (permisos de push para CI)."
  type        = string
}

variable "upstream_bucket" {
  description = "Nombre del bucket upstream."
  type        = string
}

variable "downstream_bucket" {
  description = "Nombre del bucket downstream."
  type        = string
}

variable "cluster_arn" {
  description = "ARN del cluster ECS."
  type        = string
}

variable "cluster_name" {
  description = "Nombre del cluster ECS."
  type        = string
}

variable "log_group_name" {
  description = "Log group de CloudWatch para las tareas."
  type        = string
}

variable "subnet_ids" {
  description = "Subredes públicas donde corren las tareas."
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group de las tareas."
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN del proveedor OIDC de GitHub."
  type        = string
}

variable "github_repo" {
  description = "Repositorio de GitHub (owner/repo)."
  type        = string
}

variable "region" {
  description = "Región AWS."
  type        = string
}

variable "schedules" {
  description = "Schedules por nombre: task (web-extractor | normalize), cron de EventBridge y comando."
  type = map(object({
    task    = string
    cron    = string
    command = list(string)
  }))

  validation {
    condition     = alltrue([for s in values(var.schedules) : contains(["web-extractor", "normalize"], s.task)])
    error_message = "task debe ser 'web-extractor' o 'normalize'."
  }
}
