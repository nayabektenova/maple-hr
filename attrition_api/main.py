# attrition_api/main.py

from pathlib import Path
from typing import List

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Maple HR Attrition API")

# CORS (dev: allow all)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parents[1]  
MODEL_PATH = BASE_DIR / "attrition_model.joblib"

try:
    bundle = joblib.load(MODEL_PATH)
    pipeline = bundle["pipeline"]
except Exception as e:
    raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {e}")


# Schemas 

class EmployeeFeatures(BaseModel):
    Age: int
    MonthlyIncome: float
    DistanceFromHome: int
    NumCompaniesWorked: int
    TotalWorkingYears: int
    YearsAtCompany: int
    YearsInCurrentRole: int
    YearsSinceLastPromotion: int
    YearsWithCurrManager: int
    EnvironmentSatisfaction: int  # 1–4
    JobSatisfaction: int          # 1–4
    WorkLifeBalance: int          # 1–4
    RelationshipSatisfaction: int # 1–4
    JobInvolvement: int           # 1–4
    Department: str               # "Sales"
    JobRole: str                  # "Sales Executive"
    BusinessTravel: str           # "Travel_Rarely"
    MaritalStatus: str            # "Single"
    OverTime: str                 # "Yes" or "No"
    Gender: str                   # "Male"/"Female"


class PredictionResponse(BaseModel):
    risk_percent: float
    risk_bucket: str
    reasons: List[str]


# Explanation helper

def build_reasons(row: pd.Series) -> List[str]:
    """Very simple rule-based explanations based on input features."""
    reasons: List[str] = []

    if row.get("JobSatisfaction", 3) <= 2:
        reasons.append("Low job satisfaction")
    if row.get("EnvironmentSatisfaction", 3) <= 2:
        reasons.append("Low environment satisfaction")
    if row.get("WorkLifeBalance", 3) <= 2:
        reasons.append("Poor work–life balance")
    if row.get("NumCompaniesWorked", 0) >= 4:
        reasons.append("Many previous employers")
    if row.get("OverTime") == "Yes":
        reasons.append("Works frequent overtime")
    if row.get("YearsSinceLastPromotion", 0) >= 4:
        reasons.append("Long time since last promotion")

    return reasons[:3] or ["No major risk factors detected"]


# Routes

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(features: EmployeeFeatures):
    df = pd.DataFrame([features.dict()])

    proba = pipeline.predict_proba(df)[0, 1]
    risk_percent = float(round(proba * 100, 1))

    if risk_percent >= 60:
        bucket = "High"
    elif risk_percent >= 30:
        bucket = "Medium"
    else:
        bucket = "Low"

    reasons = build_reasons(df.iloc[0])

    return PredictionResponse(
        risk_percent=risk_percent,
        risk_bucket=bucket,
        reasons=reasons,
    )
