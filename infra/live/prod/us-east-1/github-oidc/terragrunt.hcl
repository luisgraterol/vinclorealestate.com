include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/modules//github-oidc"
}

locals {
  account = read_terragrunt_config(find_in_parent_folders("account.hcl")).locals
}

inputs = {
  github_oidc_sub_prefix = local.account.github_oidc_sub_prefix
}
