# AcciPredict - Smart Traffic Accident Prediction System
# FINAL YEAR PROJECT - MODEL TRAINING CODE (Enhanced with Visualizations)

# ==========================================
# CELL 1: Install Required Libraries
# ==========================================
!pip install xgboost shap pandas numpy scikit-learn matplotlib seaborn imbalanced-learn

# ==========================================
# CELL 2: Import Libraries & Load Data
# ==========================================
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import shap

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier

import warnings
warnings.filterwarnings('ignore')

# Set aesthetic styling for graphs
sns.set_theme(style="darkgrid")
plt.rcParams['figure.figsize'] = (10, 6)

print("Loading Dataset...")
try:
    df = pd.read_csv('accident_prediction_india.csv')
    print(f"Dataset successfully loaded with {df.shape[0]} rows and {df.shape[1]} columns.")
except FileNotFoundError:
    print("ERROR: Please upload 'accident_prediction_india.csv' to your Colab session!")

# ==========================================
# CELL 3: Data Preprocessing & Target Distribution Graph
# ==========================================
print("\n--- Starting Data Preprocessing ---")

# Fill missing values
for col in df.select_dtypes(include=['object']).columns:
    df[col].fillna(df[col].mode()[0], inplace=True)
for col in df.select_dtypes(include=['float64', 'int64']).columns:
    df[col].fillna(df[col].median(), inplace=True)

# Select Features and Target
features_to_drop = ['Accident ID', 'Location Description', 'Detailed Description', 'Police Report Available']
df_model = df.drop(columns=[col for col in features_to_drop if col in df.columns])
target_col = 'Accident Severity'

# GRAPH 1: Show the distribution of accidents
plt.figure(figsize=(8, 5))
sns.countplot(data=df_model, x=target_col, palette="viridis")
plt.title("Distribution of Accident Severity in Dataset")
plt.ylabel("Number of Records")
plt.xlabel("Severity Level")
plt.show()

# Encode Variables
encoders = {}
for col in df_model.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    df_model[col] = le.fit_transform(df_model[col].astype(str))
    encoders[col] = le

X = df_model.drop(columns=[target_col])
y = df_model[target_col]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print(f"Preprocessing Complete. Training Data Shape: {X_train.shape}")

# Dictionary to store all model accuracies for our final graph
model_accuracies = {}

# ==========================================
# CELL 4: Train Baseline Models
# ==========================================
print("\n--- Training Baseline Models ---")

lr_model = LogisticRegression(max_iter=1000, random_state=42)
lr_model.fit(X_train_scaled, y_train)
lr_pred = lr_model.predict(X_test_scaled)
model_accuracies['Logistic Regression'] = accuracy_score(y_test, lr_pred) * 100
print(f"Logistic Regression Accuracy: {model_accuracies['Logistic Regression']:.2f}%")

dt_model = DecisionTreeClassifier(max_depth=10, random_state=42)
dt_model.fit(X_train_scaled, y_train)
dt_pred = dt_model.predict(X_test_scaled)
model_accuracies['Decision Tree'] = accuracy_score(y_test, dt_pred) * 100
print(f"Decision Tree Accuracy:       {model_accuracies['Decision Tree']:.2f}%")

# ==========================================
# CELL 5: Train Advanced Models
# ==========================================
print("\n--- Training Advanced Models (RF & XGBoost) ---")

rf_model = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)
model_accuracies['Random Forest'] = accuracy_score(y_test, rf_pred) * 100
print(f"Random Forest Accuracy:       {model_accuracies['Random Forest']:.2f}%")

xgb_model = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
xgb_model.fit(X_train, y_train)
xgb_pred = xgb_model.predict(X_test)
model_accuracies['XGBoost'] = accuracy_score(y_test, xgb_pred) * 100
print(f"XGBoost Accuracy:             {model_accuracies['XGBoost']:.2f}%")

# ==========================================
# CELL 6: Final Hybrid Ensemble & Confusion Matrix
# ==========================================
print("\n--- Training Final Proposed Hybrid Ensemble ---")

hybrid_model = VotingClassifier(
    estimators=[
        ('rf', RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)),
        ('xgb', XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42))
    ],
    voting='soft', n_jobs=-1
)
hybrid_model.fit(X_train, y_train)
hybrid_pred = hybrid_model.predict(X_test)
model_accuracies['RF+XGB Ensemble'] = accuracy_score(y_test, hybrid_pred) * 100

print(f"\n=> HYBRID ENSEMBLE ACCURACY:  {model_accuracies['RF+XGB Ensemble']:.2f}% <=")

# GRAPH 2: Confusion Matrix Heatmap
plt.figure(figsize=(7, 5))
cm = confusion_matrix(y_test, hybrid_pred)
target_names = encoders[target_col].inverse_transform([0, 1, 2])
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=target_names, yticklabels=target_names)
plt.title("Confusion Matrix: Hybrid Ensemble")
plt.ylabel("Actual Severity")
plt.xlabel("Predicted Severity")
plt.show()

# ==========================================
# CELL 7: Model Comparison Chart
# ==========================================
# GRAPH 3: Accuracy Bar Chart Comparison
plt.figure(figsize=(10, 6))
bars = plt.bar(model_accuracies.keys(), model_accuracies.values(), color=['gray', 'gray', 'purple', 'blue', 'green'])
plt.title("Algorithm Accuracy Comparison", fontsize=14, fontweight='bold')
plt.ylabel("Accuracy (%)")
plt.ylim(0, 50) # Set Y axis to 50% max so differences are visible

# Add exact percentage text on top of each bar
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval + 1, f"{yval:.1f}%", ha='center', va='bottom', fontweight='bold')

plt.show()

# ==========================================
# CELL 8: SHAP Explainability Visualization
# ==========================================
print("\n--- Generating SHAP Explainability (XGBoost) ---")
explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test.iloc[:100])

# GRAPH 4: SHAP Importance Graph
plt.figure()
shap.summary_plot(shap_values, X_test.iloc[:100], plot_type="bar", show=False)
plt.title("SHAP Feature Importance (What drives the Predictions?)")
plt.tight_layout()
plt.show()
