#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
scratch=$(mktemp -d)
scratch=$(cd -- "${scratch}" && pwd -P)
trap 'rm -rf -- "${scratch}"' EXIT
current=0123456789abcdef0123456789abcdef01234567
previous=abcdef0123456789abcdef0123456789abcdef01
mkdir -p "${scratch}/"{bin,shared,"releases/${current}","releases/${previous}"}
# Redirect only the fixed staging host path in this temporary script copy.
sed 's|^shared_dir=/opt/flowdesk/shared$|shared_dir=${TEST_SHARED_DIR}|' \
  "${script_dir}/deploy.sh" > "${scratch}/releases/${current}/deploy.sh"
cp "${script_dir}/"{compose.yaml,health-check.sh} "${scratch}/releases/${current}/"
sed 's|/wabrix-|/flowdesk-|g' "${script_dir}/compose.yaml" > "${scratch}/releases/${previous}/compose.yaml"
printf '%s\n' "${previous}" > "${scratch}/shared/current-image"
printf '%s\n' 'PUBLIC_BASE_URL=https://staging.example.com' > "${scratch}/shared/staging.env"
cat > "${scratch}/bin/docker" <<'STUB'
#!/usr/bin/env bash
printf '%s %s\n' "${IMAGE_TAG}" "$*" >> "${TEST_DOCKER_LOG}"
[[ " $* " != *" pull "* ]]
STUB
chmod +x "${scratch}/bin/docker"
export TEST_SHARED_DIR="${scratch}/shared"
export TEST_DOCKER_LOG="${scratch}/docker.log"
export PATH="${scratch}/bin:${PATH}"

if bash "${scratch}/releases/${current}/deploy.sh" "${current}" > "${scratch}/deploy.log" 2>&1; then
  echo "Expected simulated pull failure" >&2
  exit 1
fi
grep -Fq "${current} compose --env-file ${TEST_SHARED_DIR}/staging.env -f compose.yaml --profile release pull" "${TEST_DOCKER_LOG}" || { cat "${scratch}/deploy.log" "${TEST_DOCKER_LOG}" >&2; exit 1; }
grep -Fq "${previous} compose --env-file ${TEST_SHARED_DIR}/staging.env -f ${scratch}/releases/${previous}/compose.yaml up -d --no-build --remove-orphans web api ingress worker scheduler caddy" "${TEST_DOCKER_LOG}" || { cat "${scratch}/deploy.log" "${TEST_DOCKER_LOG}" >&2; exit 1; }
test "$(<"${TEST_SHARED_DIR}/current-image")" = "${previous}"
echo "A failed Wabrix release restored the legacy Compose manifest without changing release state."
