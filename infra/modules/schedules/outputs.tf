output "schedule_arns" {
  description = "ARNs de los schedules por nombre."
  value       = { for k, s in aws_scheduler_schedule.this : k => s.arn }
}

output "scheduler_role_arn" {
  description = "ARN del rol del scheduler."
  value       = aws_iam_role.scheduler.arn
}
