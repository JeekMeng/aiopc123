#!/usr/bin/env node
/**
 * 补丁脚本：给 opc_departments.tools JSON 里没有 logo 的工具补上 logo
 * 用法：
 *   本地：node scripts/patch-tool-logos.js
 *   远程：node scripts/patch-tool-logos.js --remote
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const DB = 'aiopc-db';
const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';

function runSql(sql) {
    // 写入临时 SQL 文件，避免 shell 转义问题
    const tmpFile = path.join(__dirname, '_tmp.sql');
    fs.writeFileSync(tmpFile, sql);
    try {
        const cmd = `npx wrangler d1 execute ${DB} ${flag} --file ${tmpFile}`;
        const out = execSync(cmd, { encoding: 'utf-8', cwd: __dirname + '/..', maxBuffer: 10 * 1024 * 1024 });
        const jsonStart = out.indexOf('[');
        if (jsonStart === -1) return [];
        const json = JSON.parse(out.slice(jsonStart));
        if (Array.isArray(json) && json[0] && json[0].results) {
            return json[0].results;
        }
    } catch (e) { console.error('SQL error:', e.message.slice(0, 200)); }
    finally { try { fs.unlinkSync(tmpFile); } catch {} }
    return [];
}

// 工具名 → logo 文件名 映射（精确匹配）
const LOGO_MAP = {
    '豆包': '200295.webp',
    '千问': '200300.webp',
    '腾讯元宝': '200297.webp',
    '小红书': '200119.webp',
    '天眼查': '200012.webp',
    '企查查': '200011.webp',
    '百度统计': '200450.webp',
    '51LA': '200449.webp',
    'GrowingIO': '200153.webp',
    '站长工具': '200110.webp',
    '爱站网': '200112.webp',
};

// 1. 读取所有 nav_sites 的 name→logo 映射
console.log('读取 nav_sites...');
const siteRows = runSql('SELECT name, logo FROM nav_sites WHERE logo != "" AND logo IS NOT NULL');
const siteLogoMap = {};
siteRows.forEach(r => { siteLogoMap[r.name] = r.logo; });
console.log(`  nav_sites 有 ${Object.keys(siteLogoMap).length} 个 logo`);

// 2. 读取所有 opc_departments
console.log('读取 opc_departments...');
const deptRows = runSql('SELECT id, tools FROM opc_departments');
console.log(`  共 ${deptRows.length} 个部门`);

let patched = 0;
let totalTools = 0;
let logoAdded = 0;

for (const dept of deptRows) {
    let tools;
    try { tools = JSON.parse(dept.tools); } catch { continue; }
    if (!Array.isArray(tools)) continue;

    let changed = false;
    for (const t of tools) {
        totalTools++;
        if (t.logo) continue; // 已有 logo，跳过

        // 先查 LOGO_MAP
        let logo = LOGO_MAP[t.name] || '';
        // 再查 nav_sites
        if (!logo && t.name) {
            for (const [siteName, siteLogo] of Object.entries(siteLogoMap)) {
                if (t.name.indexOf(siteName) !== -1 || siteName.indexOf(t.name) !== -1) {
                    logo = siteLogo;
                    break;
                }
            }
        }
        if (logo) {
            t.logo = logo;
            changed = true;
            logoAdded++;
        }
    }

    if (changed) {
        const newTools = JSON.stringify(tools);
        // SQL 字符串用单引号，内部单引号用两个单引号转义
        const escaped = newTools.replace(/'/g, "''");
        const sql = `UPDATE opc_departments SET tools = '${escaped}' WHERE id = ${dept.id};`;
        const tmpFile = path.join(__dirname, '_tmp.sql');
        fs.writeFileSync(tmpFile, sql);
        try {
            execSync(`npx wrangler d1 execute ${DB} ${flag} --file ${tmpFile}`, { encoding: 'utf-8', cwd: __dirname + '/..', maxBuffer: 10 * 1024 * 1024 });
            patched++;
        } catch (e) { console.error('Update error:', e.message.slice(0, 200)); }
        finally { try { fs.unlinkSync(tmpFile); } catch {} }
    }
}

console.log(`\n完成！共 ${totalTools} 个工具，补了 ${logoAdded} 个 logo，更新了 ${patched} 个部门`);
