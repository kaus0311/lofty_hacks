import json
import os
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

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

# -----------------------------
# Models
# -----------------------------

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
    notes: List[str] = Field(default_factory=list)
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
    draft: Optional[Dict[str, Any]] = None
    draftUpdatedAt: Optional[str] = None

class ActivityEvent(BaseModel):
    id: str
    timestamp: str
    type: str
    entityType: str
    entityId: str
    title: str
    details: Dict[str, Any] = Field(default_factory=dict)

class DraftRequest(BaseModel):
    tone: Tone = "friendly"
    channel: Channel = "email"
    goal: str = "re-engage the lead and move the deal forward"

class DraftUpdateRequest(BaseModel):
    subject: Optional[str] = None
    draft: Dict[str, Any]

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

class StageUpdateRequest(BaseModel):
    stage: DealStage
    note: Optional[str] = None

class ListingUpdateRequest(BaseModel):
    address: Optional[str] = None
    daysOnMarket: Optional[int] = None
    priceReductionDiscussed: Optional[bool] = None

# -----------------------------
# Mock store
# -----------------------------

db = {
    "leads": [],
    "actions": [],
    "activities": [],
}

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def clamp(n: int, min_v: int, max_v: int) -> int:
    return max(min_v, min(n, max_v))

def log_activity(
    event_type: str,
    entity_type: str,
    entity_id: str,
    title: str,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    event = ActivityEvent(
        id=uid("evt"),
        timestamp=now_iso(),
        type=event_type,
        entityType=entity_type,
        entityId=entity_id,
        title=title,
        details=details or {},
    )
    db["activities"].insert(0, event)
    db["activities"][:] = db["activities"][:300]

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

def suggested_channel_for_lead(lead: Lead) -> Channel:
    if lead.replied:
        return "sms"
    if lead.emailOpened:
        return "call"
    return "email"

def recommended_tone_for_lead(lead: Lead) -> Tone:
    return "formal" if lead.stage == "negotiation" else "friendly"

def action_title_for_lead(lead: Lead) -> str:
    return f"Re-engage {lead.name}" if lead.type == "seller" else f"Follow up with {lead.name}"

def action_reason_for_lead(lead: Lead) -> str:
    health = get_deal_health_score(lead)
    base_reason = ", ".join(health["reasons"]) if health["reasons"] else "recent engagement and pipeline status suggest a normal follow-up"
    return f"{base_reason}. Suggested next step: {suggested_channel_for_lead(lead)} follow-up."

def build_actions_for_lead(lead: Lead):
    health = get_deal_health_score(lead)
    priority = priority_from_score(health["score"])
    return Action(
        id=uid("action"),
        leadId=lead.id,
        title=action_title_for_lead(lead),
        priority=priority,
        health=health["health"],
        reason=action_reason_for_lead(lead),
        createdAt=now_iso(),
        suggestedChannel=suggested_channel_for_lead(lead),
        recommendedTone=recommended_tone_for_lead(lead),
        completed=False,
        approved=False,
        sent=False,
    )

def refresh_open_actions_for_lead(lead: Lead) -> None:
    health = get_deal_health_score(lead)
    priority = priority_from_score(health["score"])

    for action in db["actions"]:
        if action.leadId != lead.id:
            continue
        if action.completed or action.sent:
            continue

        action.priority = priority
        action.health = health["health"]
        action.title = action_title_for_lead(lead)
        action.reason = action_reason_for_lead(lead)
        action.suggestedChannel = suggested_channel_for_lead(lead)
        action.recommendedTone = recommended_tone_for_lead(lead)

def seed_data():
    db["leads"] = [
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

    db["actions"] = [build_actions_for_lead(lead) for lead in db["leads"]]
    db["activities"] = []
    log_activity("seed", "system", "seed", "Seeded mock CRM data", {"leads": len(db["leads"]), "actions": len(db["actions"])})

seed_data()

def find_lead(lead_id: str) -> Optional[Lead]:
    return next((l for l in db["leads"] if l.id == lead_id), None)

def find_action(action_id: str) -> Optional[Action]:
    return next((a for a in db["actions"] if a.id == action_id), None)

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

def make_subject(lead: Lead) -> str:
    if lead.type == "seller":
        listing_name = lead.listing.address if lead.listing else "your listing"
        return f"Quick update on {listing_name}"
    return "Quick follow-up on your search"

def draft_to_text(draft: Dict[str, Any]) -> str:
    draft_type = draft.get("type")
    if draft_type == "email":
        return f"Subject: {draft.get('subject', '')}\n\n{draft.get('body', '')}"
    if draft_type == "sms":
        return draft.get("message", "")
    if draft_type == "call":
        parts = []
        if draft.get("opening"):
            parts.append(f"Opening: {draft['opening']}")
        if draft.get("talkTrack"):
            parts.append("Talk track:")
            for item in draft["talkTrack"]:
                parts.append(f"- {item}")
        if draft.get("questions"):
            parts.append("Questions:")
            for item in draft["questions"]:
                parts.append(f"- {item}")
        if draft.get("close"):
            parts.append(f"Close: {draft['close']}")
        if draft.get("voicemail"):
            parts.append(f"Voicemail: {draft['voicemail']}")
        return "\n".join(parts)
    return json.dumps(draft, indent=2)

def fallback_draft(lead: Lead, action: Action, tone: Tone, channel: Channel, goal: str) -> Dict[str, Any]:
    if channel == "email":
        subject = make_subject(lead)
        body = (
            f"Hi {lead.name},\n\n"
            f"I wanted to follow up to {goal}.\n\n"
            f"Given where things stand, I think a quick check-in would be helpful.\n\n"
            f"Would you be open to a quick update this week?\n\n"
            f"Best,\nAgent"
        )
        return {
            "type": "email",
            "subject": subject,
            "body": body,
            "tone": tone,
        }

    if channel == "sms":
        message = (
            f"Hi {lead.name}, just following up on next steps. "
            f"Would love to connect this week if you have a few minutes."
        )
        return {
            "type": "sms",
            "message": message,
            "tone": tone,
            "characterCount": len(message),
        }

    return {
        "type": "call",
        "opening": f"Hi {lead.name}, this is Agent calling about your { 'listing' if lead.type == 'seller' else 'home search' }.",
        "talkTrack": [
            "Confirm current priorities and timing",
            "Reinforce the next best step",
            "Ask about concerns or objections",
        ],
        "questions": [
            "What changed since our last conversation?",
            "What would make this a yes for you?",
            "Is there anything blocking the next step?",
        ],
        "close": "Would it make sense to set up a quick follow-up later this week?",
        "voicemail": f"Hi {lead.name}, it’s Agent. Calling with a quick update and next-step idea. I’ll follow up by text as well.",
        "tone": tone,
    }

def structured_why(lead: Lead, action: Action) -> Dict[str, Any]:
    health = get_deal_health_score(lead)
    score = health["score"]

    factors = []
    if lead.lastTouchDays >= 7:
        factors.append({
            "label": "Stale follow-up",
            "impact": -30,
            "evidence": f"Last touch was {lead.lastTouchDays} days ago.",
        })
    elif lead.lastTouchDays >= 3:
        factors.append({
            "label": "Follow-up is aging",
            "impact": -15,
            "evidence": f"Last touch was {lead.lastTouchDays} days ago.",
        })

    if lead.emailOpened and not lead.replied:
        factors.append({
            "label": "Interest without reply",
            "impact": -20,
            "evidence": "Lead opened the email but did not reply.",
        })

    if lead.stage == "negotiation":
        factors.append({
            "label": "Negotiation needs speed",
            "impact": -10,
            "evidence": "Deal is in negotiation where timing can affect close rate.",
        })

    if lead.type == "seller" and lead.listing and lead.listing.daysOnMarket > 14:
        factors.append({
            "label": "Listing is aging",
            "impact": -10,
            "evidence": f"Listing has been on market for {lead.listing.daysOnMarket} days.",
        })

    if lead.engagementScore < 50:
        factors.append({
            "label": "Low engagement",
            "impact": -15,
            "evidence": f"Engagement score is {lead.engagementScore}.",
        })

    trust = [
        "Recommendation is explainable from recency, engagement, and pipeline stage.",
        "Agent approval is required before sending anything.",
        "Drafts can be edited before approval.",
    ]

    next_steps = [
        f"Send a {action.suggestedChannel} follow-up",
        "Review the draft before approving",
        "Update pipeline stage if the deal has changed",
    ]

    risks = []
    if health["health"] == "red":
        risks.append("High risk of losing momentum")
    elif health["health"] == "yellow":
        risks.append("Needs timely follow-up to avoid stalling")

    return {
        "summary": f"This action is {action.priority} priority because the lead is {health['health']} and needs a timely follow-up.",
        "score": score,
        "health": health["health"],
        "factors": factors,
        "trust": trust,
        "recommended_next_steps": next_steps,
        "risks": risks,
    }

async def call_openai_json(prompt: str) -> Optional[Dict[str, Any]]:
    if not OPENAI_API_KEY:
        return None

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful real estate assistant that returns valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )

        content = resp.choices[0].message.content
        if not content:
            return None
        return json.loads(content)
    except Exception:
        return None

async def call_openai_text(prompt: str) -> Optional[str]:
    if not OPENAI_API_KEY:
        return None

    try:
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
        content = resp.choices[0].message.content
        return content.strip() if content else None
    except Exception:
        return None

# -----------------------------
# Routes
# -----------------------------

@app.get("/api/health")
def health():
    return {
        "ok": True,
        "service": "lofty-action-desk-backend",
        "ts": now_iso(),
        "openaiConfigured": bool(OPENAI_API_KEY),
        "fakeSendOnly": True,
    }

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

@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str):
    lead = find_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    health = get_deal_health_score(lead)
    related_actions = [action_with_lead(a) for a in db["actions"] if a.leadId == lead.id]
    related_actions = [a for a in related_actions if a is not None]

    return {
        "lead": {
            **lead.model_dump(),
            "healthScore": health["score"],
            "dealHealth": health["health"],
            "healthReasons": health["reasons"],
        },
        "actions": related_actions,
    }

