import { resolve } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert'
import { getLogs, prepareRuntime, setFixturesDir } from '../../basic/test/helper.js'
import { safeRemove } from '@platformatic/utils'
import { buildServer } from '../../runtime/index.js'
import { request } from 'undici'

setFixturesDir(resolve(import.meta.dirname, './fixtures'))

test('should run the service with custom logger options on json', async t => {
  const { root, config } = await prepareRuntime(t, 'logger-custom-options-json', false, null)

  const originalCwd = process.cwd()
  process.chdir(root)
  const runtime = await buildServer(config.configManager.current, config.args)

  t.after(async () => {
    process.chdir(originalCwd)
    await runtime.close()
    await safeRemove(root)
  })

  await runtime.buildService('runtime')
  const url = await runtime.start()

  await request(url + '/', { method: 'GET' })

  const logs = await getLogs(runtime)

  // Find log entry with 'call route /' in the message
  assert.ok(logs.find(log => {
    try {
      const parsedLog = JSON.parse(log.msg)
      return parsedLog.level === 'DEBUG' &&
        parsedLog.name === 'RUNTIME' &&
        parsedLog.msg === 'call route /' &&
        parsedLog.secret === '***HIDDEN***' &&
        parsedLog.time.length === 24 // isoTime
    } catch { }
    return false
  }))
})

test('should run the service with custom logger options on global this', async t => {
  const { root, config } = await prepareRuntime(t, 'logger-custom-options-global-this', false, null)

  const originalCwd = process.cwd()
  process.chdir(root)
  const runtime = await buildServer(config.configManager.current, config.args)

  t.after(async () => {
    process.chdir(originalCwd)
    await runtime.close()
    await safeRemove(root)
  })

  await runtime.buildService('runtime')
  const url = await runtime.start()

  await request(url + '/', { method: 'GET' })

  const logs = await getLogs(runtime)

  // Check if it contains a log with the right message
  assert.ok(logs.find(l => {
    return l.level === 20 &&
      l.msg === 'call route /' &&
      l.name === 'APP1' &&
      l.secret === '***HIDDEN***'
  }))
})
