output "vpc_id" {
  description = "ID de la VPC."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "IDs de las subredes públicas."
  value       = aws_subnet.public[*].id
}

output "tasks_security_group_id" {
  description = "ID del security group vinclo-tasks."
  value       = aws_security_group.tasks.id
}
