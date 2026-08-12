import { Router, Request } from 'express'
import { AppDependencies } from '../app.js'
import { AppError } from '../middleware/error-handler.js'
import { authenticate, requireAuth, authorize } from '../middleware/auth.js'
import { requireCsrf } from '../services/csrf.js'
import { generateId } from '../lib/id.js'

function personResource(req: Request) {
  return { type: 'person' as const, id: req.params.personId! }
}

export function personRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.use(authenticate(deps.db))

  router.get('/', requireAuth, authorize('person.list'), (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100)
      const cursor = req.query.cursor as string | undefined

      const tree = deps.db.get<{ id: string }>('SELECT id FROM trees LIMIT 1')
      if (!tree) {
        res.json({ items: [] })
        return
      }

      let sql = 'SELECT * FROM people WHERE tree_id = $treeId'
      const params: Record<string, unknown> = { $treeId: tree.id }

      if (cursor) {
        sql += ' AND id > $cursor'
        params.$cursor = cursor
      }

      sql += ' ORDER BY id LIMIT $limit'
      params.$limit = limit + 1

      const rows = deps.db.all<{
        id: string
        tree_id: string
        living_status: string
        privacy: string
        sex: string | null
        notes: string | null
        version: string
        created_at: string
        updated_at: string
      }>(sql, params)

      const hasMore = rows.length > limit
      if (hasMore) rows.pop()

      const items = rows.map((row) => {
        const names = deps.db.all<{
          id: string
          type: string
          display: string
          given: string | null
          surname: string | null
          prefix: string | null
          suffix: string | null
          preferred: number
          language_tag: string | null
        }>('SELECT * FROM person_names WHERE person_id = $pid ORDER BY preferred DESC', { $pid: row.id })

        const facts = deps.db.all<{
          id: string
          type: string
          custom_type: string | null
          value: string | null
          date_kind: string | null
          date_original_text: string | null
          date_start: string | null
          date_end: string | null
          date_calendar: string | null
          place: string | null
          confidence: string
          privacy: string
        }>('SELECT * FROM facts WHERE person_id = $pid', { $pid: row.id })

        return {
          id: row.id,
          treeId: row.tree_id,
          names: names.map((n) => ({
            id: n.id,
            type: n.type,
            display: n.display,
            given: n.given,
            surname: n.surname,
            prefix: n.prefix,
            suffix: n.suffix,
            preferred: n.preferred === 1,
            languageTag: n.language_tag,
          })),
          livingStatus: row.living_status,
          privacy: row.privacy,
          sex: row.sex || undefined,
          notes: row.notes || undefined,
          facts: facts.map((f) => ({
            id: f.id,
            type: f.type,
            customType: f.custom_type || undefined,
            value: f.value || undefined,
            date: f.date_kind ? {
              kind: f.date_kind,
              originalText: f.date_original_text || '',
              start: f.date_start || undefined,
              end: f.date_end || undefined,
              calendar: f.date_calendar || undefined,
            } : undefined,
            place: f.place || undefined,
            confidence: f.confidence,
            privacy: f.privacy,
            citations: [],
          })),
          version: row.version,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      })

      const result: Record<string, unknown> = { items }
      if (hasMore && rows.length > 0) {
        result.nextCursor = rows[rows.length - 1]!.id
      }

      res.json(result)
    } catch (err) {
      next(err)
    }
  })

  router.post('/', requireAuth, authorize('person.create'), (req, res, next) => {
    try {
      requireCsrf(req, deps.db)

      const tree = deps.db.get<{ id: string }>('SELECT id FROM trees LIMIT 1')
      if (!tree) {
        throw new AppError(400, 'no_tree', 'No tree exists')
      }

      const { names, livingStatus, privacy, sex, notes, facts } = req.body

      if (!names || !Array.isArray(names) || names.length === 0) {
        throw new AppError(400, 'validation_error', 'At least one name is required')
      }
      if (!livingStatus) {
        throw new AppError(400, 'validation_error', 'Living status is required')
      }
      if (!privacy) {
        throw new AppError(400, 'validation_error', 'Privacy level is required')
      }

      const personId = generateId()
      const version = generateId()

      deps.db.transaction(() => {
        deps.db.run(
          `INSERT INTO people (id, tree_id, living_status, privacy, sex, notes, version)
           VALUES ($id, $treeId, $livingStatus, $privacy, $sex, $notes, $version)`,
          {
            $id: personId,
            $treeId: tree.id,
            $livingStatus: livingStatus,
            $privacy: privacy,
            $sex: sex || null,
            $notes: notes || null,
            $version: version,
          }
        )

        for (const name of names) {
          deps.db.run(
            `INSERT INTO person_names (id, person_id, type, display, given, surname, prefix, suffix, preferred, language_tag)
             VALUES ($id, $personId, $type, $display, $given, $surname, $prefix, $suffix, $preferred, $languageTag)`,
            {
              $id: generateId(),
              $personId: personId,
              $type: name.type,
              $display: name.display,
              $given: name.given || null,
              $surname: name.surname || null,
              $prefix: name.prefix || null,
              $suffix: name.suffix || null,
              $preferred: name.preferred ? 1 : 0,
              $languageTag: name.languageTag || null,
            }
          )
        }

        if (facts && Array.isArray(facts)) {
          for (const fact of facts) {
            deps.db.run(
              `INSERT INTO facts (id, person_id, type, custom_type, value, date_kind, date_original_text, date_start, date_end, date_calendar, place, confidence, privacy)
               VALUES ($id, $personId, $type, $customType, $value, $dateKind, $dateOriginalText, $dateStart, $dateEnd, $dateCalendar, $place, $confidence, $privacy)`,
              {
                $id: generateId(),
                $personId: personId,
                $type: fact.type,
                $customType: fact.customType || null,
                $value: fact.value || null,
                $dateKind: fact.date?.kind || null,
                $dateOriginalText: fact.date?.originalText || null,
                $dateStart: fact.date?.start || null,
                $dateEnd: fact.date?.end || null,
                $dateCalendar: fact.date?.calendar || null,
                $place: fact.place || null,
                $confidence: fact.confidence || 'unknown',
                $privacy: fact.privacy || 'members',
              }
            )
          }
        }
      })

      const person = deps.db.get<{
        id: string
        tree_id: string
        living_status: string
        privacy: string
        sex: string | null
        notes: string | null
        version: string
        created_at: string
        updated_at: string
      }>('SELECT * FROM people WHERE id = $id', { $id: personId })

      res.status(201).json({
        id: person!.id,
        treeId: person!.tree_id,
        names: names.map((n: Record<string, unknown>) => ({ id: generateId(), ...n })),
        livingStatus: person!.living_status,
        privacy: person!.privacy,
        sex: person!.sex || undefined,
        notes: person!.notes || undefined,
        facts: (facts || []).map((f: Record<string, unknown>) => ({ id: generateId(), citations: [], ...f })),
        version: person!.version,
        createdAt: person!.created_at,
        updatedAt: person!.updated_at,
      })
    } catch (err) {
      next(err)
    }
  })

  router.get('/:personId', requireAuth, authorize('person.read', personResource), (req, res, next) => {
    try {
      const { personId } = req.params
      const person = deps.db.get<{
        id: string
        tree_id: string
        living_status: string
        privacy: string
        sex: string | null
        notes: string | null
        version: string
        created_at: string
        updated_at: string
      }>('SELECT * FROM people WHERE id = $id', { $id: personId })

      if (!person) {
        throw new AppError(404, 'not_found', 'Person not found')
      }

      const names = deps.db.all<{
        id: string
        type: string
        display: string
        given: string | null
        surname: string | null
        prefix: string | null
        suffix: string | null
        preferred: number
        language_tag: string | null
      }>('SELECT * FROM person_names WHERE person_id = $pid ORDER BY preferred DESC', { $pid: person.id })

      const facts = deps.db.all<{
        id: string
        type: string
        custom_type: string | null
        value: string | null
        date_kind: string | null
        date_original_text: string | null
        date_start: string | null
        date_end: string | null
        date_calendar: string | null
        place: string | null
        confidence: string
        privacy: string
      }>('SELECT * FROM facts WHERE person_id = $pid', { $pid: person.id })

      res.json({
        id: person.id,
        treeId: person.tree_id,
        names: names.map((n) => ({
          id: n.id,
          type: n.type,
          display: n.display,
          given: n.given,
          surname: n.surname,
          prefix: n.prefix,
          suffix: n.suffix,
          preferred: n.preferred === 1,
          languageTag: n.language_tag,
        })),
        livingStatus: person.living_status,
        privacy: person.privacy,
        sex: person.sex || undefined,
        notes: person.notes || undefined,
        facts: facts.map((f) => ({
          id: f.id,
          type: f.type,
          customType: f.custom_type || undefined,
          value: f.value || undefined,
          date: f.date_kind ? {
            kind: f.date_kind,
            originalText: f.date_original_text || '',
            start: f.date_start || undefined,
            end: f.date_end || undefined,
            calendar: f.date_calendar || undefined,
          } : undefined,
          place: f.place || undefined,
          confidence: f.confidence,
          privacy: f.privacy,
          citations: [],
        })),
        version: person.version,
        createdAt: person.created_at,
        updatedAt: person.updated_at,
      })
    } catch (err) {
      next(err)
    }
  })

  router.patch('/:personId', requireAuth, authorize('person.update', personResource), (req, res, next) => {
    try {
      requireCsrf(req, deps.db)
      const { personId } = req.params

      const existing = deps.db.get<{ id: string; version: string }>(
        'SELECT id, version FROM people WHERE id = $id',
        { $id: personId }
      )

      if (!existing) {
        throw new AppError(404, 'not_found', 'Person not found')
      }

      const ifMatch = req.headers['if-match'] as string | undefined
      if (ifMatch && ifMatch !== `"${existing.version}"`) {
        throw new AppError(412, 'precondition_failed', 'Resource version mismatch')
      }

      const { names, livingStatus, privacy, sex, notes, facts } = req.body
      const newVersion = generateId()

      deps.db.transaction(() => {
        if (livingStatus !== undefined || privacy !== undefined || sex !== undefined || notes !== undefined) {
          const updates: string[] = ['version = $version', "updated_at = datetime('now')"]
          const params: Record<string, unknown> = { $id: personId, $version: newVersion }
          if (livingStatus !== undefined) { updates.push('living_status = $livingStatus'); params.$livingStatus = livingStatus }
          if (privacy !== undefined) { updates.push('privacy = $privacy'); params.$privacy = privacy }
          if (sex !== undefined) { updates.push('sex = $sex'); params.$sex = sex }
          if (notes !== undefined) { updates.push('notes = $notes'); params.$notes = notes }

          deps.db.run(
            `UPDATE people SET ${updates.join(', ')} WHERE id = $id`,
            params
          )
        }

        if (names && Array.isArray(names)) {
          deps.db.run('DELETE FROM person_names WHERE person_id = $id', { $id: personId })
          for (const name of names) {
            deps.db.run(
              `INSERT INTO person_names (id, person_id, type, display, given, surname, prefix, suffix, preferred, language_tag)
               VALUES ($id, $personId, $type, $display, $given, $surname, $prefix, $suffix, $preferred, $languageTag)`,
              {
                $id: generateId(),
                $personId: personId,
                $type: name.type,
                $display: name.display,
                $given: name.given || null,
                $surname: name.surname || null,
                $prefix: name.prefix || null,
                $suffix: name.suffix || null,
                $preferred: name.preferred ? 1 : 0,
                $languageTag: name.languageTag || null,
              }
            )
          }
        }

        if (facts && Array.isArray(facts)) {
          deps.db.run('DELETE FROM facts WHERE person_id = $id', { $id: personId })
          for (const fact of facts) {
            deps.db.run(
              `INSERT INTO facts (id, person_id, type, custom_type, value, date_kind, date_original_text, date_start, date_end, date_calendar, place, confidence, privacy)
               VALUES ($id, $personId, $type, $customType, $value, $dateKind, $dateOriginalText, $dateStart, $dateEnd, $dateCalendar, $place, $confidence, $privacy)`,
              {
                $id: generateId(),
                $personId: personId,
                $type: fact.type,
                $customType: fact.customType || null,
                $value: fact.value || null,
                $dateKind: fact.date?.kind || null,
                $dateOriginalText: fact.date?.originalText || null,
                $dateStart: fact.date?.start || null,
                $dateEnd: fact.date?.end || null,
                $dateCalendar: fact.date?.calendar || null,
                $place: fact.place || null,
                $confidence: fact.confidence || 'unknown',
                $privacy: fact.privacy || 'members',
              }
            )
          }
        }
      })

      const updated = deps.db.get<{
        id: string
        tree_id: string
        living_status: string
        privacy: string
        sex: string | null
        notes: string | null
        version: string
        created_at: string
        updated_at: string
      }>('SELECT * FROM people WHERE id = $id', { $id: personId })

      const updatedNames = deps.db.all<{
        id: string
        type: string
        display: string
        given: string | null
        surname: string | null
        prefix: string | null
        suffix: string | null
        preferred: number
        language_tag: string | null
      }>('SELECT * FROM person_names WHERE person_id = $pid ORDER BY preferred DESC', { $pid: personId })

      const updatedFacts = deps.db.all<{
        id: string
        type: string
        custom_type: string | null
        value: string | null
        date_kind: string | null
        date_original_text: string | null
        date_start: string | null
        date_end: string | null
        date_calendar: string | null
        place: string | null
        confidence: string
        privacy: string
      }>('SELECT * FROM facts WHERE person_id = $pid', { $pid: personId })

      res.json({
        id: updated!.id,
        treeId: updated!.tree_id,
        names: updatedNames.map((n) => ({
          id: n.id,
          type: n.type,
          display: n.display,
          given: n.given,
          surname: n.surname,
          prefix: n.prefix,
          suffix: n.suffix,
          preferred: n.preferred === 1,
          languageTag: n.language_tag,
        })),
        livingStatus: updated!.living_status,
        privacy: updated!.privacy,
        sex: updated!.sex || undefined,
        notes: updated!.notes || undefined,
        facts: updatedFacts.map((f) => ({
          id: f.id,
          type: f.type,
          customType: f.custom_type || undefined,
          value: f.value || undefined,
          date: f.date_kind ? {
            kind: f.date_kind,
            originalText: f.date_original_text || '',
            start: f.date_start || undefined,
            end: f.date_end || undefined,
            calendar: f.date_calendar || undefined,
          } : undefined,
          place: f.place || undefined,
          confidence: f.confidence,
          privacy: f.privacy,
          citations: [],
        })),
        version: updated!.version,
        createdAt: updated!.created_at,
        updatedAt: updated!.updated_at,
      })
    } catch (err) {
      next(err)
    }
  })

  return router
}
