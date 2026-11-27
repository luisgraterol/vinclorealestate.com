# Infraestructura (Terraform + Terragrunt)

Infra de AWS (cuenta única, `us-east-1`) para el proyecto `srv/`: una imagen Docker con dos tareas ECS Fargate (`web-extractor` y `normalize`) que se ejecutan con EventBridge Scheduler.

## Requisitos

- Terraform >= 1.10 (usamos locking nativo de S3, `use_lockfile = true`, sin DynamoDB)
- Terragrunt 1.x (`root.hcl`, `terragrunt run --all ...`)
- AWS CLI con SSO

## Stacks (`live/prod/us-east-1/`)

| Stack | Qué crea |
|---|---|
| `github-oidc` | Proveedor OIDC de GitHub y roles `gha-infra-plan` (PR, solo lectura) y `gha-infra-apply` (environment `prod`, admin) |
| `network` | VPC 10.20.0.0/16, 2 subredes públicas, IGW, security group `vinclo-tasks` (sin NAT) |
| `upstream-bucket` | `vinclo-upstream` (datos crudos `raw/`, transición a Glacier IR a los 90 días) |
| `downstream-bucket` | `vinclo-downstream` (datos normalizados) |
| `ecr` | Repositorio ECR `vinclo-tasks` (tag móvil `prod`, conserva 20 imágenes) |
| `ecs-cluster` | Cluster `vinclo-cluster`, log group, SNS de alertas y regla EventBridge para tareas fallidas |
| `tasks` | Task definitions `web-extractor` y `normalize`, schedules, rol CI `gha-vinclo-tasks` y parámetro SSM `/vinclo/tasks/run-task` |

Los módulos están en `modules/`; `srv-tasks` compone `ecs-task` y `schedules`.

## Bootstrap (una sola vez)

1. `live/prod/account.hcl` ya tiene la cuenta `599255610822` y el email de alertas.
2. `aws sso login --profile vinclo`. El perfil vive en `~/.aws/vinclo-config`, separado de cualquier
   otra config de AWS; `.mise.toml` exporta `AWS_CONFIG_FILE` y `AWS_PROFILE` solo dentro de este repo.
3. Crear el bucket de estado `vinclo-tfstate`:
   ```sh
   cd infra/live/prod/us-east-1
   AWS_PROFILE=vinclo terragrunt backend bootstrap --all
   ```
4. Aplicar localmente una vez (o al menos `github-oidc`); después CI toma el control:
   ```sh
   AWS_PROFILE=vinclo terragrunt run --all apply
   ```
5. En GitHub: crear la variable de repositorio `AWS_ACCOUNT_ID` y el environment `prod`.

Notas:

- Los nombres de bucket S3 son globales: conviene crearlos cuanto antes para que nadie más los tome.
- La suscripción SNS por correo debe confirmarse haciendo clic en el email que envía AWS; si no, no llegan alertas.

## Agregar un schedule

Una línea en `inputs.schedules` de `live/prod/us-east-1/tasks/terragrunt.hcl`:

```hcl
mi-job = { task = "web-extractor", cron = "0 6 ? * MON *", command = ["web-extractor", "--job", "mi-job"] }
```

`task` es `web-extractor` o `normalize`. El `cron` usa el formato de EventBridge (el módulo lo envuelve en `cron(...)`), zona horaria `America/Chicago`.

## Comandos útiles

```sh
cd infra/live/prod/us-east-1
terragrunt run --all plan
terragrunt hcl fmt
```