@app.patch("/api/leads/{lead_id}/stage")
def update_lead_stage(lead_id: str, payload: StageUpdateRequest):
    lead = find_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_stage = lead.stage
    lead.stage = payload.stage
    refresh_open_actions_for_lead(lead)

    log_activity(
        "stage_update",
        "lead",
        lead.id,
        f"Updated stage for {lead.name}",
        {"from": old_stage, "to": payload.stage, "note": payload.note},
    )

    return {
        "ok": True,
        "message": "Lead stage updated",
        "lead": lead.model_dump(),
        "health": get_deal_health_score(lead),
    }

@app.patch("/api/leads/{lead_id}/listing")
def update_listing(lead_id: str, payload: ListingUpdateRequest):
    lead = find_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.listing:
        lead.listing = Listing(address="Unknown address", daysOnMarket=0, priceReductionDiscussed=False)

    old_listing = lead.listing.model_dump()

    if payload.address is not None:
        lead.listing.address = payload.address
    if payload.daysOnMarket is not None:
        lead.listing.daysOnMarket = payload.daysOnMarket
    if payload.priceReductionDiscussed is not None:
        lead.listing.priceReductionDiscussed = payload.priceReductionDiscussed

    refresh_open_actions_for_lead(lead)

    log_activity(
        "listing_update",
        "lead",
        lead.id,
        f"Updated listing for {lead.name}",
        {"from": old_listing, "to": lead.listing.model_dump()},
    )

    return {
        "ok": True,
        "message": "Listing updated",
        "lead": lead.model_dump(),
        "health": get_deal_health_score(lead),
    }

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
    if not hydrated:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"action": hydrated}

