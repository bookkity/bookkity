#!/usr/bin/env python3
"""Query every exact npm package/version in a lockfile, including optional/dev packages."""
import datetime
import hashlib
import json
import sys
import urllib.request


def request(path, data=None):
    body = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request('https://api.osv.dev/v1/' + path, data=body,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.load(response)


def main():
    lock_path, output = sys.argv[1:]
    raw = open(lock_path, 'rb').read()
    lock = json.loads(raw)
    packages = {}
    for path, info in lock['packages'].items():
        if not path:
            continue
        if info.get('link') or not info.get('version'):
            raise ValueError('Unsupported lock entry: ' + path)
        name = info.get('name', path.rsplit('node_modules/', 1)[-1])
        packages.setdefault((name, info['version']), []).append(path)
    findings = []
    entries = sorted(packages)
    for start in range(0, len(entries), 100):
        pending = [(pair, {'package': {'ecosystem': 'npm', 'name': pair[0]},
                           'version': pair[1]}) for pair in entries[start:start + 100]]
        while pending:
            results = request('querybatch', {'queries': [query for _, query in pending]})['results']
            if len(results) != len(pending):
                raise ValueError('Incomplete OSV response')
            next_page = []
            for (pair, query), result in zip(pending, results):
                for vuln in result.get('vulns', []):
                    findings.append({'name': pair[0], 'version': pair[1],
                                     'paths': packages[pair], **vuln})
                if result.get('next_page_token'):
                    next_page.append((pair, {**query, 'page_token': result['next_page_token']}))
            pending = next_page
    advisories = {vid: request('vulns/' + vid) for vid in sorted({f['id'] for f in findings})}
    report = {'queried_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'lockfile_sha256': hashlib.sha256(raw).hexdigest(),
              'package_versions': len(entries), 'package_locations': sum(map(len, packages.values())),
              'findings': findings, 'advisories': advisories}
    with open(output, 'w') as stream:
        json.dump(report, stream, indent=2)
        stream.write('\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'advisories'}, indent=2))
    return bool(findings)


if __name__ == '__main__':
    sys.exit(main())
