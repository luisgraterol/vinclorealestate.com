variable "name" {
  description = "Nombre del repositorio ECR."
  type        = string
}

variable "keep_last_images" {
  description = "Cantidad de imágenes a conservar."
  type        = number
  default     = 20
}
