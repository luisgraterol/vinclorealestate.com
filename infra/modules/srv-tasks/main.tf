locals {
  upstream_arn   = "arn:aws:s3:::${var.upstream_bucket}"
  downstream_arn = "arn:aws:s3:::${var.downstream_bucket}"
}

data "aws_iam_policy_document" "web_extractor" {
  statement {
    actions   = ["s3:PutObject"]
    resources = ["${local.upstream_arn}/raw/*"]
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [local.upstream_arn]
  }
}

data "aws_iam_policy_document" "normalize" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${local.upstream_arn}/raw/*"]
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [local.upstream_arn, local.downstream_arn]
  }

  statement {
    actions   = ["s3:PutObject"]
    resources = ["${local.downstream_arn}/normalized/*"]
  }
}

module "web_extractor" {
  source = "../ecs-task"

  family           = "web-extractor"
  image            = var.image
  cpu              = 1024
  memory           = 2048
  command          = ["web-extractor", "--list"]
  log_group_name   = var.log_group_name
  region           = var.region
  task_policy_json = data.aws_iam_policy_document.web_extractor.json

  environment = {
    UPSTREAM_URI = "s3://${var.upstream_bucket}"
  }
}

module "normalize" {
  source = "../ecs-task"

  family           = "normalize"
  image            = var.image
  cpu              = 512
  memory           = 1024
  command          = ["normalize", "--list"]
  log_group_name   = var.log_group_name
  region           = var.region
  task_policy_json = data.aws_iam_policy_document.normalize.json

  environment = {
    UPSTREAM_URI   = "s3://${var.upstream_bucket}"
    DOWNSTREAM_URI = "s3://${var.downstream_bucket}"
  }
}

locals {
  task_definition_arns = {
    "web-extractor" = module.web_extractor.task_definition_arn
    "normalize"     = module.normalize.task_definition_arn
  }

  task_role_arns = [
    module.web_extractor.task_role_arn,
    module.web_extractor.execution_role_arn,
    module.normalize.task_role_arn,
    module.normalize.execution_role_arn,
  ]
}

module "schedules" {
  source = "../schedules"

  cluster_arn        = var.cluster_arn
  subnet_ids         = var.subnet_ids
  security_group_ids = [var.security_group_id]
  pass_role_arns     = local.task_role_arns

  schedules = {
    for name, s in var.schedules : name => {
      task_definition_arn = local.task_definition_arns[s.task]
      cron                = s.cron
      command             = s.command
    }
  }
}

# Parámetros para que CI lance tareas manualmente (aws ecs run-task)
resource "aws_ssm_parameter" "run_task" {
  name = "/vinclo/tasks/run-task"
  type = "String"
  value = jsonencode({
    cluster        = var.cluster_name
    subnets        = var.subnet_ids
    securityGroups = [var.security_group_id]
  })
}

# Rol de CI para construir/publicar la imagen y lanzar tareas (solo rama main)
data "aws_iam_policy_document" "gha_srv_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

data "aws_iam_policy_document" "gha_srv" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [var.ecr_repository_arn]
  }

  statement {
    actions = ["ecs:RunTask"]
    resources = [
      "${module.web_extractor.task_definition_arn_without_revision}:*",
      "${module.normalize.task_definition_arn_without_revision}:*",
    ]
  }

  statement {
    actions   = ["ecs:DescribeTasks"]
    resources = ["*"]
  }

  statement {
    actions   = ["iam:PassRole"]
    resources = local.task_role_arns
  }

  statement {
    actions   = ["ssm:GetParameter"]
    resources = [aws_ssm_parameter.run_task.arn]
  }
}

resource "aws_iam_role" "gha_srv" {
  name               = "gha-vinclo-tasks"
  assume_role_policy = data.aws_iam_policy_document.gha_srv_trust.json
}

resource "aws_iam_role_policy" "gha_srv" {
  name   = "vinclo-tasks-ci"
  role   = aws_iam_role.gha_srv.id
  policy = data.aws_iam_policy_document.gha_srv.json
}
