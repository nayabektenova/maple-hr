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
