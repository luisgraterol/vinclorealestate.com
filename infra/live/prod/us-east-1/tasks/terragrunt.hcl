include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/modules//srv-tasks"
}

locals {
  account = read_terragrunt_config(find_in_parent_folders("account.hcl")).locals
}

dependency "github_oidc" {
  config_path = "../github-oidc"

  mock_outputs = {
    oidc_provider_arn = "arn:aws:iam::000000000000:oidc-provider/token.actions.githubusercontent.com"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

dependency "network" {
  config_path = "../network"

  mock_outputs = {
    vpc_id                  = "vpc-00000000"
    public_subnet_ids       = ["subnet-00000001", "subnet-00000002"]
    tasks_security_group_id = "sg-00000000"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

dependency "upstream_bucket" {
  config_path = "../upstream-bucket"

  mock_outputs = {
    bucket_name = "vinclo-upstream"
    bucket_arn  = "arn:aws:s3:::vinclo-upstream"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

dependency "downstream_bucket" {
  config_path = "../downstream-bucket"

  mock_outputs = {
    bucket_name = "vinclo-downstream"
    bucket_arn  = "arn:aws:s3:::vinclo-downstream"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

dependency "ecr_srv" {
  config_path = "../ecr-srv"

  mock_outputs = {
    repository_url  = "000000000000.dkr.ecr.us-east-1.amazonaws.com/srv"
    repository_arn  = "arn:aws:ecr:us-east-1:000000000000:repository/srv"
    repository_name = "srv"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

dependency "ecs_cluster" {
  config_path = "../ecs-cluster"

  mock_outputs = {
    cluster_arn      = "arn:aws:ecs:us-east-1:000000000000:cluster/vinclo-srv"
    cluster_name     = "vinclo-srv"
    log_group_name   = "/ecs/vinclo-srv"
    alerts_topic_arn = "arn:aws:sns:us-east-1:000000000000:vinclo-srv-alerts"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

inputs = {
  region             = "us-east-1"
  github_repo        = local.account.github_repo
  image              = "${dependency.ecr_srv.outputs.repository_url}:prod"
  ecr_repository_arn = dependency.ecr_srv.outputs.repository_arn
  upstream_bucket    = dependency.upstream_bucket.outputs.bucket_name
  downstream_bucket  = dependency.downstream_bucket.outputs.bucket_name
  cluster_arn        = dependency.ecs_cluster.outputs.cluster_arn
  cluster_name       = dependency.ecs_cluster.outputs.cluster_name
  log_group_name     = dependency.ecs_cluster.outputs.log_group_name
  subnet_ids         = dependency.network.outputs.public_subnet_ids
  security_group_id  = dependency.network.outputs.tasks_security_group_id
  oidc_provider_arn  = dependency.github_oidc.outputs.oidc_provider_arn

  # Para agregar un job nuevo: una línea aquí. El módulo envuelve cron en cron(...).
  schedules = {
    nashville-str-permits = { task = "web-extractor", cron = "0 6 ? * MON *", command = ["web-extractor", "--job", "nashville-str-permits"] }
    dbpr-fl-lodging       = { task = "web-extractor", cron = "0 6 ? * MON *", command = ["web-extractor", "--job", "dbpr-fl-lodging"] }
    leads                 = { task = "normalize", cron = "0 10 ? * MON *", command = ["normalize", "--dataset", "leads"] }
  }
}
