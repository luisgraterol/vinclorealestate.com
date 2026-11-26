variable "name" {
  description = "Nombre del bucket (global en S3)."
  type        = string
}

variable "transition_to_glacier_ir_days" {
  description = "Días tras los que los objetos bajo transition_prefix pasan a GLACIER_IR. null = sin transición."
  type        = number
  default     = null
  nullable    = true
}

variable "transition_prefix" {
  description = "Prefijo al que aplica la transición a GLACIER_IR (vacío = todo el bucket)."
  type        = string
  default     = ""
}
