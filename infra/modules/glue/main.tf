# Glue Data Catalog + crawler over the curated Parquet, plus an Athena workgroup. The curated
# tables are meant for many consumers (Athena, Spark, notebooks); the crawler keeps the catalog in
# sync with the year/month/day partitions each run writes.

locals {
  bucket_arn = "arn:aws:s3:::${var.downstream_bucket}"
}

resource "aws_glue_catalog_database" "this" {
  name        = var.database_name
  description = "Curated Vinclo datasets (lead lists and more)."
}

data "aws_iam_policy_document" "crawler_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["glue.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "crawler" {
  name               = "${var.database_name}-glue-crawler"
  assume_role_policy = data.aws_iam_policy_document.crawler_trust.json
}

resource "aws_iam_role_policy_attachment" "glue_service" {
  role       = aws_iam_role.crawler.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

data "aws_iam_policy_document" "crawler_read" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${local.bucket_arn}/${var.curated_prefix}/*"]
  }
  statement {
    actions   = ["s3:ListBucket"]
    resources = [local.bucket_arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["${var.curated_prefix}/*"]
    }
  }
}

resource "aws_iam_role_policy" "crawler_read" {
  name   = "read-curated"
  role   = aws_iam_role.crawler.id
  policy = data.aws_iam_policy_document.crawler_read.json
}

resource "aws_glue_crawler" "curated" {
  name          = "${var.database_name}-curated"
  role          = aws_iam_role.crawler.arn
  database_name = aws_glue_catalog_database.this.name
  schedule      = var.crawler_schedule

  # One target per dataset folder, so each becomes its own table (vinclo.leads) with the
  # year/month/day folders as partitions, rather than a single table for the whole prefix.
  dynamic "s3_target" {
    for_each = var.datasets
    content {
      path = "s3://${var.downstream_bucket}/${var.curated_prefix}/${s3_target.value}/"
    }
  }

  recrawl_policy {
    recrawl_behavior = "CRAWL_EVERYTHING"
  }
  schema_change_policy {
    update_behavior = "UPDATE_IN_DATABASE"
    delete_behavior = "LOG"
  }
}

resource "aws_athena_workgroup" "this" {
  name = var.database_name

  configuration {
    enforce_workgroup_configuration = true
    result_configuration {
      output_location = "s3://${var.downstream_bucket}/${var.athena_results_prefix}/"
    }
  }
}
