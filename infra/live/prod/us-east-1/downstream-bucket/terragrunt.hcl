include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/modules//s3-bucket"
}

inputs = {
  name = "vinclo-downstream"
}
