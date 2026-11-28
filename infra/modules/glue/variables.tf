variable "database_name" {
  description = "Glue catalog database for the curated datasets."
  type        = string
}

variable "downstream_bucket" {
  description = "Bucket that holds the curated Parquet tables."
  type        = string
}

variable "curated_prefix" {
  description = "Prefix under the bucket the crawler scans."
  type        = string
  default     = "curated"
}

variable "datasets" {
  description = "Curated dataset folders to catalog; one table each."
  type        = list(string)
  default     = ["leads"]
}

variable "athena_results_prefix" {
  description = "Prefix under the bucket where Athena writes query results."
  type        = string
  default     = "_athena-results"
}

variable "crawler_schedule" {
  description = "Glue cron (UTC) for the crawler; runs after normalize."
  type        = string
  default     = "cron(0 17 ? * MON *)"
}
