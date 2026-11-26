resource "aws_ecs_cluster" "this" {
  name = var.cluster_name

  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/ecs/${var.cluster_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_sns_topic" "alerts" {
  name = "${var.cluster_name}-alerts"
}

# El correo debe confirmarse haciendo clic en el mensaje de AWS
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_event_rule" "task_failed" {
  name        = "${var.cluster_name}-task-failed"
  description = "Tareas ECS que terminan con exit code distinto de 0 o que no logran arrancar"

  event_pattern = jsonencode({
    source        = ["aws.ecs"]
    "detail-type" = ["ECS Task State Change"]
    detail = {
      clusterArn = [aws_ecs_cluster.this.arn]
      lastStatus = ["STOPPED"]
      "$or" = [
        { containers = { exitCode = [{ "anything-but" = 0 }] } },
        # p. ej. no pudo bajar la imagen: no hay exitCode
        { stopCode = ["TaskFailedToStart"] },
      ]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule = aws_cloudwatch_event_rule.task_failed.name
  arn  = aws_sns_topic.alerts.arn
}

data "aws_iam_policy_document" "alerts_topic" {
  statement {
    sid       = "AllowEventBridgePublish"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.alerts.arn]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_sns_topic_policy" "alerts" {
  arn    = aws_sns_topic.alerts.arn
  policy = data.aws_iam_policy_document.alerts_topic.json
}
