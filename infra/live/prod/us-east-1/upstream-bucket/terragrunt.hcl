include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/modules//s3-bucket"
}

inputs = {
  name                          = "vinclo-upstream"
  transition_prefix             = "raw/"
  transition_to_glacier_ir_days = 90
}
