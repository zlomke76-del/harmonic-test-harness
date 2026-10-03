const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

const readme = read('README.md');
const env = read('.env.example');
const demo = read('examples/raw-vs-governed/run.mjs');
const adapter = read('lib/governance-adapter.ts');
const pkg = JSON.parse(read('package.json'));

must(readme.includes('does **not** contain the private Harmonic runtime'), 'README must state private-core boundary');
must(readme.includes('frozen synthetic proposal fixture'), 'README must not imply a live LLM run');
must(!readme.includes('1 Unjustified HTTP Disclosure'), 'README must not claim an external HTTP disclosure');
must(!env.includes('/api/governance-pack'), '.env.example must not advertise retired direct Governance Pack endpoint');
must(env.includes('/api/evaluate'), '.env.example must document current single-call endpoint');
must(!demo.includes('"ADMISSIBLE", "PASS", "PASSED"'), 'demo must not treat descriptive PASS/ADMISSIBLE labels as execution permission');
must(demo.includes('admissible === true && explicitPermit'), 'demo must require admissible=true plus explicit permit');
must(!adapter.includes('"PASS", "PASSED", "APPROVE", "APPROVED", "CONTACT_CONFIRMED", "AUTHORITY_CONTINUOUS", "ADMISSIBLE", "PERMITTED"'), 'adapter must not map generic evidence/domain labels to ALLOW');
must(pkg.private === true, 'package must remain npm-private to prevent accidental publication');
must(pkg.name === 'harmonic-public-test-harness', 'package name must identify public harness');
must(fs.existsSync(path.join(root, 'docs/history/root-lineage')), 'historical lineage must be separated from onboarding surface');
must(fs.existsSync(path.join(root, 'docs/public/BREAK_THIS_FIRST.md')), 'public falsification target must exist');
must(fs.existsSync(path.join(root, '.github/ISSUE_TEMPLATE/falsification.yml')), 'falsification issue form must exist');
must(fs.existsSync(path.join(root, '.github/ISSUE_TEMPLATE/reproduction.yml')), 'reproduction issue form must exist');
must(fs.existsSync(path.join(root, '.github/pull_request_template.md')), 'public PR evidence template must exist');
must(fs.existsSync(path.join(root, 'CONTRIBUTING.md')), 'contribution guidance must exist');
must(fs.existsSync(path.join(root, 'SECURITY.md')), 'security disclosure guidance must exist');

const secretPattern = /(hs_live_[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9_-]{20,}|vck_[A-Za-z0-9_-]{12,})/g;
for (const file of ['README.md', '.env.example', 'examples/raw-vs-governed/README.md', 'examples/raw-vs-governed/run.mjs']) {
  const hits = read(file).match(secretPattern) || [];
  must(hits.length === 0, `${file} appears to contain a live-looking secret`);
}

console.log('public repository contract: PASS');
