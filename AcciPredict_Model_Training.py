# %% [markdown]
# # AcciPredict - ML Pipeline & Architecture
# This Jupyter-compatible Python script contains the complete Data Science pipeline.
# You can run this directly in VS Code by clicking "Run Cell" above each block.

# %%
# 1. Import Required Libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import shap

# %%
# 2. Generate/Load Representative Dataset
# (We simulate a dataset here that matches the 3-class distribution of the live project)
np.random.seed(42)
n_samples = 3000

data = {
    'Speed_Limit': np.random.randint(30, 120, n_samples),
    'Weather': np.random.choice(['Clear', 'Rain', 'Fog', 'Hazy'], n_samples),
    'Lighting': np.random.choice(['Daylight', 'Dark - lit', 'Dark - unlit'], n_samples),
    'Road_Condition': np.random.choice(['Dry', 'Wet', 'Icy'], n_samples),
    'Road_Type': np.random.choice(['Urban', 'State Highway', 'National Highway'], n_samples)
}
df = pd.DataFrame(data)

# Create logic for severity target
risk_score = (df['Speed_Limit'] * 0.4) + \
             (df['Weather'] == 'Rain') * 20 + (df['Weather'] == 'Fog') * 30 + \
             (df['Lighting'] == 'Dark - unlit') * 25 + \
             (df['Road_Condition'] == 'Icy') * 25

# Distribute into 3 near-equal classes (Minor, Serious, Fatal)
df['Severity'] = pd.qcut(risk_score, q=3, labels=['Minor', 'Serious', 'Fatal'])

print("✅ Dataset Loaded Successfully!")
print(f"Total Records: {len(df)}")
print(df.head())

# %%
# 3. Exploratory Data Analysis (EDA)
plt.figure(figsize=(14, 5))

# Graph 1: Target Variable Distribution
plt.subplot(1, 2, 1)
sns.countplot(x='Severity', data=df, palette='magma')
plt.title('Accident Severity Distribution (Target)')
plt.xlabel('Severity')
plt.ylabel('Count')

# Graph 2: Speed vs Severity
plt.subplot(1, 2, 2)
sns.boxplot(x='Severity', y='Speed_Limit', data=df, palette='magma')
plt.title('Impact of Speed on Severity Classification')

plt.tight_layout()
plt.show()

# %%
# 4. Data Preprocessing (Encoding & Scaling)
# Label Encoding
le_dict = {}
for col in ['Weather', 'Lighting', 'Road_Condition', 'Road_Type']:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    le_dict[col] = le

X = df.drop('Severity', axis=1)
y = LabelEncoder().fit_transform(df['Severity']) # 0=Minor, 1=Serious, 2=Fatal

# Train-Test Split (80/20)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# StandardScaler
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("✅ Preprocessing Complete (Scaling & Encoding)")

# %%
# 5. Train Hybrid ML Ensemble (Random Forest + XGBoost)
print("Training Baseline Random Forest...")
rf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
rf.fit(X_train_scaled, y_train)
rf_probs = rf.predict_proba(X_test_scaled)

print("Training Advanced XGBoost Classifier...")
xgb_model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
xgb_model.fit(X_train_scaled, y_train)
xgb_probs = xgb_model.predict_proba(X_test_scaled)

# Ensemble Soft Voting
print("Computing Hybrid Ensemble Predictions...")
ensemble_probs = (rf_probs + xgb_probs) / 2
ensemble_preds = np.argmax(ensemble_probs, axis=1)

ensemble_acc = accuracy_score(y_test, ensemble_preds)
print(f"\n🚀 Hybrid Ensemble Accuracy Achieved: {ensemble_acc*100:.2f}%")

# %%
# 6. Evaluation Metrics (Classification Report & Confusion Matrix)
print("====== CLASSIFICATION REPORT ======")
print(classification_report(y_test, ensemble_preds, target_names=['Minor', 'Serious', 'Fatal']))

plt.figure(figsize=(6, 5))
cm = confusion_matrix(y_test, ensemble_preds)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Minor', 'Serious', 'Fatal'], 
            yticklabels=['Minor', 'Serious', 'Fatal'])
plt.title('Hybrid Ensemble Confusion Matrix')
plt.ylabel('Actual Truth')
plt.xlabel('Predicted by Model')
plt.show()

# %%
# 7. Explainable AI: SHAP Analysis (Feature Importance)
# This explains WHY the model makes certain predictions.
print("Generating SHAP Feature Importance...")
explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test_scaled)

# Bar plot showing the average impact of each feature
shap.summary_plot(shap_values, X_test, plot_type="bar", feature_names=X.columns, class_names=['Minor', 'Serious', 'Fatal'])
