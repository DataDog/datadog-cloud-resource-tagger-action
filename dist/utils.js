"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloadUrl = exports.getLatestReleaseVersion = exports.CLOUD_RESOURCE_TAGGER_REPO = void 0;
const os_1 = __importDefault(require("os"));
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const ORGANIZATION = "Datadog";
exports.CLOUD_RESOURCE_TAGGER_REPO = "datadog-cloud-resource-tagger";
function getArch() {
    const arch = os_1.default.arch();
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
function getOS() {
    const platform = os_1.default.platform();
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
function getLatestReleaseVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const octokit = new rest_1.Octokit();
        const response = yield octokit.rest.repos.getLatestRelease({
            owner: ORGANIZATION,
            repo: exports.CLOUD_RESOURCE_TAGGER_REPO,
        });
        if (!response.data.name)
            throw new Error("Couldn't find latest version!");
        return response.data.name;
    });
}
exports.getLatestReleaseVersion = getLatestReleaseVersion;
function getDownloadUrl(version) {
    let path = `releases/download/v${version}`;
    if (version === "latest") {
        path = `releases/latest/download`;
    }
    const os = getOS();
    const arch = getArch();
    const extension = os === "Windows" ? "zip" : "tar.gz";
    const filename = `${exports.CLOUD_RESOURCE_TAGGER_REPO}_${version}_${os}_${arch}.${extension}`;
    const url = `https://github.com/${ORGANIZATION}/${exports.CLOUD_RESOURCE_TAGGER_REPO}/${path}/${filename}`;
    core.debug(`Download url is ${url}`);
    return url;
}
exports.getDownloadUrl = getDownloadUrl;
