from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scheme_router, calculator_router, partner_router

app = FastAPI(title="NidhiSetu API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scheme_router.router, prefix="/api/scheme", tags=["Scheme"])
app.include_router(calculator_router.router, prefix="/api/calculator", tags=["Calculator"])
app.include_router(partner_router.router, prefix="/api/partner", tags=["Partner"])

@app.get("/health")
def health_check():
    return {"status": "running"}