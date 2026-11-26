include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/modules//ecs-cluster"
}

locals {
  account = read_terragrunt_config(find_in_parent_folders("account.hcl")).locals
}

inputs = {
  cluster_name = "vinclo-srv"
  alert_email  = local.account.alert_email
}
