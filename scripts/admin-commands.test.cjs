const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
function load(path, dependencies = {}) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', output)(name => name in dependencies ? dependencies[name] : require(name), module, module.exports)
  return module.exports
}
const policy = load('lib/admin-command-policy.ts')
const commands = load('lib/admin-commands.ts', { 'server-only': {}, '@/lib/db': { pool: {} }, '@/lib/admin-auth': { getAdminSession: async () => null }, '@/lib/admin-command-policy': policy })

function database() {
  let state = { commands: new Map(), staff: new Map(), credentials: new Map(), events: [] }
  let lock = Promise.resolve(), failAudit = false, staffWrites = 0
  const copy = value => structuredClone(value)
  const rows = value => ({ rows: copy(value), rowCount: value.length })
  async function query(sql, args = []) {
    sql = sql.replace(/\s+/g, ' ').trim()
    if (sql.startsWith('LOCK TABLE')) return rows([])
    if (sql.startsWith('INSERT INTO public.admin_commands')) {
      const [id, kind, status, actor_email, summary, payload, preview, target_id, target_fingerprint, created_at, expires_at] = args
      const record = { id, kind, status, actor_email, summary, payload: JSON.parse(payload), preview: JSON.parse(preview), target_id, target_fingerprint, created_at, expires_at, decided_at: null, result: null }
      state.commands.set(id, record); return rows([record])
    }
    if (sql.startsWith('INSERT INTO public.admin_command_events')) {
      if (failAudit) throw new Error('simulated audit storage failure')
      const [id, command_id, actor_email, action, outcome, detail] = args
      state.events.push({ id, command_id, actor_email, action, outcome, detail: JSON.parse(detail), created_at: new Date() }); return rows([])
    }
    if (sql.startsWith('UPDATE public.admin_commands')) {
      const [status, result, email, id] = args, row = state.commands.get(id)
      Object.assign(row, { status, result: JSON.parse(result), decided_by: email, decided_at: new Date() }); return rows([row])
    }
    if (sql.includes('FROM public.admin_commands')) {
      if (sql.includes('WHERE id')) { const row = state.commands.get(args[0]); return rows(row && row.actor_email === args[1] ? [row] : []) }
      return rows([...state.commands.values()].filter(r => r.actor_email === args[0]).slice(0,args[1]))
    }
    if (sql.includes('FROM public.admin_command_events')) return rows(state.events.filter(e => e.command_id === args[0] && e.actor_email === args[1]))
    if (sql.startsWith('INSERT INTO public.staff_members')) {
      const [id,name,email,role,department,title] = args, row = { id,name,email,role,department,title,status:'active',version:'1' }
      state.staff.set(id,row); staffWrites++; return rows([row])
    }
    if (sql.startsWith('UPDATE public.staff_members')) { const row=state.staff.get(args[1]); row.role=args[0]; row.version=String(Number(row.version)+1); staffWrites++; return rows([row]) }
    if (sql.startsWith('UPDATE public.staff_credentials')) { if (!state.credentials.has(args[0])) return rows([]); state.credentials.set(args[0],state.credentials.get(args[0])+1); return rows([{staff_id:args[0]}]) }
    if (sql.includes('FROM public.staff_members')) {
      if (sql.includes('lower(trim(email))')) return rows([...state.staff.values()].filter(s => s.email.trim().toLowerCase() === args[0]).slice(0,1))
      if (sql.includes('WHERE id')) { const s = state.staff.get(args[0]); return rows(s ? [s] : []) }
      return rows([...state.staff.values()].slice(0,args[3] || 20))
    }
    throw new Error(`Unhandled fixture query: ${sql}`)
  }
  return {
    get state() { return state }, get staffWrites() { return staffWrites }, set failAudit(value) { failAudit=value }, query,
    async connect() {
      let releaseLock, snapshot
      return { async query(sql,args) {
        if (sql === 'BEGIN') { const prior=lock; lock=new Promise(resolve => { releaseLock=resolve }); await prior; snapshot=copy(state); return rows([]) }
        if (sql === 'COMMIT') { snapshot=null; releaseLock?.(); releaseLock=null; return rows([]) }
        if (sql === 'ROLLBACK') { if(snapshot)state=snapshot; snapshot=null; releaseLock?.(); releaseLock=null; return rows([]) }
        return query(sql,args)
      }, release() { releaseLock?.() } }
    },
  }
}
function fixture() {
  const db=database(); let email='admin@example.com', clock=new Date('2026-11-28T12:00:00Z')
  const service=commands.createAdminCommandService({ database:db, session:async()=>email?{email}:null, now:()=>clock })
  return {db,service,setEmail(value){email=value},advance(minutes){clock=new Date(clock.getTime()+minutes*60000)}}
}
const staff = { id:'staff_existing',name:'Alex Example',email:'alex@example.com',role:'sales_agent',department:'Sales',title:'Agent',status:'active',version:'100.000001' }
const creation = { name:'Taylor Example',email:'taylor@example.com',role:'support_team' }

