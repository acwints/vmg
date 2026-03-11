from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import companies, memos, activity, stats, fund_model, macro, assistant, pipeline

app = FastAPI(
    title="VMG Partners API",
    description="Portfolio intelligence API for VMG Partners",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(memos.router, prefix="/api/memos", tags=["memos"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(fund_model.router, prefix="/api/fund-model", tags=["fund-model"])
app.include_router(macro.router, prefix="/api/macro", tags=["macro"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["pipeline"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "vmg-api"}
