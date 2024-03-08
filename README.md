# Datadog Cloud Resource Tagger GitHub action
This GitHub Action runs [Datadog Cloud Resource Tagger](https://github.com/DataDog/datadog-cloud-resource-tagger) against an IAC (Infrastructure-as-Code) repository.

# GitHub Action Flags
You can customize the GitHub Action step with the following attributes:
* directory: specify the directory to scope tagging over. By default will use `.` if no value is provided (ie tag everything)
* dry_run: specify whether you want to skip commiting the tags into the codebase. By default will be false and therefore will commit the tags.
* tags: specify the exact list of tags to add. By default will only tag with: "dd_git_org,dd_git_repo,dd_git_file,dd_git_modified_commit,dd_git_resource_signature"`
* changed_files_only: specify whether to run on changed files only. By default will run on everything unless set to true
* resource_types: specify the comma separated resource types to tag and skip all others ie `"aws_s3_bucket,gcp_compute_instance"`
* providers: specify the comma separated list of providers to tag and skip all others ie `"aws,gcp"`

# Supported Event Triggers
You can trigger the GitHub Action step on pull_request, push and workflow_dispatch events. Simply specify the appropriate event trigger in the `on` section of the GitHub Action Workflow file.

# Example Workflow File

```
name: Deploy

on: [pull_request]
  
permissions:
  contents: write
  id-token: write

jobs:
  terraform:
    name: 'Terraform Apply'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # fetch all commits

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v1
        with:
          terraform_version: 1.4.6
          
      - name: Datadog Cloud Resource Tagger
        uses: Datadog/datadog-cloud-resource-tagger-action@main
        with:
          directory: ./terraform
          providers: aws,gcp
          resource_types: aws_s3_bucket,gcp_compute_instance 

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: ./terraform
```
