resource "aws_ecr_repository" "this" {
  name                 = var.name
  image_tag_mutability = "MUTABLE" # movemos el tag `prod`

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Conservar las últimas ${var.keep_last_images} imágenes"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = var.keep_last_images
      }
      action = { type = "expire" }
    }]
  })
}
