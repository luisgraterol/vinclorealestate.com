locals {
  # Cuenta AWS de Vinclo (alias "vinclo").
  account_id = "599255610822"
  # Recibe las alertas de tareas fallidas (SNS) — confirmar la suscripción por email.
  alert_email = "lgraterol@vinclorealestate.com"
  github_repo = "luisgraterol/vinclorealestate.com"
  # Prefijo del claim "sub" de OIDC. Este repo usa subjects inmutables de GitHub,
  # que incluyen los IDs del dueño y del repo (ver GET /repos/{repo}/actions/oidc/customization/sub).
  github_oidc_sub_prefix = "repo:luisgraterol@19715671/vinclorealestate.com@1247090691"
}
