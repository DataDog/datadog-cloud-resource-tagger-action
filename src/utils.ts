import os from "os";
import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import { context, GitHub } from "@actions/github";

const ORGANIZATION = "Datadog";
export const CLOUD_RESOURCE_TAGGER_REPO = "datadog-cloud-resource-tagger";

function getArch(): "x86_64" | "i386" | "arm64" {
  const arch = os.arch();
  core.debug(`arch is ${arch}`);
  switch (arch) {
    case "arm64":
      return "arm64";
    case "x64":
      return "x86_64";
    case "ia32":
      return "i386";
    default:
      throw new Error(`Unsupported Architecture: ${arch}`);
  }
}

function getOS(): "Darwin" | "Windows" | "Linux" {
  const platform = os.platform();
  core.debug(`platform is ${platform}`);
  switch (platform) {
    case "darwin":
      return "Darwin";
    case "win32":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export async function getLatestReleaseVersion(): Promise<string> {
  const octokit = new Octokit();
  const response = await octokit.rest.repos.getLatestRelease({
    owner: ORGANIZATION,
    repo: CLOUD_RESOURCE_TAGGER_REPO,
  });
  if (!response.data.name) throw new Error("Couldn't find latest version!");
  return response.data.name;
}

export function getDownloadUrl(version: string): string {
  let isLatest = false;
  let path = `releases/download/v${version}`;
  if (version === "latest") {
    path = `releases/latest/download`;
    isLatest = true;
  }
  const os = getOS();
  const arch = getArch();
  const extension = os === "Windows" ? "zip" : "tar.gz";
  const filename = isLatest
    ? `${CLOUD_RESOURCE_TAGGER_REPO}_${os}_${arch}.${extension}`
    : `${CLOUD_RESOURCE_TAGGER_REPO}_${version}_${os}_${arch}.${extension}`;
  const url = `https://github.com/${ORGANIZATION}/${CLOUD_RESOURCE_TAGGER_REPO}/${path}/${filename}`;
  core.debug(`Download url is ${url}`);
  return url;
}

export async function detectChangedFiles(): Promise<string[]> {
  // Create GitHub client with the API token.
  const client = new GitHub(core.getInput("token", { required: true }));

  const eventName = context.eventName;

  // Retrieve the base and head commits
  let base: string = "";
  let head: string = "";

  switch (eventName) {
    case "pull_request":
      base = context.payload.pull_request?.base?.sha;
      head = context.payload.pull_request?.head?.sha;
      break;
    case "push":
      base = context.payload.before;
      head = context.payload.after;
      break;
    default:
      core.setFailed(
        `This action can only be run on pull requests and pushes. ` +
          "Please submit an issue if you believe this is incorrect.",
      );
  }

  // Log the base and head commits
  core.info(`Base commit: ${base}`);
  core.info(`Head commit: ${head}`);

  // Ensure that the base and head properties are not empty
  if (!base || !head) {
    core.setFailed(
      `The base and head commits are missing from the payload for this ${context.eventName} event. `,
    );
  }

  // Use GitHub's API to compare two commits.
  // https://developer.github.com/v3/repos/commits/#compare-two-commits
  const response = await client.repos.compareCommits({
    base,
    head,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  // Ensure that the request was successful.
  if (response.status !== 200) {
    core.setFailed(
      `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200.`,
    );
  }

  // Get the changed files from the response payload.
  const files = response.data.files;
  const filesAddedModified = [] as string[];
  for (const file of files) {
    const filename = file.filename;
    if (
      file.status === "added" ||
      file.status === "modified" ||
      file.status === "renamed"
    ) {
      filesAddedModified.push(filename);
    }
  }

  // Log the output values.
  core.info(`Files changes: ${filesAddedModified.join(", ")}`);
  return filesAddedModified;
}
