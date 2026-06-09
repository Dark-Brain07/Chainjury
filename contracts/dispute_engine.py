# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class DisputeEngine(gl.Contract):
    """
    ChainJury Dispute Engine: AI-Powered Evidence Evaluation & Verdict Rendering.
    
    This contract handles the core dispute resolution logic:
    - Evidence submission from both parties (plaintiff & defendant)
    - AI-powered evidence evaluation using GenLayer's equivalence principle
    - Web source verification for submitted evidence links
    - Multi-criteria verdict generation with detailed reasoning
    - Automatic case progression through dispute stages
    
    The AI jury evaluates evidence across 5 dimensions:
    1. Evidence Strength - quality and relevance of provided proof
    2. Source Credibility - verification of external evidence sources  
    3. Claim Consistency - internal consistency of arguments
    4. Documentation Quality - completeness of submitted materials
    5. Fairness Assessment - overall merit of each party's position
    
    This is the heart of ChainJury — the contract IS the judge.
    """
    # Dispute storage: case_id -> JSON dispute state
    # State: { "case_id": str, "plaintiff": str, "defendant": str,
    #          "category": str, "status": str, "plaintiff_evidence": str,
    #          "defendant_evidence": str, "plaintiff_links": [str],
    #          "defendant_links": [str], "verdict": str, "reasoning": str,
    #          "scores": { "plaintiff": int, "defendant": int },
    #          "stage": "filing"|"evidence"|"review"|"verdict" }
    disputes: TreeMap[str, str]
    
    # Dispute counter
    dispute_count: u256
    
    # Total verdicts rendered by AI
    ai_verdicts: u256

    def __init__(self):
        self.dispute_count = u256(0)
        self.ai_verdicts = u256(0)

    @gl.public.write
    def file_dispute(self, case_id: str, plaintiff: str, defendant: str,
                     category: str, description: str, evidence: str,
                     evidence_link: str) -> str:
        """
        File a new dispute with initial evidence from the plaintiff.
        The plaintiff provides their side of the story and supporting evidence.
        """
        dispute = {
            "case_id": case_id,
            "plaintiff": plaintiff,
            "defendant": defendant,
            "category": category,
            "description": description,
            "status": "AWAITING_RESPONSE",
            "plaintiff_evidence": evidence,
            "defendant_evidence": "",
            "plaintiff_links": [evidence_link] if evidence_link else [],
            "defendant_links": [],
            "verdict": "PENDING",
            "reasoning": "",
            "scores": {"plaintiff": 0, "defendant": 0},
            "stage": "evidence"
        }
        
        self.disputes[case_id] = json.dumps(dispute, sort_keys=True)
        self.dispute_count += u256(1)
        return "DISPUTE_FILED"

    @gl.public.write
    def submit_defense(self, case_id: str, defense_evidence: str,
                       evidence_link: str) -> str:
        """
        Defendant submits their defense and counter-evidence.
        Once both sides have submitted, the case moves to AI review.
        """
        dispute_data = self.disputes.get(case_id)
        if dispute_data is None:
            return "DISPUTE_NOT_FOUND"
        
        dispute = json.loads(dispute_data)
        
        if dispute["status"] != "AWAITING_RESPONSE":
            return "INVALID_STAGE"
        
        dispute["defendant_evidence"] = defense_evidence
        if evidence_link:
            dispute["defendant_links"] = [evidence_link]
        dispute["status"] = "UNDER_REVIEW"
        dispute["stage"] = "review"
        
        self.disputes[case_id] = json.dumps(dispute, sort_keys=True)
        return "DEFENSE_SUBMITTED"

    @gl.public.write
    def resolve_dispute(self, case_id: str) -> str:
        """
        Trigger AI-powered dispute resolution. The AI jury evaluates all evidence
        from both parties, optionally checks web sources, and renders a binding verdict.
        
        This is where GenLayer's AI consensus shines — multiple validators independently
        evaluate the same evidence and must reach agreement on the verdict.
        """
        dispute_data = self.disputes.get(case_id)
        if dispute_data is None:
            return "DISPUTE_NOT_FOUND"
        
        dispute = json.loads(dispute_data)
        
        if dispute["status"] != "UNDER_REVIEW":
            return "NOT_READY_FOR_REVIEW"
        
        # Step 1: If evidence links exist, verify them via web scraping
        web_context = ""
        p_links = dispute.get("plaintiff_links", [])
        d_links = dispute.get("defendant_links", [])
        
        if len(p_links) > 0 and p_links[0]:
            def _fetch_plaintiff_evidence() -> str:
                try:
                    response = gl.nondet.web.get(p_links[0])
                    return response.body.decode("utf-8")[:1500]
                except Exception:
                    return "Unable to fetch plaintiff evidence link"
            
            plaintiff_web = gl.eq_principle.strict_eq(_fetch_plaintiff_evidence)
            web_context += f"\n\nPLAINTIFF WEB EVIDENCE:\n{plaintiff_web}"
        
        if len(d_links) > 0 and d_links[0]:
            def _fetch_defendant_evidence() -> str:
                try:
                    response = gl.nondet.web.get(d_links[0])
                    return response.body.decode("utf-8")[:1500]
                except Exception:
                    return "Unable to fetch defendant evidence link"
            
            defendant_web = gl.eq_principle.strict_eq(_fetch_defendant_evidence)
            web_context += f"\n\nDEFENDANT WEB EVIDENCE:\n{defendant_web}"
        
        # Step 2: Construct the comprehensive AI evaluation prompt
        evaluation_prompt = (
            "You are an impartial AI arbitrator for a digital commerce dispute. "
            "You must evaluate all evidence from both parties and render a fair verdict.\n\n"
            "DISPUTE CATEGORY: " + dispute["category"] + "\n\n"
            "DISPUTE DESCRIPTION:\n" + dispute["description"] + "\n\n"
            "PLAINTIFF'S EVIDENCE:\n" + dispute["plaintiff_evidence"] + "\n\n"
            "DEFENDANT'S EVIDENCE:\n" + dispute["defendant_evidence"] + "\n\n"
            + web_context + "\n\n"
            "Evaluate across these 5 criteria:\n"
            "1. Evidence Strength (0-20 points each party)\n"
            "2. Source Credibility (0-20 points each party)\n"
            "3. Claim Consistency (0-20 points each party)\n"
            "4. Documentation Quality (0-20 points each party)\n"
            "5. Fairness Assessment (0-20 points each party)\n\n"
            "You MUST respond in EXACTLY this format (no extra text):\n"
            "VERDICT: PLAINTIFF_WINS or DEFENDANT_WINS or DRAW\n"
            "PLAINTIFF_SCORE: [number 0-100]\n"
            "DEFENDANT_SCORE: [number 0-100]\n"
            "REASONING: [one paragraph explanation of your decision]"
        )
        
        # Step 3: Execute AI evaluation with consensus
        def _evaluate() -> str:
            return gl.nondet.exec_prompt(evaluation_prompt)
        
        result = gl.eq_principle.prompt_comparative(
            _evaluate,
            principle="Both evaluations must reach the same verdict (PLAINTIFF_WINS, DEFENDANT_WINS, or DRAW) for the dispute."
        )
        
        # Step 4: Parse the AI verdict
        result_upper = result.strip().upper()
        
        verdict = "DRAW"
        plaintiff_score = 50
        defendant_score = 50
        reasoning = result.strip()
        
        if "PLAINTIFF_WINS" in result_upper:
            verdict = "PLAINTIFF_WINS"
        elif "DEFENDANT_WINS" in result_upper:
            verdict = "DEFENDANT_WINS"
        
        # Try to extract scores
        for line in result.strip().split("\n"):
            line_upper = line.strip().upper()
            if "PLAINTIFF_SCORE" in line_upper:
                try:
                    score_str = line.split(":")[-1].strip()
                    plaintiff_score = int("".join(c for c in score_str if c.isdigit())[:3])
                    if plaintiff_score > 100:
                        plaintiff_score = 100
                except Exception:
                    plaintiff_score = 50
            elif "DEFENDANT_SCORE" in line_upper:
                try:
                    score_str = line.split(":")[-1].strip()
                    defendant_score = int("".join(c for c in score_str if c.isdigit())[:3])
                    if defendant_score > 100:
                        defendant_score = 100
                except Exception:
                    defendant_score = 50
            elif "REASONING:" in line.upper():
                reasoning = line.split(":", 1)[-1].strip()
        
        # Step 5: Update dispute state with verdict
        dispute["verdict"] = verdict
        dispute["reasoning"] = reasoning
        dispute["scores"] = {
            "plaintiff": plaintiff_score,
            "defendant": defendant_score
        }
        dispute["status"] = "RESOLVED"
        dispute["stage"] = "verdict"
        
        self.disputes[case_id] = json.dumps(dispute, sort_keys=True)
        self.ai_verdicts += u256(1)
        
        return json.dumps({
            "verdict": verdict,
            "plaintiff_score": plaintiff_score,
            "defendant_score": defendant_score,
            "reasoning": reasoning
        }, sort_keys=True)

    @gl.public.view
    def get_dispute(self, case_id: str) -> str:
        """Get full dispute details by case ID."""
        dispute = self.disputes.get(case_id)
        if dispute is None:
            return "NOT_FOUND"
        return dispute

    @gl.public.view
    def get_dispute_status(self, case_id: str) -> str:
        """Get just the status and verdict of a dispute."""
        dispute_data = self.disputes.get(case_id)
        if dispute_data is None:
            return "NOT_FOUND"
        dispute = json.loads(dispute_data)
        summary = {
            "case_id": case_id,
            "status": dispute["status"],
            "verdict": dispute["verdict"],
            "stage": dispute["stage"]
        }
        return json.dumps(summary, sort_keys=True)

    @gl.public.view
    def get_engine_stats(self) -> str:
        """Get dispute engine statistics."""
        stats = {
            "total_disputes": str(self.dispute_count),
            "ai_verdicts_rendered": str(self.ai_verdicts)
        }
        return json.dumps(stats, sort_keys=True)
