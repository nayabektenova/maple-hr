// components/survey-employee.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Edit3, Search } from "lucide-react"

/* -------------------- Supabase -------------------- */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* -------------------- Types -------------------- */
type QuestionType = "short_text" | "long_text" | "rating" | "multi_choice"

type SurveyQ = {
  id: string
  question_type: QuestionType
  prompt: string
  options?: string[] | null
}

type Survey = {
  id: string
  name: string
  description?: string | null
  due_date?: string | null
  survey_questions: SurveyQ[]
}

/* =========================================================
   Employee Survey Component (no auth; user enters fields)
========================================================= */
export default function SurveyEmployee() {
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState<Survey[]>([])

  // answer modal
  const [open, setOpen] = useState(false)
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null)

  // required respondent fields
  const [employeeId, setEmployeeId] = useState<string>("")
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")

  const [submitting, setSubmitting] = useState(false)

  // local form state: per question id
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({})

  useEffect(() => {
    refreshSurveys()
  }, [])

  async function refreshSurveys() {
    setLoading(true)
    const { data, error } = await supabase
      .from("surveys")
      .select(`
        id, name, description, due_date,
        survey_questions ( id, question_type, prompt, options )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setSurveys([])
    } else {
      setSurveys((data || []) as unknown as Survey[])
    }
    setLoading(false)
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return surveys
    return surveys.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    )
  }, [surveys, search])

  function openAnswerModal(s: Survey) {
    const init: Record<string, string | number | string[]> = {}
    for (const q of s.survey_questions) {
      if (q.question_type === "multi_choice") init[q.id] = []
      else if (q.question_type === "rating") init[q.id] = 0
      else init[q.id] = ""
    }
    setAnswers(init)
    // clear respondent fields for each new open
    setEmployeeId("")
    setFirstName("")
    setLastName("")
    setActiveSurvey(s)
    setOpen(true)
  }

  function updateAnswer(qid: string, val: string | number | string[]) {
    setAnswers((prev) => ({ ...prev, [qid]: val }))
  }

  function validateRespondent(): string | null {
    if (!employeeId.trim()) return "Please enter your Employee ID."
    if (!firstName.trim()) return "Please enter your First name."
    if (!lastName.trim()) return "Please enter your Last name."
    return null
  }

  async function submitAnswers() {
    if (!activeSurvey) return
    const respondentError = validateRespondent()
    if (respondentError) {
      alert(respondentError)
      return
    }
    setSubmitting(true)

    try {
      const empId = employeeId.trim()

      // Enforce one submission per (survey_id, employee_id)
      const { data: exists, error: existsErr } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("survey_id", activeSurvey.id)
        .eq("employee_id", empId)
        .limit(1)
      if (existsErr) throw existsErr
      if (exists && exists.length > 0) {
        alert("You have already submitted this survey with this Employee ID.")
        setSubmitting(false)
        return
      }

      // Create response
      const { data: respIns, error: respErr } = await supabase
        .from("survey_responses")
        .insert([{
          survey_id: activeSurvey.id,
          employee_id: empId,
          status: "Pending",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          survey: activeSurvey.name, // legacy text column storing survey name
        }])
        .select("id")
        .single()
      if (respErr) throw respErr
      const responseId = respIns.id as string

      // Build answers
      const inserts = activeSurvey.survey_questions.map((q) => {
        const v = answers[q.id]
        switch (q.question_type) {
          case "short_text":
          case "long_text":
            return {
              response_id: responseId,
              question_id: q.id,
              answer_text: typeof v === "string" ? v : String(v ?? ""),
            }
          case "rating":
            return {
              response_id: responseId,
              question_id: q.id,
              answer_int: typeof v === "number" ? v : Number(v ?? 0),
            }
          case "multi_choice":
            return {
              response_id: responseId,
              question_id: q.id,
              answer_opts: Array.isArray(v) ? v : [],
            }
          default:
            return {
              response_id: responseId,
              question_id: q.id,
              answer_text: String(v ?? ""),
            }
        }
      })

      const { error: ansErr } = await supabase.from("survey_answers").insert(inserts)
      if (ansErr) throw ansErr

      // Optional: bump status to Submitted
      const { error: updErr } = await supabase
        .from("survey_responses")
        .update({ status: "Submitted" })
        .eq("id", responseId)
      if (updErr) throw updErr

      setOpen(false)
    } catch (e: any) {
      console.error(e)
      alert(`Failed to submit: ${e?.message ?? "unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search surveys…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading surveys…</div>
      ) : (
        <div className="p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="w-40 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-gray-600">{s.description ?? "—"}</TableCell>
                  <TableCell>{s.due_date ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => openAnswerModal(s)}
                      className="bg-blue-600 hover:bg-blue-700"
                      title="Answer survey"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Answer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No surveys available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Answer modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* 3-row grid ensures the middle row has a fixed space that can scroll */}
        <DialogContent
          className="
            w-[95vw] sm:max-w-3xl
            max-h-[90vh] p-0
            grid grid-rows-[auto,1fr,auto]
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <DialogHeader className="p-0">
              <DialogTitle>
                {activeSurvey ? `Answer: ${activeSurvey.name}` : "Answer survey"}
              </DialogTitle>
              {activeSurvey?.description && (
                <p className="mt-1 text-sm text-gray-600">{activeSurvey.description}</p>
              )}
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          {!activeSurvey ? (
            <div className="px-5 py-6 text-gray-500 overflow-y-auto">Loading…</div>
          ) : (
            <div
              className="
                overflow-y-auto
                px-5 py-4 space-y-6
                max-h-[calc(90vh-56px-56px)]
              "
            >
              {/* Respondent details */}
              <div className="grid sm:grid-cols-2 gap-3 rounded-md border border-gray-200 p-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    placeholder="Enter your ID (email or number)"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    placeholder="Your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Survey</Label>
                  <Input value={activeSurvey.name} disabled />
                </div>
              </div>

              {/* All questions (no pagination; the body scrolls) */}
              <div className="space-y-4">
                {activeSurvey.survey_questions.map((q, idx) => (
                  <div key={q.id} className="rounded-md border border-gray-200 p-3">
                    <Label className="block mb-2">
                      {idx + 1}. {q.prompt}
                    </Label>

                    {q.question_type === "short_text" && (
                      <Input
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                        placeholder="Your answer"
                      />
                    )}

                    {q.question_type === "long_text" && (
                      <Textarea
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                        placeholder="Type your response…"
                        className="min-h-[120px] max-h-[240px] overflow-y-auto"
                      />
                    )}

                    {q.question_type === "rating" && (
                      <div className="flex flex-wrap items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Button
                            key={n}
                            type="button"
                            variant={(answers[q.id] as number) === n ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAnswer(q.id, n)}
                            className={(answers[q.id] as number) === n ? "bg-blue-600 hover:bg-blue-700" : ""}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    )}

                    {q.question_type === "multi_choice" && (
                      <div className="flex flex-wrap gap-2">
                        {(q.options ?? []).map((opt) => {
                          const arr = (answers[q.id] as string[]) ?? []
                          const checked = arr.includes(opt)
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={checked ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const next = new Set(arr)
                                if (checked) next.delete(opt)
                                else next.add(opt)
                                updateAnswer(q.id, Array.from(next))
                              }}
                              className={checked ? "bg-blue-600 hover:bg-blue-700" : ""}
                            >
                              {opt}
                            </Button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 bg-white px-5 py-3">
            <DialogFooter className="flex w-full items-center justify-end gap-2 p-0">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitAnswers}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
