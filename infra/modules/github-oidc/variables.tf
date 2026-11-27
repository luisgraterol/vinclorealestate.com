variable "github_oidc_sub_prefix" {
  description = "Prefijo del claim sub de OIDC de GitHub, p. ej. repo:owner@id/repo@id."
  type        = string
}

variable "state_bucket" {
  description = "Bucket S3 con el estado de Terraform (el rol de plan necesita escribir lock files)."
  type        = string
  default     = "vinclo-tfstate"
}
