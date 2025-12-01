// components/survey-list.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Search, Plus, Trash2, Pencil, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/* -------------------- helpers -------------------- */

const newId = () => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      // @ts-ignore
      return crypto.randomUUID()
    }
  } catch {}
  return Math.random().toString(36).slice(2)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* -------------------- types -------------------- */

type QuestionType = "short_text" | "long_text" | "rating" | "multi_choice"

type Question = {
  id: string
  type: QuestionType
  prompt: string
  options?: string[]
  attritionId?: string        // attrition_survey_questions.id
  featureKey?: string         // feature_key
}

type SurveyDraft = {
  id: string
  name: string
  description?: string
  audience: "all" | "department" | "individuals"
  department?: string
  employees?: string[]
  dueDate?: string
  questions: Question[]
  status: "draft" | "published"
}

type ResponseRow = {
  id: string                 // survey_responses.id
  firstName: string
  lastName: string
  surveyName: string
  viewed: boolean            // local-only "viewed" tag for UI
}

type SurveyRow = {
  id: string                
  name: string
  description?: string | null
  due_date?: string | null
  audience: "all" | "department" | "individuals"
  department?: string | null
  employees?: string[] | null
  isAttrition?: boolean   
}

/* -------------------- constants -------------------- */

const DEPARTMENTS = ["Development", "Marketing", "Finance", "Administration", "Maintenance", "Cybersecurity"]

const ATTRITION_SURVEY_ID = "attrition-demo"
const ATTRITION_SURVEY_NAME = "Attrition Survey Demo"

/* -------------------- attrition helpers -------------------- */

type AttritionQuestionRow = {
  id: string
  feature_key: string
  prompt: string
  help_text?: string | null
  question_type: string
  options: any
  is_required: boolean
  sort_order: number
}

