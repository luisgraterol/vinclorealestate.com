# Configuración raíz de Terragrunt: backend, provider y tags comunes.

locals {
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))

  account_id = local.account_vars.locals.account_id
  region     = "us-east-1"
  project    = "vinclo"
}

remote_state {
  backend = "s3"

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }

  config = {
    bucket       = "vinclo-tfstate"
    key          = "${path_relative_to_include()}/terraform.tfstate"
    region       = local.region
    encrypt      = true
    use_lockfile = true
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<-EOT
    terraform {
      required_version = ">= 1.10"

      required_providers {
        aws = {
          source  = "hashicorp/aws"
          version = "~> 6.0"
        }
      }
    }

    provider "aws" {
      region              = "${local.region}"
      allowed_account_ids = ["${local.account_id}"]

      default_tags {
        tags = {
          project    = "${local.project}"
          managed-by = "terraform"
          stack      = "${path_relative_to_include()}"
        }
      }
    }
  EOT
}
