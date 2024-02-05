import path from "path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as utils from "./utils";

const FILE_DELIMITER = "<<||>>";

function getArgs(flag: string, input: string): string[] {
  const value = core.getInput(input);
  if (value) return [flag, value];
  return [];
}

async function run(): Promise<void> {
  const filesChanged = await utils.detectChangedFiles();
  core.info(`Files changed: ${filesChanged}`);

  const githubRef =
    process.env.GITHUB_EVENT_NAME === "pull_request"
      ? process.env.GITHUB_HEAD_REF
      : process.env.GITHUB_REF_NAME;
  await exec.exec(`git switch ${githubRef}`);

  const cloudResourceTaggerVersion = core.getInput("version");
  // Computing args
  const cloudResourceTaggerArgs: string[] = [
    "tag",
    getArgs("-d", "directory"),
    getArgs("--tag-groups", "tag_groups"),
    getArgs("--tags", "tags"),
    getArgs("--output", "output_format"),
    getArgs("--dry-run", "commit_changes"),
    ["--changed-files", filesChanged.join(FILE_DELIMITER)],
  ].flat();
  core.info(`Cloud Resource Tagger Args: ${cloudResourceTaggerArgs}`);
  const downloadUrl = utils.getDownloadUrl(cloudResourceTaggerVersion);
  const pathToTarball = await tc.downloadTool(downloadUrl);
  const extractFn = downloadUrl.endsWith(".zip")
    ? tc.extractZip
    : tc.extractTar;
  const pathToCLI = await extractFn(pathToTarball);

  // Executing CloudResourceTagger
  const pathToCloudResourceTagger = path.join(
    pathToCLI,
    utils.CLOUD_RESOURCE_TAGGER_REPO,
  );
  await exec.exec(pathToCloudResourceTagger, ["-v"]);
  const exitCode = await exec.exec(
    pathToCloudResourceTagger,
    cloudResourceTaggerArgs,
  );

  if (exitCode > 0) {
    core.setFailed(
      `Datadog Cloud Resource Tagger Failed with failed with ${exitCode}`,
    );
    return;
  }
}

run();
