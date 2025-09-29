import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import uuid

# Configuration
NUM_TRAINSETS = 25
NUM_DAYS = 365  # One year of historical data
DEPOT_BAYS = 10
MAX_MILEAGE = 100000
BRANDING_SLA_MIN_HOURS = 8
CLEANING_SLOTS = 5
FITNESS_VALIDITY_DAYS = 30

# Helper functions
def generate_fitness_status(day, train_id, fitness_expiry):
    if train_id not in fitness_expiry:
        fitness_expiry[train_id] = {
            "rolling_stock": day,
            "signalling": day,
            "telecom": day
        }
    expiry = fitness_expiry[train_id]
    return {
        "rolling_stock": day <= expiry["rolling_stock"] + FITNESS_VALIDITY_DAYS,
        "signalling": day <= expiry["signalling"] + FITNESS_VALIDITY_DAYS,
        "telecom": day <= expiry["telecom"] + FITNESS_VALIDITY_DAYS
    }

def update_fitness_expiry(day, train_id, fitness_expiry, fitness_status):
    if not fitness_status["rolling_stock"]:
        fitness_expiry[train_id]["rolling_stock"] = day
    if not fitness_status["signalling"]:
        fitness_expiry[train_id]["signalling"] = day
    if not fitness_status["telecom"]:
        fitness_expiry[train_id]["telecom"] = day

def generate_job_card_status(day, train_id, job_card_expiry):
    if train_id not in job_card_expiry or day > job_card_expiry[train_id]:
        job_card_expiry[train_id] = day + random.randint(1, 7)
        return "open"
    return "closed"

def generate_branding_hours():
    return round(random.uniform(0, 12), 2)

def generate_mileage(current_mileage, status):
    if status == "revenue":
        return round(current_mileage + random.uniform(100, 500), 2)
    return current_mileage

def assign_cleaning_slots(daily_trains, max_slots):
    random.shuffle(daily_trains)
    slots_assigned = 0
    cleaning_slots = {}
    for train_id in daily_trains:
        if slots_assigned < max_slots and random.random() < 0.7:
            cleaning_slots[train_id] = slots_assigned + 1
            slots_assigned += 1
        else:
            cleaning_slots[train_id] = 0  # Default to 0 instead of None
    return cleaning_slots

def assign_stabling_bays(daily_trains, status_dict, max_bays):
    revenue_trains = [tid for tid in daily_trains if status_dict[tid] == "revenue"]
    other_trains = [tid for tid in daily_trains if status_dict[tid] != "revenue"]
    random.shuffle(revenue_trains)
    random.shuffle(other_trains)
    bays = {}
    bay_num = 1
    for train_id in revenue_trains + other_trains:
        if bay_num <= max_bays:
            bays[train_id] = bay_num
            bay_num += 1
        else:
            bays[train_id] = 0  # Default to 0 instead of None
    return bays

def calculate_shunting_time(bay_position):
    return (bay_position or DEPOT_BAYS + 1) * 5

def heuristic_induction_score(fitness, job_card, branding_hours, mileage, mean_mileage, cleaning_slot):
    score = 0
    if (fitness["rolling_stock"] and fitness["signalling"] and fitness["telecom"] and job_card == "closed"):
        score += 50
        score += min(branding_hours, BRANDING_SLA_MIN_HOURS) * 5
        score -= abs(mileage - mean_mileage) / 1000
        if cleaning_slot > 0:
            score += 10
    return round(score, 2)

def simulate_outcomes(status, fitness_valid, branding_hours, mileage_deviation):
    punctuality = 1.0 if status == "revenue" and fitness_valid else (random.uniform(0.95, 1.0) if status == "revenue" else 0.0)
    cost = round(random.uniform(1000, 5000), 2) if status == "maintenance" else 0.0
    sla_penalty = 1000 if status == "revenue" and branding_hours < BRANDING_SLA_MIN_HOURS else 0
    return punctuality, cost, sla_penalty

