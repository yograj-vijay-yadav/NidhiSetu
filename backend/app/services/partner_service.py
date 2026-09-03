import json
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "../../../data/partners_sample.json")


def get_nearby_partners(scheme_type: str = None):
    try:
        with open(DATA_PATH, "r") as f:
            partners = json.load(f)
    except FileNotFoundError:
        partners = []

    filtered = [p for p in partners if not p.get("npa_flag", False)]
    return filtered[:5]