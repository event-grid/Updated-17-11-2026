# Infrastructure

Part of the one EVNTGRID repository.

| Folder | Purpose | Status |
|---|---|---|
| `docker/` | Local development containers | Empty |
| `aws/` | AWS-specific files that are not Terraform. Contents not defined | Empty |
| `terraform/` | Infrastructure as code. Terraform was named in the folder plan | Empty |
| `monitoring/` | OpenTelemetry, Prometheus and Grafana configuration | Empty |

- Nothing here creates AWS resources by itself.
- No credentials belong in this folder. Secrets are never committed.
- Which CI/CD tool is used is not decided yet (TA-14).
- Where Dockerfiles live is not decided yet. See `frontend\README.md`.