@app.get("/api/actions/{action_id}/history")
def get_action_history(action_id: str):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead_id = action.leadId
    items = [
        e.model_dump()
        for e in db["activities"]
        if e.entityId in {action_id, lead_id}
        or e.details.get("actionId") == action_id
        or e.details.get("leadId") == lead_id
    ]
    return {"history": items}

@app.get("/api/activities")
def get_activities(limit: int = Query(default=50, ge=1, le=200)):
    return {"activities": [e.model_dump() for e in db["activities"][:limit]]}

@app.get("/api/pipeline")
def get_pipeline():
    stage_counts: Dict[str, int] = {}
    for lead in db["leads"]:
        stage_counts[lead.stage] = stage_counts.get(lead.stage, 0) + 1

    health_counts = {"green": 0, "yellow": 0, "red": 0}
    for lead in db["leads"]:
        health_counts[get_deal_health_score(lead)["health"]] += 1

    pending_actions = [a for a in db["actions"] if not a.completed and not a.sent]
    return {
        "stageCounts": stage_counts,
        "healthCounts": health_counts,
        "pendingActions": len(pending_actions),
        "openActions": [action_with_lead(a) for a in pending_actions],
    }

@app.post("/api/actions/{action_id}/draft")
async def generate_draft(action_id: str, payload: DraftRequest):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    prompt = f"""
Create a real estate outreach draft as JSON.

Return one JSON object with this exact shape:
For email:
{{
  "type": "email",
  "subject": "...",
  "body": "..."
}}

For sms:
{{
  "type": "sms",
  "message": "..."
}}

For call:
{{
  "type": "call",
  "opening": "...",
  "talkTrack": ["...", "..."],
  "questions": ["...", "..."],
  "close": "...",
  "voicemail": "..."
}}

Rules:
- Tone: {payload.tone}
- Channel: {payload.channel}
- Goal: {payload.goal}
- Do not invent facts.
- Keep it concise and useful.

Lead JSON:
{lead.model_dump_json(indent=2)}

Action JSON:
{action.model_dump_json(indent=2)}
""".strip()

    ai = await call_openai_json(prompt)
    if ai:
        draft = ai
        source = "openai"
    else:
        draft = fallback_draft(lead, action, payload.tone, payload.channel, payload.goal)
        source = "fallback"

    action.draft = draft
    action.draftUpdatedAt = now_iso()
    if draft.get("type") == "email":
        action.subject = draft.get("subject") or make_subject(lead)
    else:
        action.subject = action.subject or make_subject(lead)

    log_activity(
        "draft_created",
        "action",
        action.id,
        f"Generated draft for {action.title}",
        {"leadId": lead.id, "channel": draft.get("type"), "source": source},
    )

    return {
        "actionId": action.id,
        "subject": action.subject,
        "draft": draft,
        "draftText": draft_to_text(draft),
        "source": source,
    }

