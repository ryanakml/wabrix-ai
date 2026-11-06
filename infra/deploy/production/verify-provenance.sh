#!/usr/bin/env bash
set -Eeuo pipefail

source_sha=${1:-}
output_file=${2:-artifacts/provenance/image-digests.json}
image_family=${3:-wabrix}

if [[ -z ${source_sha} ]]; then
  echo "::error::Source SHA argument is required." >&2
  exit 1
fi
if [[ ! ${source_sha} =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::Release SHA '${source_sha}' is invalid. Production promotion strictly requires an immutable 40-character commit SHA." >&2
  exit 1
fi
case ${image_family} in
  wabrix|flowdesk) ;;
  *) echo "::error::Image family must be wabrix or flowdesk." >&2; exit 1 ;;
esac

apps=(web api ingress worker scheduler migrator)
resolved_digests=()
for app in "${apps[@]}"; do
  repository="ghcr.io/ryanakml/${image_family}-${app}"
  image_tag="${repository}:${source_sha}"
  digest=""
  if [[ ${FLOWDESK_MOCK_PROVENANCE:-false} == true ]]; then
    digest=$(node -e 'console.log("sha256:" + require("crypto").createHash("sha256").update(process.argv[1]).digest("hex"))' "${image_tag}")
  else
    # Resolve the registry manifest/index digest, never the image config digest.
    if command -v docker >/dev/null 2>&1; then
      digest=$(docker buildx imagetools inspect "${image_tag}" --format '{{.Manifest.Digest}}' || true)
    fi
    if [[ ! ${digest} =~ ^sha256:[0-9a-f]{64}$ ]] && command -v crane >/dev/null 2>&1; then
      digest=$(crane digest "${image_tag}" || true)
    fi
  fi
  if [[ ! ${digest} =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "::error::Could not resolve a registry manifest digest for ${image_tag}." >&2
    exit 1
  fi

  immutable_ref="${repository}@${digest}"
  echo "${app}: ${immutable_ref}"
  resolved_digests+=("${app}=${immutable_ref}")
done

mkdir -p "$(dirname "${output_file}")"
node - "${source_sha}" "${output_file}" "${resolved_digests[@]}" <<'JS'
const fs = require("fs");
const [sourceSha, outputFile, ...entries] = process.argv.slice(2);
const digests = Object.fromEntries(entries.map((entry) => entry.split("=")));
fs.writeFileSync(outputFile, JSON.stringify({ sourceSha, verifiedAt: new Date().toISOString(), digests }, null, 2));
JS
echo "Verified all six release images in ${output_file}."
