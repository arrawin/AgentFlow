from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Agent
from api.schemas.agents import AgentCreate, AgentUpdate, AgentResponse
from typing import List

router = APIRouter()


@router.post("/agents", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = Agent(**agent.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.get("/agents", response_model=List[AgentResponse])
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    # Ensure is_system is never None
    for a in agents:
        if a.is_system is None:
            a.is_system = False
    return agents


@router.get("/agents/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/agents/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: int, update: AgentUpdate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.is_system:
        raise HTTPException(status_code=403, detail="System agents cannot be edited")
    for field, value in update.dict(exclude_none=True).items():
        setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/agents/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.is_system:
        raise HTTPException(status_code=403, detail="System agents cannot be deleted")
    db.delete(agent)
    db.commit()
    return {"message": "Agent deleted"}


from pydantic import BaseModel as PydanticBase

class SuggestDomainRequest(PydanticBase):
    skill_content: str

@router.post("/agents/suggest-domain")
def suggest_domain(req: SuggestDomainRequest, db: Session = Depends(get_db)):
    """Given a skill/system prompt, suggest the most appropriate domain."""
    from services.llm_service import LLMService
    from db.models import LLMConfig, Domain

    existing = [d.name for d in db.query(Domain).filter(Domain.name != "SYSTEM").all()]

    llm_config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()
    llm = LLMService(llm_config=llm_config)

    prompt = f"""Given this agent skill/system prompt, suggest the most appropriate domain category.

Skill content:
{req.skill_content[:500]}

Existing domains: {existing if existing else "None yet"}

Rules:
- If one of the existing domains fits well, return that exact name
- If none fit, suggest a short new domain name (1-2 words, e.g. "Research", "Content", "Data Analysis")
- Return ONLY the domain name, nothing else

Domain:"""

    result = llm.generate(prompt)
    if not result:
        return {"domain": "General", "is_new": True}

    suggested = result.strip().strip('"').strip("'").split("\n")[0].strip()

    # Check if it matches an existing domain (case-insensitive)
    for d in db.query(Domain).filter(Domain.name != "SYSTEM").all():
        if d.name.lower() == suggested.lower():
            return {"domain": d.name, "domain_id": d.id, "is_new": False}

    return {"domain": suggested, "is_new": True}


class AgentDryRunRequest(PydanticBase):
    sample_prompt: str

@router.post("/agents/{agent_id}/dry-run")
def agent_dry_run(agent_id: int, req: AgentDryRunRequest, db: Session = Depends(get_db)):
    """Run a single agent with the real LLM — no DB writes, no task run created."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    from services.llm_service import LLMService
    from db.models import LLMConfig
    from tools.registry import TOOLS, build_tool_docs
    import json, re

    llm_config = None
    if agent.llm_config_id:
        llm_config = db.query(LLMConfig).filter(LLMConfig.id == agent.llm_config_id).first()
    if not llm_config:
        llm_config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()

    llm = LLMService(llm_config=llm_config)
    skills = agent.skills or "No specific skills defined."
    tool_list = [t for t in (agent.allowed_tools or []) if t in TOOLS]

    tool_docs, tool_rules = build_tool_docs(tool_list)
    tool_rules_text = "\n".join(f"- {r}" for r in tool_rules)

    agent_result = ""
    tool_calls_log = []
    tool_history = []
    max_iterations = 6

    for iteration in range(max_iterations):
        if agent_result:
            instruction = "You have tool results above. Write your FINAL ANSWER as plain text now."
        else:
            instruction = f"""{tool_docs}
Available tools: {tool_list}
Do NOT add any text before or after the JSON when calling a tool."""

        prompt = f"""You are: {agent.name}
{skills}

TASK:
{req.sample_prompt}

YOUR TOOL RESULTS SO FAR:
{agent_result if agent_result else "None"}

RULES:
- Do NOT call the same tool with same input twice
- If a tool fails, correct your input
{tool_rules_text}

{instruction}"""

        result = llm.generate(prompt)
        if not result:
            break

        # Parse tool call
        clean = re.sub(r"```(?:json)?|```", "", result).strip()
        tool_call = None
        try:
            for i, c in enumerate(clean):
                if c == '{':
                    depth = 0
                    for j, ch in enumerate(clean[i:]):
                        if ch == '{': depth += 1
                        elif ch == '}':
                            depth -= 1
                            if depth == 0:
                                candidate = clean[i:i+j+1]
                                try:
                                    parsed = json.loads(candidate)
                                    tool_name = parsed.get("tool_name")
                                    action = parsed.get("action", "")
                                    if tool_name and (action == "tool_call" or action in TOOLS):
                                        tool_call = parsed
                                    elif not tool_name and action in TOOLS:
                                        parsed["tool_name"] = action
                                        tool_call = parsed
                                except Exception:
                                    pass
                                break
                    if tool_call:
                        break
        except Exception:
            pass

        if tool_call:
            tool_name = tool_call.get("tool_name")
            tool_input = tool_call.get("input", {})

            # Duplicate check
            if any(t["tool"] == tool_name and t["input"] == tool_input for t in tool_history):
                agent_result += "\n[Duplicate tool call blocked]\n"
                agent_result = result
                break

            if tool_name in tool_list:
                tool_fn = TOOLS.get(tool_name)
                if tool_fn:
                    try:
                        tool_result = tool_fn(tool_input)
                    except Exception as e:
                        tool_result = f"Tool error: {str(e)}"
                    tool_history.append({"tool": tool_name, "input": tool_input})
                    tool_calls_log.append({"tool": tool_name, "result": str(tool_result)[:500]})
                    agent_result += f"\nTool '{tool_name}' result:\n<external_data>\n{tool_result}\n</external_data>\n"
                    continue

        agent_result = result
        break

    return {
        "agent_name": agent.name,
        "output": agent_result,
        "tool_calls": tool_calls_log,
        "note": "Real LLM run — tokens were consumed"
    }
