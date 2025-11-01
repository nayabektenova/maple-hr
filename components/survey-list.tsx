"use client"

import { useMemo, useState } from "react"
import { Search, Filter, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"

/* ======================== Supabase Client ======================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* ======================== Types ======================== */
type SurveyRow = {
  id: string
  firstName: string
  lastName: string
  survey: "Team Satisfaction" | "Manager feedback" | "Improvement Suggestions" | string
  status: "Submitted" | "Pending" | "In progress"
  submissionDate: string
  reviewStatus: "Reviewed" | "Pending" | "Pending Review"
  notes?: string
}

type QuestionType = "short_text" | "long_text" | "rating" | "multi_choice"

type Question = {
  id: string
  type: QuestionType
  prompt: string
  options?: string[]
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

/* ======================== Demo data ======================== */
const rowsSeed: SurveyRow[] = [
  { id: "1", firstName: "Saul", lastName: "Mullins", survey: "Team Satisfaction", status: "Submitted", submissionDate: "03/07/2025", reviewStatus: "Reviewed" },
  { id: "2", firstName: "Amirah", lastName: "Vincent", survey: "Manager feedback", status: "Pending", submissionDate: "Pending", reviewStatus: "Pending", notes: "On vacation" },
  { id: "3", firstName: "Morgan", lastName: "Terrell", survey: "Improvement Suggestions", status: "In progress", submissionDate: "Pending", reviewStatus: "Pending" },
  { id: "4", firstName: "Henrietta",lastName: "Gibbs",    survey: "Manager feedback",         status: "Submitted",  submissionDate: "01/07/2025", reviewStatus: "Pending Review" },
  { id: "5", firstName: "Enzo",     lastName: "Cobb",     survey: "Improvement Suggestions",  status: "Pending",    submissionDate: "Pending",    reviewStatus: "Pending" },
  { id: "6", firstName: "Fintan",   lastName: "Huff",     survey: "Team Satisfaction",        status: "In progress",submissionDate: "Pending",    reviewStatus: "Pending" },
  { id: "7", firstName: "Lena",     lastName: "Dixon",    survey: "Manager feedback",         status: "Submitted",  submissionDate: "01/07/2025", reviewStatus: "Pending Review" },
  { id: "8", firstName: "Cole",     lastName: "Stanton",  survey: "Improvement Suggestions",  status: "Pending",    submissionDate: "Pending",    reviewStatus: "Pending" },
  { id: "9", firstName: "Cole",     lastName: "Stanton",  survey: "Team Satisfaction",        status: "In progress",submissionDate: "Pending",    reviewStatus: "Pending" },
]

const SURVEY_TYPES: Array<SurveyRow["survey"]> = ["Team Satisfaction", "Manager feedback", "Improvement Suggestions"]
const STATUSES: SurveyRow["status"][] = ["Submitted", "Pending", "In progress"]
const REVIEW_STATUSES: SurveyRow["reviewStatus"][] = ["Reviewed", "Pending", "Pending Review"]

const DEPARTMENTS = ["Development", "Marketing", "Finance", "Administration", "Maintenance", "Cybersecurity"]

/* ======================== Component ======================== */
export function SurveyList() {
  const [search, setSearch] = useState("")
  const [surveyFilter, setSurveyFilter] = useState<SurveyRow["survey"] | "">("")
  const [statusFilter, setStatusFilter] = useState<SurveyRow["status"] | "">("")
  const [reviewFilter, setReviewFilter] = useState<SurveyRow["reviewStatus"] | "">("")
  const [rows] = useState<SurveyRow[]>(rowsSeed)

  const [surveysCatalog, setSurveysCatalog] = useState<SurveyDraft[]>([])
  const [showCreatedBanner, setShowCreatedBanner] = useState<{id: string; name: string} | null>(null)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<SurveyDraft>(() => blankDraft())
  const [loading, setLoading] = useState(false)

  function blankDraft(): SurveyDraft {
    return {
      id: cryptoRandomId(),
      name: "",
      description: "",
      audience: "all",
      department: "",
      employees: [],
      dueDate: "",
      questions: [
        { id: cryptoRandomId(), type: "short_text", prompt: "What’s going well?" },
        { id: cryptoRandomId(), type: "long_text", prompt: "Any challenges you’d like to share?" },
        { id: cryptoRandomId(), type: "rating", prompt: "Rate your overall satisfaction (1-5)" },
      ],
      status: "draft",
    }
  }

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      const q = `${r.firstName} ${r.lastName}`.toLowerCase()
      const matchesQuery = q.includes(search.toLowerCase()) || r.id.includes(search)
      const matchesSurvey = surveyFilter ? r.survey === surveyFilter : true
      const matchesStatus = statusFilter ? r.status === statusFilter : true
      const matchesReview = reviewFilter ? r.reviewStatus === reviewFilter : true
      return matchesQuery && matchesSurvey && matchesStatus && matchesReview
    })
  }, [rows, search, surveyFilter, statusFilter, reviewFilter])

  function addQuestion() {
    setDraft((d) => ({
      ...d,
      questions: [...d.questions, { id: cryptoRandomId(), type: "short_text", prompt: "" }],
    }))
  }

  function removeQuestion(id: string) {
    setDraft((d) => ({ ...d, questions: d.questions.filter((q) => q.id !== id) }))
  }

  function updateQuestion(id: string, next: Partial<Question>) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === id ? { ...q, ...next } : q)),
    }))
  }

  function setAudience(a: SurveyDraft["audience"]) {
    setDraft((d) => ({
      ...d,
      audience: a,
      department: a === "department" ? d.department : "",
      employees: a === "individuals" ? d.employees : [],
    }))
  }

  function saveDraft() {
    const entry = { ...draft, status: "draft" as const }
    setSurveysCatalog((prev) => {
      const i = prev.findIndex((s) => s.id === entry.id)
      if (i >= 0) {
        const copy = [...prev]; copy[i] = entry; return copy
      }
      return [entry, ...prev]
    })
    setDraft(blankDraft())
    setOpen(false)
  }

  /* ================== CREATE & PUBLISH with Supabase ================== */
  async function createAndPublish() {
    setLoading(true)
    try {
      // Insert survey into Survey table
      const { data: surveyData, error: surveyError } = await supabase
        .from("survey")
        .insert([{
          survey_name: draft.name,
          description: draft.description,
          due_date: draft.dueDate || null,
          audience: draft.audience,
        }])
        .select("survey_id")
        .single()

      if (surveyError) throw surveyError
      const surveyId = surveyData.survey_id

      // Insert related questions into Questions table
      if (draft.questions.length > 0) {
        const questionInserts = draft.questions.map((q) => ({
          survey_id: surveyId,
          question_type: q.type,
          question_title: q.prompt,
        }))

        const { error: questionsError } = await supabase
          .from("questions")
          .insert(questionInserts)

        if (questionsError) throw questionsError
      }

      // Update local state & show success banner
      const entry = { ...draft, status: "published" as const }
      setSurveysCatalog((prev) => {
        const i = prev.findIndex((s) => s.id === entry.id)
        const next = i >= 0 ? prev.map((s) => (s.id === entry.id ? entry : s)) : [entry, ...prev]
        return next
      })
      setShowCreatedBanner({ id: entry.id, name: entry.name || "Untitled survey" })
      setDraft(blankDraft())
      setOpen(false)
      setTimeout(() => setShowCreatedBanner(null), 4000)
    } catch (err) {
      console.error("Error publishing survey:", err)
      alert("Failed to publish survey. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  /* ======================== Render ======================== */
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header (search + filters + Create survey) */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        {showCreatedBanner && (
          <div className="mb-2 rounded-md border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
            <strong>{showCreatedBanner.name}</strong> has been published and saved to the database.
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by ID, Name, Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel>Survey Name</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSurveyFilter("")}>All</DropdownMenuItem>
              {SURVEY_TYPES.map((t) => (
                <DropdownMenuItem key={t} onClick={() => setSurveyFilter(t)}>
                  {t}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter("")}>All</DropdownMenuItem>
              {STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                  {s}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Review status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setReviewFilter("")}>All</DropdownMenuItem>
              {REVIEW_STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setReviewFilter(s)}>
                  {s}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSurveyFilter(""); setStatusFilter(""); setReviewFilter("") }}>
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create survey */}
          <div className="ml-auto">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create survey
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create a new survey</DialogTitle>
                  <DialogDescription>Define audience, due date, and add questions.</DialogDescription>
                </DialogHeader>

                {/* Form */}
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="survey-name">Survey name</Label>
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

                  {/* Audience */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <Label>Audience</Label>
                      <Select value={draft.audience} onValueChange={(v: any) => setAudience(v)}>
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
                            setDraft({ ...draft, employees: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Questions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Questions</Label>
                      <Button variant="outline" size="sm" onClick={addQuestion}>
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
                                updateQuestion(q.id, next)
                              }}
                            >
                              <SelectTrigger className="w-44">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short_text">Short text</SelectItem>
                                <SelectItem value="long_text">Long text</SelectItem>
                                <SelectItem value="rating">Rating (1–5)</SelectItem>
                                <SelectItem value="multi_choice">Multiple choice</SelectItem>
                              </SelectContent>
                            </Select>

                            <Input
                              className="flex-1"
                              placeholder={`Question ${idx + 1} prompt`}
                              value={q.prompt}
                              onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                            />

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(q.id)}
                              aria-label="Remove question"
                            >
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
                                      updateQuestion(q.id, { options: opts })
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const opts = (q.options ?? []).filter((_, j) => j !== i)
                                      updateQuestion(q.id, { options: opts })
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuestion(q.id, { options: [...(q.options ?? []), "New option"] })}
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

                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={saveDraft}>Save draft</Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={createAndPublish} disabled={loading}>
                    {loading ? "Publishing..." : "Create & publish"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Survey</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Review Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.firstName} {row.lastName}</TableCell>
                <TableCell>{row.survey}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.submissionDate}</TableCell>
                <TableCell>{row.reviewStatus}</TableCell>
              </TableRow>
            ))}
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">No results</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/* ======================== Helpers ======================== */
// Simple random ID generator
function cryptoRandomId() {
  return Math.random().toString(36).slice(2)
}
