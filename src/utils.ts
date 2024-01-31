import os from "os";
import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";

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
  let path = `releases/download/v${version}`;
  if (version === "latest") {
    path = `releases/latest/download`;
  }
  const os = getOS();
  const arch = getArch();
  const extension = os === "Windows" ? "zip" : "tar.gz";
  const filename = `${CLOUD_RESOURCE_TAGGER_REPO}_${version}_${os}_${arch}.${extension}`;
  const url = `https://github.com/${ORGANIZATION}/${CLOUD_RESOURCE_TAGGER_REPO}/${path}/${filename}`;
  core.debug(`Download url is ${url}`);
  return url;
}