function coerceOptionsArray(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as string[]
  try {
    const parsed = JSON.parse(raw as string)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function mapAttritionTypeToUi(t: string): QuestionType {
  switch (t) {
    case "rating_1_4":
      return "rating"
    case "yes_no":
    case "single_choice":
      return "multi_choice"
    default:
      return "short_text"
  }
}

function mapAttritionRowToQuestion(row: AttritionQuestionRow): Question {
  const baseType = mapAttritionTypeToUi(row.question_type)

  let opts: string[] | undefined = undefined
  if (row.question_type === "yes_no") {
    opts = ["Yes", "No"]
  } else if (row.question_type === "single_choice") {
    const arr = coerceOptionsArray(row.options)
    opts = arr.length ? arr : undefined
  }

  return {
    id: row.id, 
    type: baseType,
    prompt: row.prompt,
    options: opts,
    attritionId: row.id,
    featureKey: row.feature_key,
  }
}

function mapUiTypeToAttrition(t: QuestionType, q: Question): string {
  if (t === "rating") return "rating_1_4"
  if (t === "multi_choice") {
    const opts = (q.options ?? []).map(o => o.toLowerCase())
    if (opts.length === 2 && opts.includes("yes") && opts.includes("no")) {
      return "yes_no"
    }
    return "single_choice"
  }
  if (t === "short_text" || t === "long_text") return "short_text"
  return "short_text"
}

function mapUiOptionsToAttrition(q: Question): any {
  if (q.type === "multi_choice") {
    return q.options ?? []
  }
  return []
}

/* ===================================================
   Main component
=================================================== */

export function SurveyList() {
  /* ---------- left: responses ---------- */
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<ResponseRow[]>([])
  const [loadingRows, setLoadingRows] = useState(true)

  /* ---------- right: surveys ---------- */
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [loadingSurveys, setLoadingSurveys] = useState(true)

  /* ---------- create/edit dialogs ---------- */
  const [openCreate, setOpenCreate] = useState(false)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [showCreatedBanner, setShowCreatedBanner] = useState<{ id: string; name: string } | null>(null)

  const [draft, setDraft] = useState<SurveyDraft>(() => blankDraft())

  const [openEdit, setOpenEdit] = useState(false)
  const [editSurveyId, setEditSurveyId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<SurveyDraft | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  /* ---------- response answers dialog ---------- */
  const [openAnswers, setOpenAnswers] = useState(false)
  const [answersLoading, setAnswersLoading] = useState(false)
  const [answersTitle, setAnswersTitle] = useState<string>("Employee Answers")
  const [answers, setAnswers] = useState<Array<{ prompt: string; value: string }>>([])

  /* ---------- dev StrictMode guards ---------- */
  const didInit = useRef(false)
  const loadingEditRef = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    fetchResponses()
    fetchSurveys()
  }, [])

  /* ===================================================
     Fetchers
  =================================================== */

  async function fetchResponses() {
    setLoadingRows(true)
    const { data, error } = await supabase
      .from("survey_responses")
      .select(`
        id,
        first_name,
        last_name,
        surveys!inner ( name )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading responses:", error)
      setRows([])
    } else {
      const mapped: ResponseRow[] = (data || []).map((r: any) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        surveyName: r.surveys?.[0]?.name ?? r.surveys?.name ?? "(unknown)",
        viewed: false,
      }))
      setRows(mapped)
    }
    setLoadingRows(false)
  }

  async function fetchSurveys() {
    setLoadingSurveys(true)
    const { data, error } = await supabase
      .from("surveys")
      .select("id, name, description, due_date, audience, department, employees")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading surveys:", error)
      setSurveys([])
    } else {
      const list = (data || []) as SurveyRow[]

      const attritionRow: SurveyRow = {
        id: ATTRITION_SURVEY_ID,
        name: ATTRITION_SURVEY_NAME,
        description: "Questions feeding the Attrition Risk Analytics model.",
        audience: "all",
        department: null,
        employees: null,
        due_date: null,
        isAttrition: true,
      }

      setSurveys([...list, attritionRow])
    }
    setLoadingSurveys(false)
  }

  /* ===================================================
     Draft helpers
  =================================================== */

  function blankDraft(): SurveyDraft {
    return {
      id: newId(),
      name: "",
      description: "",
      audience: "all",
      department: "",
      employees: [],
      dueDate: "",
      questions: [
        { id: newId(), type: "short_text", prompt: "What’s going well?" },
        { id: newId(), type: "long_text", prompt: "Any challenges you’d like to share?" },
        { id: newId(), type: "rating", prompt: "Rate your overall satisfaction (1-5)" },
      ],
      status: "draft",
    }
  }

  function addQuestion(d: SurveyDraft, setD: (updater: any) => void) {
    setD((curr: SurveyDraft) => ({
      ...curr,
      questions: [...curr.questions, { id: newId(), type: "short_text", prompt: "" }],
    }))
  }
  function removeQuestion(d: SurveyDraft, setD: (updater: any) => void, qid: string) {
    setD((curr: SurveyDraft) => ({ ...curr, questions: curr.questions.filter((q) => q.id !== qid) }))
  }
  function updateQuestion(d: SurveyDraft, setD: (updater: any) => void, qid: string, next: Partial<Question>) {
    setD((curr: SurveyDraft) => ({
      ...curr,
      questions: curr.questions.map((q) => (q.id === qid ? { ...q, ...next } : q)),
    }))
  }
  function setAudience(d: SurveyDraft, setD: (updater: any) => void, a: SurveyDraft["audience"]) {
    setD((curr: SurveyDraft) => ({
      ...curr,
      audience: a,
      department: a === "department" ? curr.department : "",
      employees: a === "individuals" ? curr.employees : [],
    }))
  }

  async function createAndPublish() {
    setLoadingCreate(true)
    try {
      // 1) create survey
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .insert([
          {
            name: draft.name,
            description: draft.description,
            due_date: draft.dueDate || null,
            audience: draft.audience,
            department: draft.audience === "department" ? (draft.department || null) : null,
            employees: draft.audience === "individuals" ? (draft.employees ?? null) : null,
            status: "published",
          },
        ])
        .select("id, name")
        .single()

      if (surveyError) throw surveyError
      const surveyId: string = surveyData.id

      // 2) create questions
      if (draft.questions.length > 0) {
        const inserts = draft.questions.map((q) => ({
          survey_id: surveyId,
          question_type: q.type,
          prompt: q.prompt,
          options: q.type === "multi_choice" ? (q.options ?? []) : null,
        }))
        const { error: qErr } = await supabase.from("survey_questions").insert(inserts)
        if (qErr) throw qErr
      }

      // UI update
      setShowCreatedBanner({ id: surveyId, name: surveyData.name || "Untitled survey" })
      setDraft(blankDraft())
      setOpenCreate(false)
      setTimeout(() => setShowCreatedBanner(null), 4000)

      await Promise.all([fetchSurveys(), fetchResponses()])
    } catch (err: any) {
      console.error("Error publishing survey:", err?.message || err)
      alert(`Failed to publish survey: ${err?.message || "unknown error"}`)
    } finally {
      setLoadingCreate(false)
    }
  }

  /* ===================================================
     Edit survey (right side)
  =================================================== */

  async function openEditSurvey(sid: string) {
    if (loadingEditRef.current) return
    loadingEditRef.current = true
    setSavingEdit(false)
    setEditSurveyId(sid)

    try {
      if (sid === ATTRITION_SURVEY_ID) {
        const { data, error } = await supabase
          .from("attrition_survey_questions")
          .select("id, feature_key, prompt, help_text, question_type, options, is_required, sort_order")
          .order("sort_order", { ascending: true })

        if (error) {
          console.error("Failed to load attrition survey questions:", error)
          alert("Failed to load Attrition Survey Demo questions.")
          return
        }

        const questions: Question[] = (data || []).map((row: any) =>
          mapAttritionRowToQuestion(row as AttritionQuestionRow),
        )

        const draftFromDb: SurveyDraft = {
          id: ATTRITION_SURVEY_ID,
          name: ATTRITION_SURVEY_NAME,
          description: "Edit questions used by Attrition Risk Analytics. Answers go to attrition_survey_responses.",
          audience: "all",
          department: "",
          employees: [],
          dueDate: "",
          status: "draft",
          questions,
        }

        setEditDraft(draftFromDb)
        setOpenEdit(true)
        return
      }

      const [{ data: sData, error: sErr }, { data: qData, error: qErr }] = await Promise.all([
        supabase.from("surveys").select("*").eq("id", sid).single(),
        supabase.from("survey_questions").select("id, question_type, prompt, options").eq("survey_id", sid).order("id"),
      ])
      if (sErr) throw sErr
      if (qErr) throw qErr

      const draftFromDb: SurveyDraft = {
        id: newId(),
        name: sData.name,
        description: sData.description ?? "",
        audience: sData.audience,
        department: sData.department ?? "",
        employees: (sData.employees ?? []) as string[],
        dueDate: sData.due_date ?? "",
        status: "draft",
        questions: (qData || []).map((q: any) => ({
          id: q.id,
          type: q.question_type as QuestionType,
          prompt: q.prompt,
          options: q.options ?? undefined,
        })),
      }
      setEditDraft(draftFromDb)
      setOpenEdit(true)
    } catch (e) {
      console.error(e)
      alert("Failed to load survey for editing.")
    } finally {
      loadingEditRef.current = false
    }
  }

  async function saveEdit() {
    if (!editSurveyId || !editDraft || savingEdit) return
    setSavingEdit(true)
    try {
      if (editSurveyId === ATTRITION_SURVEY_ID) {
        const qs = editDraft.questions

        const existing = qs.filter(q => q.attritionId)
        const added = qs.filter(q => !q.attritionId)

        for (let idx = 0; idx < existing.length; idx++) {
          const q = existing[idx]
          const { error } = await supabase
            .from("attrition_survey_questions")
            .update({
              prompt: q.prompt,
              question_type: mapUiTypeToAttrition(q.type, q),
              options: mapUiOptionsToAttrition(q),
              sort_order: (idx + 1) * 10,
            })
            .eq("id", q.attritionId)
          if (error) throw error
        }

        for (let idx = 0; idx < added.length; idx++) {
          const q = added[idx]
          const { error } = await supabase
            .from("attrition_survey_questions")
            .insert([
              {
                feature_key: q.featureKey || `custom_q_${Date.now()}_${idx}`,
                prompt: q.prompt,
                help_text: null,
                question_type: mapUiTypeToAttrition(q.type, q),
                options: mapUiOptionsToAttrition(q),
                is_required: true,
                sort_order: 1000 + (idx + 1) * 10,
              },
            ])
          if (error) throw error
        }

        setOpenEdit(false)
        setEditSurveyId(null)
        setEditDraft(null)
        return
      }

      if (!editSurveyId || !editDraft) return

      const { error: upErr } = await supabase
        .from("surveys")
        .update({
          name: editDraft.name,
          description: editDraft.description,
          due_date: editDraft.dueDate || null,
          audience: editDraft.audience,
          department: editDraft.audience === "department" ? (editDraft.department || null) : null,
          employees: editDraft.audience === "individuals" ? (editDraft.employees ?? null) : null,
        })
        .eq("id", editSurveyId)
      if (upErr) throw upErr

      const payload = editDraft.questions.map(q => ({
        question_type: q.type,
        prompt: q.prompt,
        options: q.type === "multi_choice" ? (q.options ?? []) : null,
      }))

      const { error: rpcErr } = await supabase.rpc("replace_survey_questions", {
        p_survey_id: editSurveyId,
        p_questions: JSON.parse(JSON.stringify(payload)),
      })
      if (rpcErr) throw rpcErr

      setOpenEdit(false)
      setEditSurveyId(null)
      setEditDraft(null)
      await fetchSurveys()
    } catch (err: any) {
      console.error(err)
      alert(`Failed to save: ${err?.message || "unknown error"}`)
    } finally {
      setSavingEdit(false)
    }
  }

  async function deleteSurvey(sid: string) {
    if (sid === ATTRITION_SURVEY_ID) {
      alert("Attrition Survey Demo is managed by Maple HR and cannot be deleted.")
      return
    }

    if (!confirm("Delete this survey? This also deletes its questions and answers.")) return

    const { error } = await supabase.rpc("delete_survey_cascade", { p_survey_id: sid })
    if (error) {
      console.error(error)
      alert(`Failed to delete: ${error.message}`)
      return
    }

    setSurveys(prev => prev.filter(s => s.id !== sid))
    await fetchSurveys()
  }

  /* ===================================================
     Answers popup (left side)
  =================================================== */

  async function viewAnswers(resp: ResponseRow) {
    setOpenAnswers(true)
    setAnswersLoading(true)
    setAnswersTitle(`${resp.firstName} ${resp.lastName} — ${resp.surveyName}`)

    const { data, error } = await supabase
      .from("survey_answers")
      .select(`
        answer_text,
        answer_int,
        answer_opts,
        survey_questions!inner ( prompt )
      `)
      .eq("response_id", resp.id)

    if (error) {
      console.error(error)
      setAnswers([])
    } else {
      const mapped = (data || []).map((r: any) => {
        const value =
          r.answer_text ??
          (r.answer_int != null ? String(r.answer_int) : (r.answer_opts ? r.answer_opts.join(", ") : ""))
        const prompt = r.survey_questions?.[0]?.prompt ?? r.survey_questions?.prompt ?? ""
        return { prompt, value }
      })
      setAnswers(mapped)
      setRows((prev) => prev.map((row) => (row.id === resp.id ? { ...row, viewed: true } : row)))
    }

    setAnswersLoading(false)
  }

  /* ===================================================
     Filters / visible rows
  =================================================== */

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase()
      return name.includes(q) || r.surveyName.toLowerCase().includes(q)
    })
  }, [rows, search])

  /* ===================================================
     Render
  =================================================== */

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {showCreatedBanner && (
        <div className="m-4 rounded-md border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
          <strong>{showCreatedBanner.name}</strong> has been published and saved.
        </div>
      )}

      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search employee or survey..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create survey
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a new survey</DialogTitle>
              <DialogDescription>Define audience, due date, and add questions.</DialogDescription>
            </DialogHeader>

            <SurveyEditor
              draft={draft}
              setDraft={setDraft}
              addQuestion={addQuestion}
              removeQuestion={removeQuestion}
              updateQuestion={updateQuestion}
              setAudience={setAudience}
              isEditing={false}
            />

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => { setDraft(blankDraft()); setOpenCreate(false) }}>
                Cancel
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={createAndPublish} disabled={loadingCreate}>
                {loadingCreate ? "Publishing..." : "Create & publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* ---------------- LEFT: Employee responses ---------------- */}
        <div className="p-4 border-r border-gray-200">
          <div className="mb-3 font-semibold">Employee Activity</div>
          {loadingRows ? (
            <div className="p-6 text-center text-gray-500">Loading responses...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Survey</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.firstName} {row.lastName}</TableCell>
                      <TableCell>{row.surveyName}</TableCell>
                      <TableCell>
                        <Button
                          variant={row.viewed ? "outline" : "default"}
                          size="sm"
                          onClick={() => viewAnswers(row)}
                          className={row.viewed ? "" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {row.viewed ? "Viewed" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">No results</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* ---------------- RIGHT: Your surveys ---------------- */}
        <div className="p-4">
          <div className="mb-3 font-semibold">Your Surveys</div>
          {loadingSurveys ? (
            <div className="p-6 text-center text-gray-500">Loading surveys...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.name}
                        {s.isAttrition && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 border border-purple-100">
                            Attrition
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{s.audience}</TableCell>
                      <TableCell>{s.due_date ?? "—"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditSurvey(s.id)}>
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        {!s.isAttrition && (
                          <Button variant="outline" size="sm" onClick={() => deleteSurvey(s.id)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {surveys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">No surveys yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Answers modal */}
      <Dialog open={openAnswers} onOpenChange={setOpenAnswers}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{answersTitle}</DialogTitle>
          </DialogHeader>
          {answersLoading ? (
            <div className="p-6 text-gray-500">Loading answers…</div>
          ) : answers.length === 0 ? (
            <div className="p-6 text-gray-500">No answers submitted.</div>
          ) : (
            <div className="space-y-4">
              {answers.map((a, idx) => (
                <div key={idx} className="rounded border p-3">
                  <div className="text-sm text-gray-500 mb-1">{a.prompt}</div>
                  <div className="font-medium break-words">{a.value || "—"}</div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenAnswers(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit survey</DialogTitle>
          </DialogHeader>

          {editDraft ? (
            <>
              <SurveyEditor
                draft={editDraft}
                setDraft={setEditDraft as any}
                addQuestion={addQuestion}
                removeQuestion={removeQuestion}
                updateQuestion={updateQuestion}
                setAudience={setAudience}
                isEditing
              />
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "Saving..." : "Save changes"}</Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-6 text-gray-500">Loading…</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================================================
   Reusable Survey Editor (create & edit)
=================================================== */

function SurveyEditor(props: {
  draft: SurveyDraft
  setDraft: (fn: any) => void
  addQuestion: (d: SurveyDraft, setD: (f: any) => void) => void
  removeQuestion: (d: SurveyDraft, setD: (f: any) => void, qid: string) => void
  updateQuestion: (d: SurveyDraft, setD: (f: any) => void, qid: string, next: Partial<Question>) => void
  setAudience: (d: SurveyDraft, setD: (f: any) => void, a: SurveyDraft["audience"]) => void
  isEditing?: boolean
}) {
  const { draft, setDraft, addQuestion, removeQuestion, updateQuestion, setAudience, isEditing } = props

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="survey-name">{isEditing ? "Survey name" : "Survey name"}</Label>
          <Input
            id="survey-name"
            placeholder="e.g., Team Satisfaction – Q3"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="due">Due date</Label>
          <Input
            id="due"
            type="date"
            value={draft.dueDate}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            placeholder="Explain the goal and estimated time to complete..."
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <Label>Audience</Label>
          <Select value={draft.audience} onValueChange={(v: any) => setAudience(draft, setDraft, v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="individuals">Specific employees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {draft.audience === "department" && (
          <div className="sm:col-span-1">
            <Label>Department</Label>
            <Select
              value={draft.department || ""}
              onValueChange={(v) => setDraft({ ...draft, department: v })}
            >
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {draft.audience === "individuals" && (
          <div className="sm:col-span-2">
            <Label htmlFor="employees">Employees (IDs or emails, comma-separated)</Label>
            <Input
              id="employees"
              placeholder="e.g., 12345, 67890, alice@company.com"
              value={(draft.employees ?? []).join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  employees: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        )}
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Questions</Label>
          <Button variant="outline" size="sm" onClick={() => addQuestion(draft, setDraft)}>
            <Plus className="w-4 h-4 mr-1" /> Add question
          </Button>
        </div>

        <div className="space-y-3">
          {draft.questions.map((q, idx) => (
            <div key={q.id} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <Select
                  value={q.type}
                  onValueChange={(v: any) => {
                    const next: Partial<Question> = { type: v }
                    if (v === "multi_choice" && !q.options) next.options = ["Option 1", "Option 2"]
                    if (v !== "multi_choice") next.options = undefined
                    updateQuestion(draft, setDraft, q.id, next)
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_text">Short text</SelectItem>
                    <SelectItem value="long_text">Long text</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="multi_choice">Multiple choice</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  className="flex-1"
                  placeholder={`Question ${idx + 1} prompt`}
                  value={q.prompt}
                  onChange={(e) => updateQuestion(draft, setDraft, q.id, { prompt: e.target.value })}
                />

                <Button variant="ghost" size="icon" onClick={() => removeQuestion(draft, setDraft, q.id)} aria-label="Remove question">
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </Button>
              </div>

              {q.type === "multi_choice" && (
                <div className="mt-3 space-y-2">
                  {(q.options ?? []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const opts = [...(q.options ?? [])]
                          opts[i] = e.target.value
                          updateQuestion(draft, setDraft, q.id, { options: opts })
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const opts = (q.options ?? []).filter((_, j) => j !== i)
                          updateQuestion(draft, setDraft, q.id, { options: opts })
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuestion(draft, setDraft, q.id, { options: [...(q.options ?? []), "New option"] })}
                  >
                    + Add option
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
