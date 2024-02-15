import semver from "semver";
import { template } from "lodash-es";
import { FIRST_RELEASE } from "./definitions/constants.js";
import { getLatestVersion, highest, isSameChannel, tagsToVersions } from "./utils.js";

export default ({
  branch,
  envCi: {commit, build},
  nextRelease: {type, channel},
  lastRelease,
  logger,
  prereleaseBuildFormat
}) => {
  const buildVersion = build.replace(/^.*_(\d*).(\d*).(\d*).(\d*)$/, '$1-$2-$3.$4')

  let version;
  if (lastRelease.version) {
    const { major, minor, patch } = semver.parse(lastRelease.version);

    if (branch.type === "prerelease") {
      if (
        semver.prerelease(lastRelease.version) &&
        lastRelease.channels.some((lastReleaseChannel) => isSameChannel(lastReleaseChannel, channel))
      ) {
        version = highest(
          `${major}.${minor}.${patch}-${branch.prerelease}.${buildVersion}`,
          `${semver.inc(getLatestVersion(tagsToVersions(branch.tags), { withPrerelease: true }), type)}-${
            branch.prerelease
          }.${buildVersion}`
        );
      } else {
        version = `${semver.inc(`${major}.${minor}.${patch}`, type)}-${branch.prerelease}.${buildVersion}`;
      }
    } else {
      version = semver.inc(lastRelease.version, type);
    }
  } else {
    version = branch.type === "prerelease" ? `${FIRST_RELEASE}-${branch.prerelease}.${buildVersion}` : FIRST_RELEASE;
    logger.log("There is no previous release");
  }

  if (branch.type === "prerelease" && prereleaseBuildFormat) {
    version += `+${template(prereleaseBuildFormat)({build, commit})}`;
  }

  logger.log('The next release version is %s', version);

  return version;
};
