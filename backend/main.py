import os
import smtplib
import ssl
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_SECURE = os.getenv("SMTP_SECURE", "true").lower() == "true"
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Lofty Action Desk <no-reply@example.com>")

LeadType = Literal["buyer", "seller"]
DealStage = Literal["new", "qualified", "showing", "negotiation", "under_contract", "closed"]
Priority = Literal["high", "medium", "low"]
DealHealth = Literal["green", "yellow", "red"]
Channel = Literal["email", "sms", "call"]
Tone = Literal["friendly", "formal"]

app = FastAPI(title="Lofty Action Desk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Listing(BaseModel):
    address: str
    daysOnMarket: int
    priceReductionDiscussed: bool = False

class Lead(BaseModel):
    id: str
    name: str
    type: LeadType
    budget: int
    stage: DealStage
    lastTouchDays: int
    lastTouchChannel: Channel
    emailOpened: bool
    replied: bool
    engagementScore: int
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: List[str] = []
    listing: Optional[Listing] = None

class Action(BaseModel):
    id: str
    leadId: str
    title: str
    priority: Priority
    health: DealHealth
    reason: str
    createdAt: str
    suggestedChannel: Channel
    recommendedTone: Tone
    completed: bool = False
    approved: bool = False
    sent: bool = False
    sentAt: Optional[str] = None
    sentTo: Optional[str] = None
    subject: Optional[str] = None
    draft: Optional[str] = None

class DraftRequest(BaseModel):
    tone: Tone = "friendly"
    channel: Channel = "email"
    goal: str = "re-engage the lead and move the deal forward"

class ExplainRequest(BaseModel):
    detailLevel: Literal["short", "full"] = "short"

class SmartPlanRequest(BaseModel):
    leadType: LeadType
    stage: DealStage
    daysOnMarket: Optional[int] = None
    budget: Optional[int] = None

class SmartPlanItem(BaseModel):
    day: int
    channel: Channel
    action: str
    rationale: str

db = {
    "leads": [],
    "actions": []
}

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def clamp(n: int, min_v: int, max_v: int) -> int:
    return max(min_v, min(n, max_v))

def get_deal_health_score(lead: Lead):
    score = 100
    reasons = []

    if lead.lastTouchDays >= 3:
        score -= 15
        reasons.append(f"idle {lead.lastTouchDays} days")

    if lead.lastTouchDays >= 7:
        score -= 15
        reasons.append("no touch in over a week")

    if lead.emailOpened and not lead.replied:
        score -= 20
        reasons.append("opened email but did not reply")

    if lead.stage == "negotiation":
        score -= 10
        reasons.append("in negotiation, timing matters")

    if lead.stage == "new":
        score -= 5
        reasons.append("still early in pipeline")

    if lead.type == "seller" and lead.listing and lead.listing.daysOnMarket > 14:
        score -= 10
        reasons.append(f"listing has been on market {lead.listing.daysOnMarket} days")

    if lead.engagementScore < 50:
        score -= 15
        reasons.append("low engagement score")

    score = clamp(score, 0, 100)

    if score < 50:
        health = "red"
    elif score < 75:
        health = "yellow"
    else:
        health = "green"

    return {"score": score, "health": health, "reasons": reasons}

def priority_from_score(score: int) -> Priority:
    if score < 50:
        return "high"
    if score < 75:
        return "medium"
    return "low"

def build_actions_for_lead(lead: Lead):
    health = get_deal_health_score(lead)
    priority = priority_from_score(health["score"])
    channel: Channel = "sms" if lead.replied else "call" if lead.emailOpened else "email"
    tone: Tone = "formal" if lead.stage == "negotiation" else "friendly"

    title = f"Re-engage {lead.name}" if lead.type == "seller" else f"Follow up with {lead.name}"
    reason = ", ".join(health["reasons"]) if health["reasons"] else "recent engagement and pipeline status suggest a normal follow-up"
    if reason:
        reason = f"{reason}. Suggested next step: {channel} follow-up."

    return Action(
        id=uid("action"),
        leadId=lead.id,
        title=title,
        priority=priority,
        health=health["health"],
        reason=reason,
        createdAt=now_iso(),
        suggestedChannel=channel,
        recommendedTone=tone,
        completed=False,
        approved=False,
        sent=False,
    )

def seed_data():
    leads = [
        Lead(
            id="lead_001",
            name="John Smith",
            type="seller",
            budget=850000,
            stage="negotiation",
            lastTouchDays=5,
            lastTouchChannel="email",
            emailOpened=True,
            replied=False,
            engagementScore=72,
            email="john.smith@example.com",
            phone="+15555550101",
            notes=["Asked about price reduction", "Viewed comps twice", "Wants update before Friday"],
            listing=Listing(address="123 Main St", daysOnMarket=21, priceReductionDiscussed=True),
        ),
        Lead(
            id="lead_002",
            name="Maria Gonzalez",
            type="buyer",
            budget=620000,
            stage="showing",
            lastTouchDays=2,
            lastTouchChannel="sms",
            emailOpened=True,
            replied=True,
            engagementScore=88,
            email="maria.gonzalez@example.com",
            phone="+15555550102",
            notes=["Loved kitchen layout", "Asked for HOA docs"],
        ),
        Lead(
            id="lead_003",
            name="Ava Patel",
            type="seller",
            budget=1150000,
            stage="new",
            lastTouchDays=9,
            lastTouchChannel="call",
            emailOpened=False,
            replied=False,
            engagementScore=41,
            email="ava.patel@example.com",
            phone="+15555550103",
            notes=["Requested CMA", "Has not responded to follow-up"],
            listing=Listing(address="88 Oak Avenue", daysOnMarket=0, priceReductionDiscussed=False),
        ),
    ]

    actions = [build_actions_for_lead(lead) for lead in leads]
    db["leads"] = leads
    db["actions"] = actions

seed_data()

def find_lead(lead_id: str):
    for lead in db["leads"]:
        if lead.id == lead_id:
            return lead
    return None

def find_action(action_id: str):
    for action in db["actions"]:
        if action.id == action_id:
            return action
    return None

def action_with_lead(action: Action):
    lead = find_lead(action.leadId)
    if not lead:
        return None
    health = get_deal_health_score(lead)
    return {
        **action.model_dump(),
        "lead": lead.model_dump(),
        "healthScore": health["score"],
        "healthReasons": health["reasons"],
    }

def make_subject(lead: Lead):
    if lead.type == "seller":
        return f"Quick update on {lead.listing.address if lead.listing else 'your listing'}"
    return "Quick follow-up on your search"

async def call_openai(prompt: str):
    if not OPENAI_API_KEY:
        return None

    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful real estate assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
    )
    return resp.choices[0].message.content

