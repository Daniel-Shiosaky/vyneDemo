#!/usr/bin/env node
/**
 * Renders the Playwright JUnit results as a markdown table on the GitHub Actions run page.
 *
 * Usage:  node scripts/ci-summary.mjs "<heading>"
 *
 * Reads `test-results/junit.xml` (written by the junit reporter configured in
 * playwright.config.ts) and appends markdown to the file named by $GITHUB_STEP_SUMMARY.
 * Outside Actions that variable is unset, so it prints to stdout instead — which is how you
 * preview the output locally.
 *
 * Deliberately dependency-free. The XML comes from one known generator with a flat, stable
 * shape, so targeted regexes are enough and are cheaper than pulling in an XML parser.
 *
 * This script must never fail the build: the test step already decides pass/fail. Any problem
 * here is reported as a note in the summary and exits 0.
 */
import fs from 'node:fs';

const JUNIT_PATH = 'test-results/junit.xml';
const heading = process.argv[2] ?? 'Test results';
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

/** Appends to the Actions summary, or prints locally when not running in Actions. */
function emit(markdown) {
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `${markdown}\n`);
    return;
  }
  process.stdout.write(`${markdown}\n`);
}

/** Decodes the XML entities Playwright escapes in test names and failure messages. */
function decodeXmlEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** Escapes the pipe character so a test name cannot break the markdown table. */
function escapeForTableCell(text) {
  return text.replace(/\|/g, '\\|');
}

function readAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1] ?? '';
}

function formatDuration(seconds) {
  const value = Number.parseFloat(seconds);
  if (Number.isNaN(value)) return '—';
  return value >= 1 ? `${value.toFixed(1)}s` : `${Math.round(value * 1000)}ms`;
}

function parseTestCases(xml) {
  const testCases = [];
  // Each <testcase ...> either self-closes or wraps <failure>/<skipped> children.
  const testCasePattern = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;

  for (const match of xml.matchAll(testCasePattern)) {
    const attributes = match[1] ?? '';
    const body = match[3] ?? '';

    const isSkipped = /<skipped\b/.test(body);
    const isFailed = /<(failure|error)\b/.test(body);

    let failureMessage = '';
    if (isFailed) {
      const failureTag = body.match(/<(?:failure|error)\b([^>]*)>/);
      failureMessage = decodeXmlEntities(readAttribute(failureTag?.[1] ?? '', 'message'))
        .split('\n')[0]
        .slice(0, 200);
    }

    testCases.push({
      name: decodeXmlEntities(readAttribute(attributes, 'name')),
      file: decodeXmlEntities(readAttribute(attributes, 'classname')),
      duration: readAttribute(attributes, 'time'),
      status: isFailed ? 'failed' : isSkipped ? 'skipped' : 'passed',
      failureMessage,
    });
  }
  return testCases;
}

function main() {
  if (!fs.existsSync(JUNIT_PATH)) {
    emit(
      `## ${heading}\n\n> No results found at \`${JUNIT_PATH}\` — the run may have crashed before any test executed.`,
    );
    return;
  }

  const xml = fs.readFileSync(JUNIT_PATH, 'utf8');
  const testCases = parseTestCases(xml);

  if (testCases.length === 0) {
    emit(`## ${heading}\n\n> \`${JUNIT_PATH}\` contained no test cases.`);
    return;
  }

  const passed = testCases.filter((testCase) => testCase.status === 'passed');
  const failed = testCases.filter((testCase) => testCase.status === 'failed');
  const skipped = testCases.filter((testCase) => testCase.status === 'skipped');
  const totalSeconds = Number.parseFloat(
    readAttribute(xml.match(/<testsuites\b[^>]*/)?.[0] ?? '', 'time'),
  );

  const overall = failed.length > 0 ? '❌ Failed' : '✅ Passed';

  const lines = [
    `## ${heading} — ${overall}`,
    '',
    '| Total | Passed | Failed | Skipped | Duration |',
    '| ----: | -----: | -----: | ------: | -------: |',
    `| ${testCases.length} | ${passed.length} | ${failed.length} | ${skipped.length} | ${formatDuration(totalSeconds)} |`,
    '',
  ];

  // Failures first and expanded — that is what a reader needs immediately.
  if (failed.length > 0) {
    lines.push('### Failures', '');
    for (const testCase of failed) {
      lines.push(`- **${escapeForTableCell(testCase.name)}**  \`${testCase.file}\``);
      if (testCase.failureMessage) {
        lines.push(`  > ${escapeForTableCell(testCase.failureMessage)}`);
      }
    }
    lines.push('');
  }

  // Full list collapsed, so a green run stays compact but is still inspectable.
  lines.push(
    '<details>',
    `<summary>All ${testCases.length} tests</summary>`,
    '',
    '| | Test | Duration |',
    '| :-: | --- | -------: |',
  );

  const statusIcon = { passed: '✅', failed: '❌', skipped: '⏭️' };
  for (const testCase of testCases) {
    lines.push(
      `| ${statusIcon[testCase.status]} | ${escapeForTableCell(testCase.name)} | ${formatDuration(testCase.duration)} |`,
    );
  }
  lines.push('', '</details>');

  emit(lines.join('\n'));
}

try {
  main();
} catch (error) {
  // Never break the build over a reporting problem.
  emit(
    `## ${heading}\n\n> Could not render the summary: ${error instanceof Error ? error.message : String(error)}`,
  );
}