test('staff commands reject privilege escalation, credentials, and unapproved extra fields',()=>{
  assert.equal(policy.staffCreationSchema.safeParse({...creation,role:'admin'}).success,false)
  assert.equal(policy.staffCreationSchema.safeParse({...creation,password:'never accept'}).success,false)
  assert.equal(policy.commandDecisionSchema.safeParse({decision:'approve',role:'developer_team'}).success,false)
  assert.equal(policy.staffRoleChangeSchema.safeParse({staffId:'staff_existing',role:'administrator'}).success,false)
})

test('no staff write occurs during preparation; approved profile is created once without identity provisioning',async()=>{
  const f=fixture(), command=await f.service.prepareStaffCreation(creation)
  assert.equal(command.status,'pending_approval');assert.equal(command.preview.provisioning,'profile_only');assert.equal(f.db.state.staff.size,0)
  const [a,b]=await Promise.all([f.service.decideAdminCommand(command.commandId,'approve'),f.service.decideAdminCommand(command.commandId,'approve')])
  assert.equal(a.status,'completed');assert.equal(b.status,'completed');assert.equal(f.db.staffWrites,1)
  assert.equal(a.result.invitationSent,false);assert.equal(f.db.state.credentials.size,0)
  assert.equal(a.result.sourceUrl,'/admin/team')
  assert.equal((await f.service.searchStaff({})).sourceUrl,'/admin/team')
  assert.match(readFileSync('app/admin/team/page.tsx','utf8'),/export default/)
  assert.equal(f.db.state.events.filter(e=>e.action==='staff_profile_created').length,1)
})

test('commands require a current server admin session and belong to that administrator',async()=>{
  const f=fixture(), command=await f.service.prepareStaffCreation(creation)
  f.setEmail('other-admin@example.com')
  await assert.rejects(f.service.getAdminCommandStatus(command.commandId),error=>error.status===404)
  await assert.rejects(f.service.decideAdminCommand(command.commandId,'approve'),error=>error.status===404)
  f.setEmail(null)
  await assert.rejects(f.service.prepareStaffCreation(creation),error=>error.status===401)
  assert.equal(f.db.state.staff.size,0)
})

test('authorization failure is closed and does not expose provider details',async()=>{
  const service=commands.createAdminCommandService({database:database(),session:async()=>{throw new Error('postgres://private-provider-details')}})
  await assert.rejects(service.prepareStaffCreation(creation),error=>error.code==='AUTH_UNAVAILABLE'&&!error.message.includes('postgres'))
})

test('denial and expiry cannot be converted into a later approval',async()=>{
  const f=fixture(), first=await f.service.prepareStaffCreation(creation)
  assert.equal((await f.service.decideAdminCommand(first.commandId,'deny')).status,'denied')
  await assert.rejects(f.service.decideAdminCommand(first.commandId,'approve'),error=>error.code==='COMMAND_NOT_PENDING')
  const second=await f.service.prepareStaffCreation(creation);f.advance(16)
  assert.equal((await f.service.getAdminCommandStatus(second.commandId)).status,'expired')
  assert.equal((await f.service.decideAdminCommand(second.commandId,'approve')).status,'expired')
  assert.equal(f.db.state.staff.size,0)
})

test('approval rechecks duplicate emails and stale role previews',async()=>{
  const f=fixture(), creationCommand=await f.service.prepareStaffCreation(creation)
  f.db.state.staff.set('other',{...staff,id:'other',email:creation.email})
  assert.equal((await f.service.decideAdminCommand(creationCommand.commandId,'approve')).status,'stale')
  f.db.state.staff.set(staff.id,{...staff})
  const roleCommand=await f.service.prepareStaffRoleChange({staffId:staff.id,role:'developer_team'})
  f.db.state.staff.get(staff.id).version='100.000002'
  assert.equal((await f.service.decideAdminCommand(roleCommand.commandId,'approve')).status,'stale')
  assert.equal(f.db.state.staff.get(staff.id).role,'sales_agent')
})

