# train_attrition_model.py

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score

# 1. Load data (download WA_Fn-UseC_-HR-Employee-Attrition.csv from Kaggle)
data = pd.read_csv("WA_Fn-UseC_-HR-Employee-Attrition.csv")

# 2. Target: Attrition Yes/No -> 1/0
data["AttritionFlag"] = (data["Attrition"] == "Yes").astype(int)

# 3. Select features (adjust if you want more/less)
numeric_features = [
    "Age",
    "MonthlyIncome",
    "DistanceFromHome",
    "NumCompaniesWorked",
    "TotalWorkingYears",
    "YearsAtCompany",
    "YearsInCurrentRole",
    "YearsSinceLastPromotion",
    "YearsWithCurrManager",
    "EnvironmentSatisfaction",
    "JobSatisfaction",
    "WorkLifeBalance",
    "RelationshipSatisfaction",
    "JobInvolvement",
]

categorical_features = [
    "Department",
    "JobRole",
    "BusinessTravel",
    "MaritalStatus",
    "OverTime",
    "Gender",
]

X = data[numeric_features + categorical_features]
y = data["AttritionFlag"]

# 4. Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 5. Preprocessing
preprocess = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ("num", "passthrough", numeric_features),
    ]
)

# 6. Model: Logistic Regression
clf = Pipeline(
    steps=[
        ("preprocess", preprocess),
        (
            "model",
            LogisticRegression(
                max_iter=5000,
                class_weight="balanced",  # handle imbalance a bit
            ),
        ),
    ]
)

clf.fit(X_train, y_train)

# 7. Basic evaluation
y_pred = clf.predict(X_test)
y_prob = clf.predict_proba(X_test)[:, 1]

print(classification_report(y_test, y_pred))
print("ROC AUC:", roc_auc_score(y_test, y_prob))

# 8. Save model + feature lists
joblib.dump(
    {
        "pipeline": clf,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
    },
    "attrition_model.joblib",
)

print("Saved attrition_model.joblib")
