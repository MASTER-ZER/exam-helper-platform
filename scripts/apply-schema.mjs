import { readFileSync } from 'fs'
import pg from 'pg'

const schemaSQL = readFileSync('supabase/schema.sql', 'utf8')
const policiesSQL = readFileSync('supabase/policies.sql', 'utf8')

const connectionString =
  'postgresql://postgres.guhaegrpfeddgatxwgfm:K1CEHCq6W7w1PE5q@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

const pool = new pg.Pool({ connectionString })

function splitSQL(sql) {
  const statements = []
  let current = ''
  let i = 0

  while (i < sql.length) {
    const ch = sql[i]

    // Skip single-line comments
    if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++
      i++
      continue
    }

    // Skip block comments
    if (ch === '/' && sql[i + 1] === '*') {
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i += 2
      continue
    }

    // Handle string literals
    if (ch === "'") {
      current += ch
      i++
      while (i < sql.length) {
        current += sql[i]
        if (sql[i] === "'" && sql[i - 1] !== '\\') {
          // Check for escaped quote ''
          if (sql[i + 1] === "'") {
            i++
            current += sql[i]
          } else {
            break
          }
        }
        i++
      }
      i++
      continue
    }

    // Handle dollar-quoted strings ($$ ... $$ or $tag$ ... $tag$)
    if (ch === '$') {
      let tagStart = i
      let tagEnd = i + 1
      while (tagEnd < sql.length && sql[tagEnd] !== '$' && sql[tagEnd] !== ' ') {
        tagEnd++
      }
      if (tagEnd < sql.length && sql[tagEnd] === '$') {
        const tag = sql.substring(tagStart, tagEnd + 1) // $tag$ or $$
        const bodyStart = tagEnd + 1
        const closingTag = tag
        const bodyEnd = sql.indexOf(closingTag, bodyStart)
        if (bodyEnd > bodyStart) {
          current += sql.substring(tagStart, bodyEnd + closingTag.length)
          i = bodyEnd + closingTag.length
          continue
        }
      }
    }

    if (ch === ';') {
      const trimmed = current.trim()
      if (trimmed) statements.push(trimmed)
      current = ''
    } else {
      current += ch
    }
    i++
  }

  const trimmed = current.trim()
  if (trimmed) statements.push(trimmed)

  return statements
}

async function runSQL(sql, label) {
  console.log(`\n=== Applying ${label} ===`)
  const statements = splitSQL(sql)

  console.log(`Found ${statements.length} statements to execute`)

  let success = 0
  let failed = 0

  for (let idx = 0; idx < statements.length; idx++) {
    const stmt = statements[idx]
    try {
      await pool.query(stmt)
      const preview = stmt.substring(0, 80).replace(/\n/g, ' ').trim()
      console.log(`✓ [${idx + 1}] ${preview}...`)
      success++
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`∼ [${idx + 1}] Already exists`)
        success++
      } else {
        console.error(`✗ [${idx + 1}] ${err.message}`)
        failed++
      }
    }
  }

  console.log(`\n${label}: ${success} succeeded, ${failed} failed`)
  return failed === 0
}

async function main() {
  try {
    const schemaOk = await runSQL(schemaSQL, 'Schema')
    const policiesOk = await runSQL(policiesSQL, 'Policies')

    if (schemaOk && policiesOk) {
      console.log('\n✅ All SQL applied successfully!')
    } else {
      console.log('\n⚠️ Some SQL had errors (check above)')
    }
  } catch (err) {
    console.error('Fatal error:', err.message)
  } finally {
    await pool.end()
  }
}

main()