test('approved role change updates the existing profile and invalidates existing credential sessions',async()=>{
  const f=fixture();f.db.state.staff.set(staff.id,{...staff});f.db.state.credentials.set(staff.id,8)
  const command=await f.service.prepareStaffRoleChange({staffId:staff.id,role:'support_team',reason:'Move to customer support.'})
  assert.equal(command.preview.currentRole,'sales_agent');assert.equal(f.db.state.staff.get(staff.id).role,'sales_agent')
  const result=await f.service.decideAdminCommand(command.commandId,'approve')
  assert.equal(result.status,'completed');assert.equal(f.db.state.staff.get(staff.id).role,'support_team');assert.equal(f.db.state.credentials.get(staff.id),9)
  assert.equal(result.result.staff.status,'active');assert.equal(f.db.state.staff.size,1)
  assert.equal(result.result.sourceUrl,'/admin/team')
})

test('staff mutation and completion status roll back if audit persistence fails',async()=>{
  const f=fixture(), command=await f.service.prepareStaffCreation(creation)
  f.db.failAudit=true
  await assert.rejects(f.service.decideAdminCommand(command.commandId,'approve'),error=>error.status===503)
  assert.equal(f.db.state.staff.size,0);assert.equal(f.db.state.commands.get(command.commandId).status,'pending_approval')
})

test('development and regression commands save plans with no executable approval or false test results',async()=>{
  const f=fixture(), command=await f.service.planDevelopmentTask({kind:'regression',goal:'Verify staff creation and role changes',scope:['lib/admin-commands.ts']})
  assert.equal(command.status,'planned');assert.equal(command.canApprove,false);assert.equal(command.preview.executionStatus,'not_run');assert.equal(command.preview.runnerAvailable,false)
  assert.ok(command.preview.checks.some(check=>check.includes('pnpm run typecheck')))
  assert.ok(JSON.parse(readFileSync('package.json','utf8')).scripts.typecheck)
  await assert.rejects(f.service.decideAdminCommand(command.commandId,'approve'),error=>error.code==='COMMAND_NOT_PENDING')
  assert.equal(f.db.staffWrites,0)
})

test('reports and products department guides point at connected evidence tools',()=>{
  assert.ok(policy.getAdminDepartmentGuide('reports').tools.includes('getBusinessMetrics'))
  assert.ok(policy.getAdminDepartmentGuide('reports').tools.includes('getRecordedWorkReport'))
  assert.ok(policy.getAdminDepartmentGuide('reports').tools.includes('getGoogleFeedHistory'))
  assert.match(policy.getAdminDepartmentGuide('reports').limitations,/Unavailable sections/)
  assert.ok(policy.getAdminDepartmentGuide('products').tools.includes('searchProducts'))
  assert.match(policy.getAdminDepartmentGuide('buying').limitations,/not connected/)
})

test('approval route rejects unauthenticated, cross-origin, oversized, and argument-tampering requests',async()=>{
  let session={email:'admin@example.com'}, calls=0
  const revalidated=[]
  const route=load('app/api/admin/commands/[id]/route.ts',{
    'next/cache':{revalidatePath:path=>revalidated.push(path)},'@/lib/admin-auth':{getAdminSession:async()=>session},'@/lib/admin-command-policy':policy,
    '@/lib/admin-commands':{AdminCommandError:commands.AdminCommandError,decideAdminCommand:async()=>{calls++;return {status:'completed'}},getAdminCommandStatus:async()=>({status:'planned'})},
  })
  const context={params:Promise.resolve({id:'12345678-1234-4234-9234-123456789012'})}
  const request=(body,origin='https://store.example')=>new Request('https://store.example/api/admin/commands/test',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})
  session=null;assert.equal((await route.POST(request({decision:'approve'}),context)).status,401)
  session={email:'admin@example.com'};assert.equal((await route.POST(request({decision:'approve'},'https://evil.example'),context)).status,403)
  assert.equal((await route.POST(request({decision:'approve',role:'admin'}),context)).status,400)
  assert.equal((await route.POST(request({decision:'approve',extra:'x'.repeat(2000)}),context)).status,413)
  assert.equal(calls,0)
  assert.equal((await route.POST(request({decision:'approve'}),context)).status,200);assert.equal(calls,1)
  assert.deepEqual(revalidated,['/admin/team'])
})

test('the model can prepare commands but cannot call the execution service',()=>{
  const assistant=readFileSync('lib/admin-assistant.ts','utf8')
  assert.match(assistant,/prepareStaffCreation: tool\(/)
  assert.match(assistant,/prepareStaffRoleChange: tool\(/)
  assert.doesNotMatch(assistant,/decideAdminCommand/)
  assert.doesNotMatch(readFileSync('lib/admin-commands.ts','utf8'),/CREATE TABLE/)
  assert.match(readFileSync('components/admin/assistant-panel.tsx','utf8'),/result.sourceUrl === '\/admin\/team'.*href="\/admin\/team"/)
})