@app.put("/api/actions/{action_id}/draft")
def update_draft(action_id: str, payload: DraftUpdateRequest):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    action.draft = deepcopy(payload.draft)
    action.draftUpdatedAt = now_iso()

    if payload.subject is not None:
        action.subject = payload.subject
    elif action.draft.get("type") == "email" and not action.subject:
        action.subject = make_subject(lead)

    log_activity(
        "draft_updated",
        "action",
        action.id,
        f"Edited draft for {action.title}",
        {"leadId": lead.id},
    )

    return {
        "ok": True,
        "message": "Draft saved",
        "action": action_with_lead(action),
    }

@app.post("/api/actions/{action_id}/explain")
async def explain_action(action_id: str, payload: ExplainRequest):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    prompt = f"""
Explain why this action matters for a real estate agent.

Detail level: {payload.detailLevel}
Be transparent, specific, and grounded in the data.

Lead JSON:
{lead.model_dump_json(indent=2)}

Action JSON:
{action.model_dump_json(indent=2)}

Return a concise answer.
""".strip()

    ai = await call_openai_text(prompt)
    if ai:
        return {"explanation": ai, "source": "openai"}

    health = get_deal_health_score(lead)
    summary = f"This action is {action.priority} priority because the deal is {health['health']} and needs a timely follow-up."

    if payload.detailLevel == "short":
        return {"explanation": summary, "source": "fallback"}

    return {
        "explanation": {
            "summary": summary,
            "bullets": [
                f"Lead stage: {lead.stage}",
                f"Last touch: {lead.lastTouchDays} days ago",
                f"Email opened: {'yes' if lead.emailOpened else 'no'}",
                f"Replied: {'yes' if lead.replied else 'no'}",
                f"Engagement score: {lead.engagementScore}",
            ],
        },
        "source": "fallback",
    }

