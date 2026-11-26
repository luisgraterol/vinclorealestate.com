output "oidc_provider_arn" {
  description = "ARN del proveedor OIDC de GitHub."
  value       = aws_iam_openid_connect_provider.github.arn
}

output "plan_role_arn" {
  description = "ARN del rol gha-infra-plan."
  value       = aws_iam_role.plan.arn
}

output "apply_role_arn" {
  description = "ARN del rol gha-infra-apply."
  value       = aws_iam_role.apply.arn
}
