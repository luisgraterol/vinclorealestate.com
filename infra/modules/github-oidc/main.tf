resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "plan_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:pull_request"]
    }
  }
}

data "aws_iam_policy_document" "apply_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:environment:prod"]
    }
  }
}

resource "aws_iam_role" "plan" {
  name               = "gha-infra-plan"
  assume_role_policy = data.aws_iam_policy_document.plan_trust.json
}

resource "aws_iam_role_policy_attachment" "plan_readonly" {
  role       = aws_iam_role.plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

data "aws_iam_policy_document" "plan_state" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.state_bucket}"]
  }

  # Lock files (use_lockfile) requieren escritura en el bucket de estado
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::${var.state_bucket}/*"]
  }
}

resource "aws_iam_role_policy" "plan_state" {
  name   = "tfstate-access"
  role   = aws_iam_role.plan.id
  policy = data.aws_iam_policy_document.plan_state.json
}

resource "aws_iam_role" "apply" {
  name               = "gha-infra-apply"
  assume_role_policy = data.aws_iam_policy_document.apply_trust.json
}

resource "aws_iam_role_policy_attachment" "apply_admin" {
  role       = aws_iam_role.apply.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
