from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PipelineDeal

router = APIRouter()


@router.post("/migrate")
def migrate_pipeline(db: Session = Depends(get_db)):
    """Create pipeline_deals table if not exists."""
    from sqlalchemy import text
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS pipeline_deals (
            id UUID PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            sector VARCHAR(100) NOT NULL,
            stage VARCHAR(50) NOT NULL,
            strategy VARCHAR(50) NOT NULL,
            description TEXT,
            deal_size FLOAT,
            valuation FLOAT,
            revenue FLOAT,
            growth_rate FLOAT,
            source VARCHAR(255),
            lead_contact VARCHAR(255),
            priority VARCHAR(50) DEFAULT 'medium',
            notes TEXT,
            entered_pipeline TIMESTAMP,
            last_activity TIMESTAMP,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """))
    db.commit()
    return {"status": "migrated"}


@router.post("/seed")
def seed_pipeline(db: Session = Depends(get_db)):
    """Temporary endpoint to seed pipeline deals on Railway."""
    import uuid
    import random
    from datetime import datetime, timedelta

    random.seed(42)

    # Clear existing
    db.query(PipelineDeal).delete()
    db.commit()

    deals_data = [
        # ── SCREENING ──
        ("Glow Republic", "beauty", "screening", "consumer", "DTC clean skincare brand targeting Gen Z. Viral TikTok presence with 2M+ followers. Strong repeat purchase rates and 4.8-star average across 12K reviews.", 45e6, 180e6, 32e6, 85, "Proprietary sourcing", "Tracey Thompson", "high", 5),
        ("FreshPaws", "pet", "screening", "consumer", "Premium fresh pet food delivery service. Subscription model with 70% retention at 12 months. Expanding from DTC into Petco.", 60e6, 250e6, 48e6, 62, "JP Morgan referral", "Jordan Siegal", "high", 3),
        ("BrewHaus", "food-bev", "screening", "consumer", "Non-alcoholic craft beer brand. #1 NA beer on Amazon. Expanding into Whole Foods and Target. Category growing 30%+ YoY.", 35e6, 140e6, 22e6, 120, "Industry conference", "Sara Harvey", "medium", 8),
        ("Nomad Analytics", "software", "screening", "technology", "AI-powered supply chain optimization for mid-market consumer brands. Integrates with Shopify, NetSuite, and Amazon Seller Central.", 25e6, 120e6, 15e6, 95, "Portfolio company referral", "Indy Guha", "medium", 12),
        ("Zenith Supplements", "wellness", "screening", "consumer", "Performance nutrition brand targeting CrossFit and functional fitness communities. Strong ambassador program with 200+ athletes.", 30e6, 130e6, 20e6, 55, "Founder outreach", "Wayne Wu", "medium", 2),
        ("Halo Pet Co", "pet", "screening", "consumer", "Premium pet accessories and wellness products. Instagram-native brand with 800K followers. Available in 3,000 independent pet stores.", 28e6, 115e6, 18e6, 72, "William Blair", "Carter McKeon", "medium", 6),
        ("Luminary AI", "software", "screening", "technology", "AI copilot for brand managers at CPG companies. Automates reporting, forecasting, and competitive intelligence. 15 enterprise customers.", 18e6, 90e6, 8e6, 140, "Proprietary sourcing", "Sam Shapiro", "high", 4),

        # ── DILIGENCE ──
        ("Vive Wellness", "wellness", "diligence", "consumer", "Adaptogen-based functional beverages. Available in 8,000 doors including Whole Foods, Sprouts, and Erewhon. Strong velocity metrics.", 75e6, 320e6, 58e6, 55, "Goldman Sachs", "Mike Mauzé", "high", 18),
        ("Luma Beauty", "beauty", "diligence", "consumer", "Prestige skincare brand with celebrity founder who has genuine product development involvement. Sephora exclusive with plans for international expansion.", 100e6, 450e6, 85e6, 42, "Jefferies", "Alisa Carmichael", "high", 25),
        ("DataMesh", "software", "diligence", "technology", "Real-time consumer data platform for CPG brands. 140% net revenue retention. Customers include 3 Fortune 500 CPGs. CAC payback < 12 months.", 30e6, 150e6, 18e6, 78, "Proprietary sourcing", "Jeremy Levy", "medium", 15),
        ("Wild Root Provisions", "food-bev", "diligence", "consumer", "Organic snack platform with two brands and combined $40M revenue. Strong velocity in natural channel. Potential for conventional grocery expansion.", 55e6, 200e6, 40e6, 35, "Piper Sandler", "McConnell Smith", "medium", 22),
        ("RetailOS", "software", "diligence", "technology", "Unified retail operations platform — POS, inventory, CRM for multi-location consumer brands. Strong fit with VMG portfolio company needs.", 28e6, 140e6, 16e6, 72, "Raymond James", "Dhruv Bansal", "medium", 20),
        ("Saffron & Co", "food-bev", "diligence", "consumer", "Premium spice and seasoning brand with Mediterranean heritage story. 40% gross margins. QVC success driving awareness; now expanding to Kroger.", 42e6, 170e6, 30e6, 48, "Harris Williams", "Allen Sha", "medium", 16),
        ("Wagsworth & Co", "pet", "diligence", "consumer", "Subscription pet toy and treat box with proprietary product development. 85% 6-month retention. 250K active subscribers.", 70e6, 300e6, 55e6, 38, "Lazard", "Jordan Siegal", "high", 19),

        # ── IC REVIEW ──
        ("Radiant Labs", "beauty", "ic_review", "consumer", "Clinical skincare brand with dermatologist-backed formulations. #1 on Dermstore. Expanding to Ulta with 1,200-door rollout planned for Q3.", 80e6, 350e6, 65e6, 48, "Lazard", "Robin Tsai", "high", 30),
        ("PetVet Connect", "pet", "ic_review", "technology", "Telehealth platform for veterinary care. 500K+ registered pets. B2B2C model partnering with 2,000+ vet clinics nationwide.", 20e6, 95e6, 12e6, 110, "Board member referral", "Carle Stenmark", "high", 35),
        ("Verde Organics", "food-bev", "ic_review", "consumer", "Organic baby food and toddler snacks. #2 brand on Amazon in category. Strong mission-driven community. Expanding into Costco.", 58e6, 240e6, 44e6, 52, "Centerview Partners", "Lucinda Liu", "high", 28),

        # ── TERM SHEET ──
        ("Sol Provisions", "food-bev", "term_sheet", "consumer", "Premium Mexican-inspired CPG brand. Salsas, sauces, and seasonings. Authentic founder story. Strong brand with 68% aided awareness in target demo.", 65e6, 280e6, 52e6, 38, "William Blair", "Jose Bermudez", "high", 40),
        ("FlexStack", "software", "term_sheet", "technology", "Composable commerce platform for mid-market brands. Headless architecture with 40+ pre-built integrations. 130% NRR.", 35e6, 175e6, 22e6, 65, "Qatalyst Partners", "Indy Guha", "high", 45),

        # ── CLOSED ──
        ("Aura Botanicals", "wellness", "closed", "consumer", "CBD-free plant-based wellness brand. Supplements, topicals, and teas. Strong Amazon presence with 15K+ reviews. Closed Feb 2026.", 50e6, 210e6, 38e6, 45, "Harris Williams", "Tracey Thompson", "high", 55),
        ("Kinetic Commerce", "software", "closed", "technology", "Headless loyalty and rewards platform for DTC brands. 95% gross margins. 180 brand customers. Closed Jan 2026.", 22e6, 110e6, 14e6, 88, "Proprietary sourcing", "Jeremy Levy", "high", 62),

        # ── PASSED ──
        ("QuickBite", "food-bev", "passed", "consumer", "Meal kit delivery for single-serving portions. High growth but customer acquisition costs unsustainable. Gross margins below 30%.", 40e6, 160e6, 28e6, 70, "Morgan Stanley", "Sara Harvey", "low", 60),
        ("Byte Commerce", "marketplace", "passed", "technology", "Social commerce marketplace for artisan goods. Beautiful product but take rate too low. Path to profitability unclear at scale.", 15e6, 60e6, 9e6, 85, "Proprietary sourcing", "Sam Shapiro", "low", 50),
        ("NovaSkin", "beauty", "passed", "consumer", "K-beauty inspired skincare. Trendy but undifferentiated formulations. Crowded category with no clear moat. Founder/market fit concerns.", 35e6, 140e6, 20e6, 60, "Evercore", "Eliza Becker", "low", 42),
    ]

    now = datetime.utcnow()
    for name, sector, stage, strategy, desc, size, val, rev, growth, source, contact, priority, days in deals_data:
        deal = PipelineDeal(
            id=uuid.uuid4(),
            company_name=name,
            sector=sector,
            stage=stage,
            strategy=strategy,
            description=desc,
            deal_size=size,
            valuation=val,
            revenue=rev,
            growth_rate=growth,
            source=source,
            lead_contact=contact,
            priority=priority,
            entered_pipeline=now - timedelta(days=days + random.randint(5, 30)),
            last_activity=now - timedelta(days=days),
        )
        db.add(deal)

    db.commit()
    return {"status": "seeded", "count": len(deals_data)}


@router.get("/deals")
def get_deals(stage: str | None = None, strategy: str | None = None, db: Session = Depends(get_db)):
    """Return pipeline deals, optionally filtered by stage or strategy."""
    query = db.query(PipelineDeal)
    if stage:
        query = query.filter(PipelineDeal.stage == stage)
    if strategy:
        query = query.filter(PipelineDeal.strategy == strategy)
    deals = query.order_by(PipelineDeal.last_activity.desc()).all()

    results = []
    for d in deals:
        results.append({
            "id": str(d.id),
            "company_name": d.company_name,
            "sector": d.sector,
            "stage": d.stage,
            "strategy": d.strategy,
            "description": d.description,
            "deal_size": d.deal_size,
            "valuation": d.valuation,
            "revenue": d.revenue,
            "growth_rate": d.growth_rate,
            "source": d.source,
            "lead_contact": d.lead_contact,
            "priority": d.priority,
            "notes": d.notes,
            "entered_pipeline": d.entered_pipeline.isoformat() if d.entered_pipeline else None,
            "last_activity": d.last_activity.isoformat() if d.last_activity else None,
        })

    return {"deals": results, "total": len(results)}


@router.patch("/deals/{deal_id}/stage")
def update_deal_stage(deal_id: str, stage: str, db: Session = Depends(get_db)):
    """Update a deal's stage (for kanban drag-and-drop)."""
    deal = db.query(PipelineDeal).filter(PipelineDeal.id == deal_id).first()
    if not deal:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Deal not found")
    deal.stage = stage
    from datetime import datetime
    deal.last_activity = datetime.utcnow()
    db.commit()
    return {"status": "updated", "deal_id": deal_id, "new_stage": stage}


@router.get("/summary")
def get_pipeline_summary(db: Session = Depends(get_db)):
    """Return pipeline summary stats."""
    deals = db.query(PipelineDeal).all()

    stages = {}
    total_value = 0
    for d in deals:
        s = d.stage or "unknown"
        stages[s] = stages.get(s, 0) + 1
        if d.deal_size:
            total_value += d.deal_size

    return {
        "total_deals": len(deals),
        "by_stage": stages,
        "total_pipeline_value": total_value,
    }
