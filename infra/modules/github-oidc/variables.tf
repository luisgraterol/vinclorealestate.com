variable "github_repo" {
  description = "Repositorio de GitHub (owner/repo) autorizado a asumir los roles."
  type        = string
}

variable "state_bucket" {
  description = "Bucket S3 con el estado de Terraform (el rol de plan necesita escribir lock files)."
  type        = string
  default     = "vinclo-tfstate"
}
