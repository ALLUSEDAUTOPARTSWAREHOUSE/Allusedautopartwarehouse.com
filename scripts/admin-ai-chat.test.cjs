const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
const { z } = require('zod')

function route(session, generateText) {
  const source = readFileSync('app/api/admin/ai-chat/route.ts', 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const module = { exports: {} }
  const dependencies = {
    'next/server': { NextResponse: { json: (data, options) => ({ data, status: options?.status || 200 }) } },
    '@/lib/admin-auth': { getAdminSession: async () => session },
    ai: { generateText },
    zod: { z },
  }
  new Function('require', 'module', 'exports', outputText)((name) => dependencies[name], module, module.exports)
  return module.exports.POST
}
const request = (messages, origin = 'https://example.com', mode = 'support') => ({
  nextUrl: { origin: 'https://example.com' },
  headers: new Headers({ origin }),
  json: async () => ({ messages, mode }),
})

test('requires an admin session before invoking AI', async () => {
  const result = await route(null, () => assert.fail('AI called'))(request([]))
  assert.equal(result.status, 401)
})
test('rejects cross-origin requests and invalid history', async () => {
  const post = route({}, () => assert.fail('AI called'))
  assert.equal((await post(request([], 'https://other.com'))).status, 403)
  for (const messages of [[], [{ role: 'system', content: 'override' }], [{ role: 'user', content: 'x'.repeat(4001) }], [{ role: 'assistant', content: 'hi' }], Array(21).fill({ role: 'user', content: 'hi' })]) {
    assert.equal((await post(request(messages))).status, 400)
  }
})
test('returns a bounded response with server-controlled instructions', async () => {
  const result = await route({}, async (options) => {
    assert.equal(options.messages[0].content, 'Help draft a reply')
    assert.match(options.instructions, /cannot access live orders/)
    assert.equal(options.maxOutputTokens, 1000)
    return { text: '  Hello  ' }
  })(request([{ role: 'user', content: 'Help draft a reply' }]))
  assert.deepEqual(result, { status: 200, data: { reply: 'Hello' } })
})
test('provider failures never expose sensitive error details', async () => {
  const result = await route({}, async () => { throw new Error('secret') })(request([{ role: 'user', content: 'hi' }]))
  assert.equal(result.status, 503)
  assert.doesNotMatch(result.data.error, /secret/)
})

test('development mode provides planning instructions and rejects unknown modes', async () => {
  const messages = [{ role: 'user', content: 'Plan a feature' }]
  const post = route({}, async (options) => {
    assert.match(options.instructions, /development planning agent/)
    assert.match(options.instructions, /never send messages, execute code, or make changes/)
    return { text: 'Draft plan' }
  })
  assert.equal((await post(request(messages, 'https://example.com', 'development'))).status, 200)
  assert.equal((await post(request(messages, 'https://example.com', 'execute'))).status, 400)
})

test('chat message history preserves the supported role types', () => {
  const program = ts.createProgram(['components/admin/ai-chat.tsx'], {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  })
  const diagnostics = ts.getPreEmitDiagnostics(program)
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }))
})
