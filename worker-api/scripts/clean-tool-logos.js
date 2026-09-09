#!/usr/bin/env node
/**
 * 清空 opc_departments.tools 里所有工具的 logo 字段
 * 然后只保留精确匹配 nav_sites 的正确 logo
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const DB = 'aiopc-db';
const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';

function runSql(sql) {
    const tmpFile = path.join(__dirname, '_tmp.sql');
    fs.writeFileSync(tmpFile, sql);
    try {
        const cmd = `npx wrangler d1 execute ${DB} ${flag} --file ${tmpFile}`;
        const out = execSync(cmd, { encoding: 'utf-8', cwd: __dirname + '/..', maxBuffer: 10 * 1024 * 1024 });
        const jsonStart = out.indexOf('[');
        if (jsonStart === -1) return [];
        const json = JSON.parse(out.slice(jsonStart));
        if (Array.isArray(json) && json[0] && json[0].results) return json[0].results;
    } catch (e) { console.error('SQL error:', e.message.slice(0, 200)); }
    finally { try { fs.unlinkSync(tmpFile); } catch {} }
    return [];
}

function runSqlNoResult(sql) {
    const tmpFile = path.join(__dirname, '_tmp.sql');
    fs.writeFileSync(tmpFile, sql);
    try {
        execSync(`npx wrangler d1 execute ${DB} ${flag} --file ${tmpFile}`, { encoding: 'utf-8', cwd: __dirname + '/..', maxBuffer: 10 * 1024 * 1024 });
    } catch (e) { console.error('SQL error:', e.message.slice(0, 200)); }
    finally { try { fs.unlinkSync(tmpFile); } catch {} }
}

// 读取 nav_sites 精确映射
console.log('读取 nav_sites...');
const siteRows = runSql('SELECT name, logo FROM nav_sites WHERE logo != "" AND logo IS NOT NULL');
const siteLogoMap = {};
siteRows.forEach(r => { siteLogoMap[r.name] = r.logo; });
console.log(`  nav_sites 有 ${Object.keys(siteLogoMap).length} 个 logo`);

// 读取所有部门
console.log('读取 opc_departments...');
const deptRows = runSql('SELECT id, tools FROM opc_departments');
console.log(`  共 ${deptRows.length} 个部门`);

let patched = 0;
let totalTools = 0;
let cleared = 0;
let exactMatched = 0;

for (const dept of deptRows) {
    let tools;
    try { tools = JSON.parse(dept.tools); } catch { continue; }
    if (!Array.isArray(tools)) continue;

    let changed = false;
    for (const t of tools) {
        totalTools++;
        // 先清掉所有 logo
        if (t.logo) {
            delete t.logo;
            changed = true;
            cleared++;
        }
        // 精确匹配 nav_sites
        if (t.name && siteLogoMap[t.name]) {
            t.logo = siteLogoMap[t.name];
            exactMatched++;
        }
    }

    if (changed) {
        const newTools = JSON.stringify(tools);
        const escaped = newTools.replace(/'/g, "''");
        runSqlNoResult(`UPDATE opc_departments SET tools = '${escaped}' WHERE id = ${dept.id}`);
        patched++;
    }
}

console.log(`\n完成！`);
console.log(`  清除 logo: ${cleared} 个`);
console.log(`  精确匹配恢复: ${exactMatched} 个`);
console.log(`  更新部门: ${patched} 个`);
