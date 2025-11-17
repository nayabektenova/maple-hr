"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit3, Search } from "lucide-react";

/* -------------------- Supabase -------------------- */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* -------------------- Types -------------------- */


type QuestionType =
  | "short_text"
  | "long_text"
  | "rating"
  | "multi_choice"
  | "rating_1_4"
  | "yes_no"
  | "single_choice";


type SurveyQ = {
  id: string;
  question_type: QuestionType;
  prompt: string;
  options?: string[] | null;
  feature_key?: string | null;
  help_text?: string | null;
};

type Survey = {
  id: string;
  name: string;
  description?: string | null;
  due_date?: string | null;
  survey_questions: SurveyQ[];
};

/* =========================================================
   Employee Survey Component
   ========================================================= */
export default function SurveyEmployee() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  // answer modal
  const [open, setOpen] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);

  // respondent fields
  const [employeeId, setEmployeeId] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // local answers: question_id -> value
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});

  useEffect(() => {
    refreshSurveys();
  }, []);

  /* =========================================================
     Load surveys + Attrition Survey Demo
     ========================================================= */
  async function refreshSurveys() {
    setLoading(true);

    try {
      const { data: baseData, error: baseErr } = await supabase
        .from("surveys")
        .select(
          `
          id,
          name,
          description,
          due_date,
          survey_questions (
            id,
            question_type,
            prompt,
            options
          )
        `
        );

      if (baseErr) throw baseErr;

      let list: Survey[] = (baseData || []) as unknown as Survey[];

      const { data: attrQ, error: attrErr } = await supabase
        .from("attrition_survey_questions")
        .select(
          `
          id,
          feature_key,
          prompt,
          help_text,
          question_type,
          options,
          is_required,
          sort_order
        `
        )
        .order("sort_order", { ascending: true });

      if (!attrErr && attrQ && attrQ.length > 0) {
        const attritionQuestions: SurveyQ[] = (attrQ as any[]).map((q) => ({
          id: q.id,
          question_type: q.question_type as QuestionType, // rating_1_4 | yes_no | single_choice
          prompt: q.prompt,
          options: q.options ?? null,
          feature_key: q.feature_key,
          help_text: q.help_text ?? null,
        }));

        const attritionSurvey: Survey = {
          id: "ATTRITION_DEMO", 
          name: "Attrition Survey Demo",
          description:
            "Short engagement & context survey used to estimate resignation risk.",
          due_date: null,
          survey_questions: attritionQuestions,
        };

        list = [...list, attritionSurvey];
      }

      setSurveys(list);
    } catch (e) {
      console.error("Error loading surveys:", e);
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     Search / filter
     ========================================================= */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return surveys;
    return surveys.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    );
  }, [surveys, search]);

  /* =========================================================
     Modal helpers
     ========================================================= */

  function openAnswerModal(s: Survey) {
    const init: Record<string, string | number | string[]> = {};

    for (const q of s.survey_questions) {
      if (q.question_type === "multi_choice") {
        init[q.id] = [];
      } else if (q.question_type === "rating" || q.question_type === "rating_1_4") {
        init[q.id] = 0;
      } else {
        // short_text, long_text, yes_no, single_choice
        init[q.id] = "";
      }
    }

    setAnswers(init);

    setEmployeeId("");
    setFirstName("");
    setLastName("");

    setActiveSurvey(s);
    setOpen(true);
  }

  function updateAnswer(qid: string, val: string | number | string[]) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  }

  function validateRespondent(): string | null {
    if (!employeeId.trim()) return "Please enter your Employee ID.";
    if (!firstName.trim()) return "Please enter your First name.";
    if (!lastName.trim()) return "Please enter your Last name.";
    return null;
  }

  /* =========================================================
     Submit: route by survey type
     ========================================================= */

  async function submitAnswers() {
    if (!activeSurvey) return;

    const respondentError = validateRespondent();
    if (respondentError) {
      alert(respondentError);
      return;
    }

    if (activeSurvey.id === "ATTRITION_DEMO") {
      await submitAttritionSurvey();
    } else {
      await submitStandardSurvey();
    }
  }


  async function submitStandardSurvey() {
    if (!activeSurvey) return;

    setSubmitting(true);
    try {
      const empId = employeeId.trim();

      const { data: exists, error: existsErr } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("survey_id", activeSurvey.id)
        .eq("employee_id", empId)
        .limit(1);

      if (existsErr) throw existsErr;

      if (exists && exists.length > 0) {
        alert("You have already submitted this survey with this Employee ID.");
        setSubmitting(false);
        return;
      }

      const { data: respIns, error: respErr } = await supabase
        .from("survey_responses")
        .insert([
          {
            survey_id: activeSurvey.id,
            employee_id: empId,
            status: "Pending",
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            survey: activeSurvey.name,
          },
        ])
        .select("id")
        .single();

      if (respErr) throw respErr;
      const responseId = respIns.id as string;

      // Ответы по вопросам
      const inserts = activeSurvey.survey_questions.map((q) => {
        const v = answers[q.id];
        switch (q.question_type) {
          case "short_text":
          case "long_text":
            return {
              response_id: responseId,
              question_id: q.id,
              answer_text: typeof v === "string" ? v : String(v ?? ""),
            };
          case "rating":
          case "rating_1_4":
            return {
              response_id: responseId,
              question_id: q.id,
              answer_int: typeof v === "number" ? v : Number(v ?? 0),
            };
          case "multi_choice":
            return {
              response_id: responseId,
              question_id: q.id,
              answer_opts: Array.isArray(v) ? v : [],
            };
          case "yes_no":
          case "single_choice":
            return {
              response_id: responseId,
              question_id: q.id,
              answer_text: typeof v === "string" ? v : String(v ?? ""),
            };
          default:
            return {
              response_id: responseId,
              question_id: q.id,
              answer_text: String(v ?? ""),
            };
        }
      });

      const { error: ansErr } = await supabase.from("survey_answers").insert(inserts);
      if (ansErr) throw ansErr;

      const { error: updErr } = await supabase
        .from("survey_responses")
        .update({ status: "Submitted" })
        .eq("id", responseId);

      if (updErr) throw updErr;

      setOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to submit: ${e?.message ?? "unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- 2) Attrition Survey Demo -> attrition_survey_responses ---------- */

  async function submitAttritionSurvey() {
    if (!activeSurvey) return;

    setSubmitting(true);
    try {
      const empId = employeeId.trim();

      const { data: exists, error: existsErr } = await supabase
        .from("attrition_survey_responses")
        .select("id")
        .eq("employee_id", empId)
        .limit(1);

      if (existsErr) throw existsErr;

      if (exists && exists.length > 0) {
        alert("You have already submitted the attrition survey with this Employee ID.");
        setSubmitting(false);
        return;
      }

      const featurePayload: Record<string, any> = {};

      for (const q of activeSurvey.survey_questions) {
        if (!q.feature_key) continue;
        const raw = answers[q.id];

        switch (q.question_type) {
          case "rating_1_4": {
            const n =
              typeof raw === "number"
                ? raw
                : Number(raw ?? 0);
            featurePayload[q.feature_key] =
              n >= 1 && n <= 4 ? n : null;
            break;
          }
          case "yes_no": {
            featurePayload[q.feature_key] =
              typeof raw === "string" ? raw : "";
            break;
          }
          case "single_choice": {
            featurePayload[q.feature_key] =
              typeof raw === "string" ? raw : "";
            break;
          }
          default: {
            featurePayload[q.feature_key] = raw ?? null;
            break;
          }
        }
      }

      const insertRow = {
        employee_id: empId,
        employee_name: `${firstName.trim()} ${lastName.trim()}`,
        ...featurePayload,
      };

      const { error: insErr } = await supabase
        .from("attrition_survey_responses")
        .insert([insertRow]);

      if (insErr) throw insErr;

      alert("Thank you! Your attrition survey has been submitted.");
      setOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to submit attrition survey: ${e?.message ?? "unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     Render
     ========================================================= */

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
                  <TableCell className="font-medium">
                    {s.name}
                    {s.id === "ATTRITION_DEMO" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Attrition
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {s.description ?? "—"}
                  </TableCell>
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
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-8"
                  >
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeSurvey ? `Answer: ${activeSurvey.name}` : "Answer survey"}
            </DialogTitle>
            {activeSurvey?.description && (
              <p className="text-sm text-gray-600 mt-1">
                {activeSurvey.description}
              </p>
            )}
          </DialogHeader>

          {!activeSurvey ? (
            <div className="p-6 text-gray-500">Loading…</div>
          ) : (
            <div className="space-y-6 pr-1">
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

              {/* Dynamic questions */}
              <div className="space-y-4">
                {activeSurvey.survey_questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    <Label className="block mb-1">
                      {idx + 1}. {q.prompt}
                    </Label>
                    {q.help_text && (
                      <div className="text-xs text-gray-500 mb-2">
                        {q.help_text}
                      </div>
                    )}

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
                      />
                    )}

                    {(q.question_type === "rating" ||
                      q.question_type === "rating_1_4") && (
                      <div className="flex items-center gap-2">
                        {Array.from({
                          length: q.question_type === "rating_1_4" ? 4 : 5,
                        }).map((_, i) => {
                          const n = i + 1;
                          const current = answers[q.id] as number;
                          const active = current === n;
                          return (
                            <Button
                              key={n}
                              type="button"
                              variant={active ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateAnswer(q.id, n)}
                              className={
                                active
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : ""
                              }
                            >
                              {n}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {q.question_type === "multi_choice" && (
                      <div className="flex flex-wrap gap-2">
                        {(q.options ?? []).map((opt) => {
                          const arr = (answers[q.id] as string[]) ?? [];
                          const checked = arr.includes(opt);
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={checked ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const next = new Set(arr);
                                if (checked) next.delete(opt);
                                else next.add(opt);
                                updateAnswer(q.id, Array.from(next));
                              }}
                              className={
                                checked
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : ""
                              }
                            >
                              {opt}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {q.question_type === "yes_no" && (
                      <div className="flex gap-2">
                        {["Yes", "No"].map((opt) => {
                          const current = (answers[q.id] as string) ?? "";
                          const checked = current === opt;
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={checked ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                updateAnswer(
                                  q.id,
                                  checked ? "" : opt
                                )
                              }
                              className={
                                checked
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : ""
                              }
                            >
                              {opt}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                  
                    {q.question_type === "single_choice" && (!q.options || q.options.length === 0) && (
                      <Input
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                        placeholder="Enter a value"
                      />
                    )}

                    {q.question_type === "single_choice" && q.options && q.options.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => {
                          const current = (answers[q.id] as string) ?? "";
                          const checked = current === opt;
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={checked ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                updateAnswer(
                                  q.id,
                                  checked ? "" : opt
                                )
                              }
                              className={
                                checked
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : ""
                              }
                            >
                              {opt}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter className="pt-2">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
