locals {
  # ARNs de task definition sin revisión (sin ':<n>' final)
  task_definition_arns = distinct([for s in var.schedules : s.task_definition_arn])
  task_family_arns     = [for arn in local.task_definition_arns : join(":", slice(split(":", arn), 0, 6))]
}

resource "aws_scheduler_schedule_group" "srv" {
  name = "vinclo"
}

data "aws_iam_policy_document" "scheduler_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "scheduler" {
  statement {
    actions   = ["ecs:RunTask"]
    resources = [for arn in local.task_family_arns : "${arn}:*"]
  }

  statement {
    actions   = ["iam:PassRole"]
    resources = var.pass_role_arns
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "vinclo-scheduler"
  assume_role_policy = data.aws_iam_policy_document.scheduler_trust.json
}

resource "aws_iam_role_policy" "scheduler" {
  name   = "run-vinclo-tasks"
  role   = aws_iam_role.scheduler.id
  policy = data.aws_iam_policy_document.scheduler.json
}

resource "aws_scheduler_schedule" "this" {
  for_each = var.schedules

  name                         = each.key
  group_name                   = aws_scheduler_schedule_group.srv.name
  schedule_expression          = "cron(${each.value.cron})"
  schedule_expression_timezone = var.timezone

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = var.cluster_arn
    role_arn = aws_iam_role.scheduler.arn

    ecs_parameters {
      task_definition_arn = each.value.task_definition_arn
      launch_type         = "FARGATE"

      network_configuration {
        subnets          = var.subnet_ids
        security_groups  = var.security_group_ids
        assign_public_ip = true
      }
    }

    retry_policy {
      maximum_retry_attempts = 1
    }

    input = jsonencode({
      containerOverrides = [{
        name    = "main"
        command = each.value.command
      }]
    })
  }
}
