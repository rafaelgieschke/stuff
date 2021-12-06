#!/usr/bin/env -S deno run --allow-net --allow-env

const getUrl = (dockerReference, type = "manifests") => {
  const defaultHostname = "index.docker.io";
  // const defaultHostname = "registry-1.docker.io";
  // https://github.com/distribution/distribution/blob/main/reference/reference.go
  const [domain, path, tag, digest] = dockerReference
    .match(/^(?:(.*?)\/)?(.*?)(?::(.*?))?(?:@(.*?))?$/)
    .slice(1);
  if (!domain)
    return getUrl(`${defaultHostname}/library/${dockerReference}`, type);
  if (!String(domain).includes("."))
    return getUrl(`${defaultHostname}/${dockerReference}`, type);
  return `https://${domain}/v2/${path}/${type}/${digest ?? tag ?? "latest"}`;
};

const parseAuthenticate = (header, { toLowerCase = true } = {}) =>
  Object.fromEntries(
    [
      ...header
        .concat(" ,")
        .matchAll(
          /(\S+)\s+((?:\s*[^=\s]+\s*=\s*(?:"(?:[^"]|\\")*"|[^",]*)\s*,)*)/g
        ),
    ].map(([_, authScheme, authParams]) => [
      toLowerCase ? authScheme.toLowerCase() : authScheme,
      Object.fromEntries(
        [
          ...authParams.matchAll(
            /\s*([^=\s]+)\s*=\s*("((?:[^"]|\\")*)"|[^",]*)\s*,/g
          ),
        ].map(([_, key, valueRaw, valueQuoted]) => [
          toLowerCase ? key.toLowerCase() : key,
          valueQuoted ? valueQuoted.replaceAll('\\"', '"') : valueRaw,
        ])
      ),
    ])
  );

const getToken = async (res) => {
const username = Deno.env.get("username");
const password = Deno.env.get("password");
  const {
    bearer: { realm, scope, service },
  } = parseAuthenticate(res1.headers.get("www-authenticate"));
  const auth = await (
    await fetch(`${realm}?${new URLSearchParams({ scope, service })}`,
      { headers: { ...username && { authorization: `basic ${btoa(`${username}:${password}`)}` }}
      })
  ).json();
console.log("auth", auth);
  return `Bearer ${auth.access_token ?? auth.token}`;
};

const fetch2 = async (url, auth) => {
  const res = await fetch(url, {
    headers: {
      ...auth,
      accept: [
        "application/vnd.oci.image.manifest.v1+json",
        "application/vnd.oci.image.index.v1+json",
        "application/vnd.docker.distribution.manifest.v2+json",
        "application/vnd.docker.distribution.manifest.list.v2+json",
      ],
    },
  });
  console.log(res);
  const manifest = await res.json();
  return manifest;
};

const d = (s) => (console.debug(s), s);

console.log(Deno.args);
const url = getUrl(Deno.args[0], Deno.args[1]);
console.log(url);
const res1 = await fetch(url);
console.log("res1", res1);
const auth = res1.status === 401 ? { authorization: await getToken(res1) } : {};

console.log(await fetch2(url, auth));