@app.post("/api/actions/{action_id}/why")
def why_action(action_id: str):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    lead = find_lead(action.leadId)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return {"why": structured_why(lead, action)}

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

    log_activity(
        "approved",
        "action",
        action.id,
        f"Approved {action.title}",
        {"leadId": lead.id},
    )

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

    recipient = lead.email if lead.email else lead.phone
    if not recipient:
        raise HTTPException(status_code=400, detail="Lead has no email or phone on file")

    # FAKE SEND ONLY
    print("=== FAKE MESSAGE SENT ===")
    print(f"To: {recipient}")
    if action.subject:
        print(f"Subject: {action.subject}")
    print(draft_to_text(action.draft))
    print("=========================")

    action.sent = True
    action.sentAt = now_iso()
    action.sentTo = recipient
    action.completed = True

    log_activity(
        "sent",
        "action",
        action.id,
        f"Sent {action.title} (simulated)",
        {"leadId": lead.id, "recipient": recipient, "channel": action.draft.get("type")},
    )

    return {
        "ok": True,
        "message": "Message sent (simulated)",
        "action": action_with_lead(action),
    }

@app.post("/api/actions/{action_id}/complete")
def complete_action(action_id: str):
    action = find_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.completed = True

    log_activity(
        "completed",
        "action",
        action.id,
        f"Marked {action.title} complete",
        {},
    )

    return {
        "ok": True,
        "message": "Action marked complete",
        "action": action_with_lead(action),
    }

@app.post("/api/smart-plan")
async def smart_plan(payload: SmartPlanRequest):
    prompt = f"""
Create a follow-up cadence for a real estate lead.

Return a JSON object with:
{{
  "title": "...",
  "items": [
    {{
      "day": 0,
      "channel": "email|sms|call",
      "action": "...",
      "rationale": "..."
    }}
  ]
}}

Lead type: {payload.leadType}
Stage: {payload.stage}
Days on market: {payload.daysOnMarket if payload.daysOnMarket is not None else "unknown"}
Budget: {payload.budget if payload.budget is not None else "unknown"}

Keep it realistic, concise, and specific.
""".strip()

    ai = await call_openai_json(prompt)
    if ai:
        return {"plan": ai, "source": "openai"}

    fallback = {
        "title": f"{payload.leadType.title()} follow-up cadence",
        "items": [
            {
                "day": 0,
                "channel": "email",
                "action": "Send a concise value-add follow-up",
                "rationale": "Start with context and a clear next step.",
            },
            {
                "day": 3,
                "channel": "sms",
                "action": "Send a brief check-in text",
                "rationale": "Lightweight nudge to keep momentum without being intrusive.",
            },
            {
                "day": 7,
                "channel": "call",
                "action": "Call to discuss next steps",
                "rationale": "Higher-touch outreach helps when engagement is cooling.",
            },
            {
                "day": 14,
                "channel": "email",
                "action": "Send a final value recap and CTA",
                "rationale": "Reinforce benefits and reopen the conversation.",
            },
        ],
    }
    return {"plan": fallback, "source": "fallback"}

@app.post("/api/mock/seed")
def mock_seed():
    seed_data()
    return {"ok": True, "leads": len(db["leads"]), "actions": len(db["actions"]), "activities": len(db["activities"])}

# -----------------------------
# Local run
# -----------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)