def fallback_draft(lead: Lead, action: Action, tone: Tone, channel: Channel):
    greeting = f"Hi {lead.name},"
    lines = [
        greeting,
        "",
        f"I wanted to follow up on {'the listing' if lead.type == 'seller' else 'your search'}.",
        "",
        f"I think the next best step is a quick {channel} touch to keep momentum going.",
        "",
        "Would you be open to a quick update this week?",
        "",
        "Best,",
    ]
    return "\n".join(lines)

def fallback_explanation(lead: Lead, action: Action):
    health = get_deal_health_score(lead)
    return {
        "summary": f"This action is {action.priority} priority because the deal is {health['health']} and the lead needs a timely follow-up.",
        "bullets": [f"• {r}" for r in health["reasons"]],
    }

def smtp_transporter_ready():
    return all([SMTP_HOST, SMTP_USER, SMTP_PASS])

def send_smtp_email(to_email: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()

    if SMTP_SECURE:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

@app.get("/api/health")
def health():
    return {"ok": True, "service": "lofty-action-desk-backend", "ts": now_iso()}

@app.get("/api/leads")
def get_leads():
    leads_out = []
    for lead in db["leads"]:
        health = get_deal_health_score(lead)
        leads_out.append({
            **lead.model_dump(),
            "healthScore": health["score"],
            "dealHealth": health["health"],
            "healthReasons": health["reasons"],
        })
    return {"leads": leads_out}

@app.get("/api/actions")
def get_actions():
    actions = [action_with_lead(a) for a in db["actions"]]
    actions = [a for a in actions if a is not None]
    actions.sort(key=lambda a: {"high": 0, "medium": 1, "low": 2}[a["priority"]])
    return {"actions": actions}

@app.get("/api/actions/{action_id}")
def get_action(action_id: str):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    hydrated = action_with_lead(action)
    return {"action": hydrated}

@app.post("/api/actions/{action_id}/draft")
async def generate_draft(action_id: str, payload: DraftRequest):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    prompt = f"""
Write a real estate outreach draft.
Tone: {payload.tone}
Channel: {payload.channel}
Goal: {payload.goal}

Lead JSON:
{lead.model_dump_json(indent=2)}

Action JSON:
{action.model_dump_json(indent=2)}

Return only the draft text.
""".strip()

    try:
        ai = await call_openai(prompt)
        draft = ai.strip() if ai else fallback_draft(lead, action, payload.tone, payload.channel)
        action.draft = draft
        action.subject = make_subject(lead)
        return {
            "draft": draft,
            "subject": action.subject,
            "tone": payload.tone,
            "channel": payload.channel,
            "goal": payload.goal,
            "source": "openai" if ai else "fallback",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/actions/{action_id}/explain")
async def explain_action(action_id: str, payload: ExplainRequest):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    prompt = f"""
Explain why this action is important for a real estate agent.
Detail level: {payload.detailLevel}
Be transparent and specific.

Lead JSON:
{lead.model_dump_json(indent=2)}

Action JSON:
{action.model_dump_json(indent=2)}

Return a concise explanation.
""".strip()

    try:
        ai = await call_openai(prompt)
        if ai:
            return {"explanation": ai.strip(), "source": "openai"}

        fallback = fallback_explanation(lead, action)
        return {"explanation": fallback, "source": "fallback"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/actions/{action_id}/approve")
def approve_action(action_id: str):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not action.draft:
        raise HTTPException(status_code=400, detail="Generate a draft before approving")

    action.approved = True
    if not action.subject:
        action.subject = make_subject(lead)

    return {
        "ok": True,
        "message": "Action approved. You can now send it.",
        "action": action_with_lead(action),
    }

@app.post("/api/actions/{action_id}/send")
def send_action(action_id: str):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not action.approved:
        raise HTTPException(status_code=400, detail="Approve the action before sending")

    if not action.draft:
        raise HTTPException(status_code=400, detail="No draft found. Generate a draft first.")

    if not lead.email:
        raise HTTPException(status_code=400, detail="Lead has no email address on file")

    if not smtp_transporter_ready():
        raise HTTPException(
            status_code=500,
            detail="SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and FROM_EMAIL.",
        )

    subject = action.subject or make_subject(lead)

    try:
        send_smtp_email(lead.email, subject, action.draft)
        action.sent = True
        action.sentAt = now_iso()
        action.sentTo = lead.email
        action.completed = True
        return {
            "ok": True,
            "message": "Email sent successfully.",
            "action": action_with_lead(action),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/smart-plan")
async def smart_plan(payload: SmartPlanRequest):
    prompt = f"""
Create a follow-up cadence for a real estate lead.
Lead type: {payload.leadType}
Stage: {payload.stage}
Days on market: {payload.daysOnMarket if payload.daysOnMarket is not None else "unknown"}
Budget: {payload.budget if payload.budget is not None else "unknown"}

Return a JSON array with 4 items. Each item should have: day, channel, action, rationale.
""".strip()

    try:
        ai = await call_openai(prompt)
        if ai:
            return {"plan": ai.strip(), "source": "openai"}

        fallback = [
            SmartPlanItem(day=0, channel="email", action="Send a concise value-add follow-up", rationale="Start with context and a clear next step."),
            SmartPlanItem(day=3, channel="sms", action="Send a brief check-in text", rationale="Lightweight nudge to keep momentum without being intrusive."),
            SmartPlanItem(day=7, channel="call", action="Call to discuss next steps", rationale="Higher-touch outreach helps when engagement is cooling."),
            SmartPlanItem(day=14, channel="email", action="Send a final value recap and CTA", rationale="Reinforce benefits and reopen the conversation."),
        ]
        return {"plan": [item.model_dump() for item in fallback], "source": "fallback"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mock/seed")
def mock_seed():
    seed_data()
    return {"ok": True, "leads": len(db["leads"]), "actions": len(db["actions"])}