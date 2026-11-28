include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/modules//glue"
}

dependency "downstream_bucket" {
  config_path = "../downstream-bucket"

  mock_outputs                            = { bucket_name = "vinclo-downstream" }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

inputs = {
  database_name     = "vinclo"
  downstream_bucket = dependency.downstream_bucket.outputs.bucket_name
}
