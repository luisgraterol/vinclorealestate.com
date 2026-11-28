output "database_name" {
  description = "Glue catalog database name."
  value       = aws_glue_catalog_database.this.name
}

output "crawler_name" {
  description = "Glue crawler name."
  value       = aws_glue_crawler.curated.name
}

output "athena_workgroup" {
  description = "Athena workgroup name."
  value       = aws_athena_workgroup.this.name
}
