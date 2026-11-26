variable "name" {
  description = "Prefijo para los nombres de los recursos."
  type        = string
  default     = "vinclo"
}

variable "vpc_cidr" {
  description = "CIDR de la VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "Número de zonas de disponibilidad (una subred pública por AZ)."
  type        = number
  default     = 2
}
