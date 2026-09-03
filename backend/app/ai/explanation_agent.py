from groq import Groq
from app.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def generate_explanation(scheme_name: str, income: float, project_cost: float, loan_amount: float) -> str:
    fallback = (
        f"Based on your annual income of ₹{income:,.0f} and project cost of ₹{project_cost:,.0f}, "
        f"you are eligible for the {scheme_name}. This scheme covers up to ₹{loan_amount:,.0f} of your project cost "
        f"at a concessional interest rate, making it the most suitable option for your needs."
    )

    if not client:
        return fallback

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a financial assistant helping SC beneficiaries understand loan scheme eligibility in simple, friendly language. Keep it under 60 words."},
                {"role": "user", "content": f"Explain why {scheme_name} fits someone with income ₹{income}, project cost ₹{project_cost}, eligible loan amount ₹{loan_amount}."}
            ],
            max_tokens=120,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API error: {e}")
        return fallback