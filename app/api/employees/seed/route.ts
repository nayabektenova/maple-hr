import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

const seedEmployees = [
  { id: "12345678", firstName: "Abel", lastName: "Fekadu", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Naya", lastName: "Bektenova", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Hunter", lastName: "Tapping", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Darshan", lastName: "Dahal", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Daniel", lastName: "Williams", email: "email@company.com", phone: "+1 234 56789", department: "Maintenance", position: "Janitor assistant" },
  { id: "12345678", firstName: "Thomas", lastName: "Johnson", email: "email@company.com", phone: "+1 234 56789", department: "Maintenance", position: "Janitor" },
  { id: "12345678", firstName: "Jack", lastName: "Mason", email: "email@company.com", phone: "+1 234 56789", department: "Cybersecurity", position: "Cybersecurity Manager" },
  { id: "12345678", firstName: "Zayn", lastName: "Malik", email: "email@company.com", phone: "+1 234 56789", department: "Marketing", position: "Digital Marketing Specialist" },
  { id: "12345678", firstName: "Harry", lastName: "Styles", email: "email@company.com", phone: "+1 234 56789", department: "Administration", position: "Manager" },
  { id: "12345678", firstName: "Liam", lastName: "Payne", email: "email@company.com", phone: "+1 234 56789", department: "Marketing", position: "Coordinator" },
  { id: "12345678", firstName: "Selena", lastName: "Gomez", email: "email@company.com", phone: "+1 234 56789", department: "Marketing", position: "Communications Specialist" },
  { id: "12345678", firstName: "Taylor", lastName: "Swift", email: "email@company.com", phone: "+1 234 56789", department: "Finance", position: "Accountant" },
  { id: "12345678", firstName: "Saul", lastName: "Mullins", email: "email@company.com", phone: "+1 234 56789", department: "Administration", position: "Administrative Assistant" },
  { id: "12345678", firstName: "Amirah", lastName: "Vincent", email: "email@company.com", phone: "+1 234 56789", department: "Finance", position: "Analyst" }
]

export async function POST() {
  const client = await clientPromise
  const db = client.db("maplehr")

  await db.collection("employees").insertMany(seedEmployees)

  return NextResponse.json({ message: "Seeded successfully!" })
}
