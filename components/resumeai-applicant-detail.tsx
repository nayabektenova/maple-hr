"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

/* ----- One sample resume & scan that we’ll show for everyone ----- */
const RESUME_SAMPLE = `FIRST LAST
Bay Area, California • +1-234-456-789 • professionalemail@resumeworded.com • linkedin.com/in/username

Software Engineer with over six years of experience in full-stack development and leading product
cycle from conception to completion. Guided a team of 5–15 members through 5+ product launches
at a recent experience in a high growth technology startup.

PROFESSIONAL EXPERIENCE
Resume Worded, New York, NY                                   2020 – Present
Software Engineer
• Created an invoicing system for subscription services that managed monthly invoices and
  printed invoices to be sent to customers; increased conversion rate by 15%.
• Collaborated with internal teams, including graphic design and QA testers to develop and
  launch a new application in just 6 months, ahead of schedule by 6 months.
• Wrote reusable unit test documents to ensure quality control and detect bugs by increasing
  over 35% efficiency rate.

GrowthX, San Diego, CA                                        2016 – 2020
Software Engineer
• Analyzed information to determine, recommend and plan redesign of a new API; presented
  outputs to CTO.
• Analyzed user needs and software requirements to determine feasibility of design, ensuring
  project completion 3 weeks prior to targeted due date.
• Released and updated 15+ custom .net applications for company clients in health niches.
• Wrote Python and JavaScript libraries to display real time pricing via SkyScanner’s flights
  pricing API, leading to increased customer satisfaction.
• Tip to jobseeker: Bullet points should be in format {Action Verb} {Accomplishment} {Metric};
  e.g. Developed X that led to Y% improvement

Rofocus, New York, NY                                         2012 – 2016
Front-end Developer
• Implemented a new responsive website approach increasing mobile traffic by 22%.
• Partnered with back-end developers and created dynamic web pages using JavaScript,
  resulting in website leads increase by 15%.
• Integrated an A/B testing and managed software workflow using Scrum methodology,
  increasing task success rate by 25%.
• Tip to jobseeker: Bullet points should be in format {Action Verb} {Accomplishment} {Metric};
  e.g. Developed X that led to Y% improvement

EDUCATION
Resume Worded University, San Francisco, CA                    2012
Bachelor of Electrical Engineering
• Awards: Resume Worded Teaching Fellow (only 5 awarded to class), Dean’s List 2012 (Top 10%)
• Completed one-year study abroad with Singapore University

SKILLS & OTHER
Skills: CSS, JavaScript, Python, Advanced SAP, HTML and XML, Scrum Methodology, Database
management software, Software Development Life Cycle
Volunteering: Volunteer as Junior Developer in iOS hotel booking application launch project for 3-
months (2020).
`

const SAMPLE_DETAIL = {
  name: "Hana Takahashi",
  jobTitle: "Software Engineer I",
  resumeText: RESUME_SAMPLE,
  scan: {
    matchRate: 65,
    metrics: [
      { label: "Experience Alignment", value: 45 },
      { label: "Certification Fit", value: 70 },
      { label: "Education Match", value: 80 },
      { label: "Predicted Interview Score", value: 65 },
      { label: "Hard Skills", value: 45 },
      { label: "Seniority Fit", value: 35 },
    ],
  },
}

/* ----- Tiny SVG donut for the match rate ----- */
function Donut({ percent }: { percent: number }) {
  const radius = 64
  const stroke = 12
  const c = 2 * Math.PI * radius
  const dash = (percent / 100) * c
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="mx-auto">
      <circle cx="90" cy="90" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="#34D399"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="96" textAnchor="middle" className="fill-gray-800" style={{ fontSize: 28, fontWeight: 700 }}>
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

export function ResumeAIApplicantDetail() {
  const params = useParams<{ jobId: string }>()
  const jobId = params?.jobId

  const data = SAMPLE_DETAIL // <-- same detail for everyone

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/resume-ai/${jobId}`} className="inline-flex items-center gap-2 text-gray-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Applicant AI Scan</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Resume */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-900">{data.name}</div>
            <div className="text-gray-600">{data.jobTitle}</div>
          </div>
          <div className="border rounded-md">
            <div className="p-6 bg-white">
              <div className="mx-auto max-w-[700px] border rounded-md">
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-6">
                    {data.resumeText}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Scan */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-lg font-semibold text-gray-900 mb-4">Match rate</div>
          <Donut percent={data.scan.matchRate} />
          <ul className="mt-6 space-y-3">
            {data.scan.metrics.map((m) => (
              <li key={m.label} className="flex items-center justify-between text-gray-700">
                <span>{m.label}:</span>
                <span className="font-medium">{m.value}%</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
              Approve
            </Button>
            <Button variant="outline" className="border-red-600 text-red-700 hover:bg-red-50">
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