# Generate dataset
def generate_train_induction_dataset():
    data = []
    trainsets = {i: {"mileage": round(random.uniform(10000, MAX_MILEAGE), 2), "branding_total": 0.0} for i in range(1, NUM_TRAINSETS + 1)}
    fitness_expiry = {}
    job_card_expiry = {}
    
    start_date = datetime(2024, 1, 1)
    
    for day in range(NUM_DAYS):  # 0 to 364 = 365 days
        date = start_date + timedelta(days=day)
        date_str = date.strftime("%Y-%m-%d")
        daily_trains = list(range(1, NUM_TRAINSETS + 1))
        daily_mileages = [trainsets[tid]["mileage"] for tid in daily_trains]
        mean_mileage = np.mean(daily_mileages)
        
        daily_data = []
        status_dict = {}
        for train_id in daily_trains:
            fitness = generate_fitness_status(day, train_id, fitness_expiry)
            job_card = generate_job_card_status(day, train_id, job_card_expiry)
            branding_hours = generate_branding_hours()
            trainsets[train_id]["branding_total"] += branding_hours if job_card == "closed" else 0.0
            mileage = trainsets[train_id]["mileage"]
            
            score = heuristic_induction_score(fitness, job_card, branding_hours, mileage, mean_mileage, 0)
            daily_data.append({
                "train_id": train_id,
                "fitness": fitness,
                "job_card": job_card,
                "branding_hours": branding_hours,
                "mileage": mileage,
                "score": score
            })
        
        daily_data.sort(key=lambda x: x["score"], reverse=True)
        num_revenue = min(20, sum(1 for d in daily_data if d["score"] > 0))
        for i, d in enumerate(daily_data):
            if i < num_revenue and d["score"] > 0:
                status_dict[d["train_id"]] = "revenue"
            elif i < num_revenue + 3:
                status_dict[d["train_id"]] = "standby"
            else:
                status_dict[d["train_id"]] = "maintenance"
                update_fitness_expiry(day, d["train_id"], fitness_expiry, d["fitness"])
        
        cleaning_slots = assign_cleaning_slots(daily_trains, CLEANING_SLOTS)
        stabling_bays = assign_stabling_bays(daily_trains, status_dict, DEPOT_BAYS)
        
        for d in daily_data:
            train_id = d["train_id"]
            status = status_dict[train_id]
            mileage = generate_mileage(d["mileage"], status)
            trainsets[train_id]["mileage"] = mileage
            fitness_valid = all(d["fitness"].values())
            punctuality, cost, sla_penalty = simulate_outcomes(status, fitness_valid, d["branding_hours"], abs(mileage - mean_mileage))
            
            row = {
                "train_id": train_id,
                "date": date_str,
                "rolling_stock_fitness": d["fitness"]["rolling_stock"],
                "signalling_fitness": d["fitness"]["signalling"],
                "telecom_fitness": d["fitness"]["telecom"],
                "job_card_status": d["job_card"],
                "branding_hours": d["branding_hours"],
                "branding_total": trainsets[train_id]["branding_total"],
                "mileage": mileage,
                "cleaning_slot": cleaning_slots[train_id],
                "stabling_bay": stabling_bays[train_id],
                "shunting_time_minutes": calculate_shunting_time(stabling_bays[train_id]),
                "induction_status": status,
                "induction_score": d["score"],
                "punctuality": punctuality,
                "maintenance_cost": cost,
                "sla_penalty": sla_penalty
            }
            data.append(row)
    
    df = pd.DataFrame(data)
    
    # Ensure no missing values
    df["is_serviceable"] = (df["rolling_stock_fitness"] & 
                          df["signalling_fitness"] & 
                          df["telecom_fitness"] & 
                          (df["job_card_status"] == "closed")).astype(int)
    df["branding_sla_met"] = (df["branding_hours"] >= BRANDING_SLA_MIN_HOURS).astype(int)
    df["mileage_balance_deviation"] = df.groupby("date")["mileage"].transform(lambda x: abs(x - x.mean())).round(2)
    
    # Fill any potential NaN with defaults
    df["cleaning_slot"] = df["cleaning_slot"].fillna(0).astype(int)
    df["stabling_bay"] = df["stabling_bay"].fillna(0).astype(int)
    df["shunting_time_minutes"] = df["shunting_time_minutes"].fillna(0).astype(int)
    df["punctuality"] = df["punctuality"].fillna(0.0)
    
    output_file = f"train_induction_dataset_{uuid.uuid4().hex}.csv"
    df.to_csv(output_file, index=False)
    print(f"Dataset saved to {output_file}")
    print("Dataset shape:", df.shape)
    print("Missing values per column:\n", df.isnull().sum())
    print(df.head())
    
    return df

if __name__ == "__main__":
    generate_train_induction_dataset()