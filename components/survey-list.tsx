"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Filter, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type SurveyRow = {
  id: string
  firstName: string
  lastName: string
  survey: string
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

const SURVEY_TYPES: Array<string> = ["Team Satisfaction", "Manager feedback", "Improvement Suggestions"]
const STATUSES: Array<SurveyRow["status"]> = ["Submitted", "Pending", "In progress"]
const REVIEW_STATUSES: Array<SurveyRow["reviewStatus"]> = ["Reviewed", "Pending", "Pending Review"]
const DEPARTMENTS = ["Development", "Marketing", "Finance", "Administration", "Maintenance", "Cybersecurity"]


export function SurveyList() {
  const [search, setSearch] = useState("")
  const [surveyFilter, setSurveyFilter] = useState<string | "">("")
  const [statusFilter, setStatusFilter] = useState<SurveyRow["status"] | "">("")
  const [reviewFilter, setReviewFilter] = useState<SurveyRow["reviewStatus"] | "">("")

  const [rows, setRows] = useState<SurveyRow[]>([])
  const [loadingRows, setLoadingRows] = useState(true)

  const [surveysCatalog, setSurveysCatalog] = useState<SurveyDraft[]>([])
  const [showCreatedBanner, setShowCreatedBanner] = useState<{ id: string; name: string } | null>(null)
  
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


  useEffect(() => {
    fetchResponses()
  }, [])

  async function fetchResponses() {
    setLoadingRows(true)
    const { data, error } = await supabase
      .from("survey_responses")
      .select("id, first_name, last_name, survey, status, submission_date, review_status, notes")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading survey responses:", error)
      setRows([])
    } else {
      const mapped: SurveyRow[] = (data || []).map((r: any) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        survey: r.survey,
        status: r.status,
        submissionDate: r.submission_date ? new Date(r.submission_date).toLocaleDateString() : "Pending",
        reviewStatus: r.review_status,
        notes: r.notes ?? undefined,
      }))
      setRows(mapped)
    }
    setLoadingRows(false)
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



  async function createAndPublish() {
    setLoading(true)
    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from("survey")
        .insert([{
          survey_name: draft.name,
          description: draft.description,
          due_date: draft.dueDate || null,
          audience: draft.audience,
          department: draft.audience === "department" ? (draft.department || null) : null,
          employees: draft.audience === "individuals" ? (draft.employees ?? null) : null,
        }])
        .select("survey_id")
        .single()
      if (surveyError) throw surveyError
      const surveyId = surveyData.survey_id

      if (draft.questions.length > 0) {
        const questionInserts = draft.questions.map((q) => ({
          survey_id: surveyId,
          question_type: q.type,
          question_title: q.prompt,
          options: q.type === "multi_choice" ? (q.options ?? []) : null,
        }))
        const { error: questionsError } = await supabase.from("questions").insert(questionInserts)
        if (questionsError) throw questionsError
      }

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

      await fetchResponses()
    } catch (err) {
      console.error("Error publishing survey:", err)
      alert("Failed to publish survey. Check console for details.")
    } finally {
      setLoading(false)
    }
  }




  return (
    <div className="bg-white rounded-lg border border-gray-200">
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
                            setDraft({
                              ...draft,
                              employees: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>


                            
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )




}
