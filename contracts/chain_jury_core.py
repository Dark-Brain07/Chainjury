# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class ChainJuryCore(gl.Contract):
    """
    ChainJury Core: Decentralized AI-Powered Dispute Resolution Registry & Reputation System.
    
    This is the central registry for the ChainJury platform. It manages:
    - User profiles (wallet-tied) with reputation scores
    - Global case registry and indexing
    - Trust scoring based on dispute outcomes
    - Platform-wide statistics and leaderboard
    
    The contract serves as the source of truth for identity and reputation,
    while dispute logic and escrow are handled by companion contracts.
    """
    # Global counters
    total_users: u256
    total_cases_registered: u256
    total_verdicts_rendered: u256
    
    # User profiles: wallet_address -> JSON profile string
    # Profile: { "username": str, "registered_at": str, "cases_filed": int, 
    #            "cases_won": int, "cases_lost": int, "trust_score": int,
    #            "role": "buyer"|"seller"|"both", "bio": str }
    profiles: TreeMap[str, str]
    
    # Case index: case_id -> JSON case summary string
    # Summary: { "case_id": str, "plaintiff": str, "defendant": str,
    #            "category": str, "status": str, "filed_at": str,
    #            "amount_disputed": str, "verdict": str }
    case_index: TreeMap[str, str]
    
    # Case counter for generating unique IDs
    case_counter: u256
    
    # Platform categories
    categories: str

    def __init__(self):
        self.total_users = u256(0)
        self.total_cases_registered = u256(0)
        self.total_verdicts_rendered = u256(0)
        self.case_counter = u256(0)
        self.categories = json.dumps([
            "Product Not As Described",
            "Service Not Delivered",
            "Quality Dispute",
            "Freelance Work Dispute",
            "Digital Goods Dispute",
            "Refund Request",
            "Warranty Claim",
            "Contract Breach"
        ], sort_keys=True)

    @gl.public.write
    def register_user(self, username: str, role: str, bio: str) -> str:
        """Register a new user profile tied to the caller's wallet address."""
        caller = str(gl.message.sender_account)
        
        # Check if already registered
        existing = self.profiles.get(caller)
        if existing is not None:
            return "ALREADY_REGISTERED"
        
        profile = {
            "username": username,
            "registered_at": "on-chain",
            "cases_filed": 0,
            "cases_won": 0,
            "cases_lost": 0,
            "trust_score": 100,
            "role": role,
            "bio": bio,
            "wallet": caller
        }
        
        self.profiles[caller] = json.dumps(profile, sort_keys=True)
        self.total_users += u256(1)
        return "REGISTERED"

    @gl.public.write
    def register_case(self, plaintiff: str, defendant: str, category: str, 
                      amount_disputed: str, description: str) -> str:
        """Register a new dispute case in the global index. Returns the case ID."""
        self.case_counter += u256(1)
        case_id = "CJ-" + str(self.case_counter)
        
        case_summary = {
            "case_id": case_id,
            "plaintiff": plaintiff,
            "defendant": defendant,
            "category": category,
            "status": "OPEN",
            "filed_at": "on-chain",
            "amount_disputed": amount_disputed,
            "description": description,
            "verdict": "PENDING"
        }
        
        self.case_index[case_id] = json.dumps(case_summary, sort_keys=True)
        self.total_cases_registered += u256(1)
        
        # Update plaintiff's profile
        p_profile = self.profiles.get(plaintiff)
        if p_profile is not None:
            p_data = json.loads(p_profile)
            p_data["cases_filed"] = p_data.get("cases_filed", 0) + 1
            self.profiles[plaintiff] = json.dumps(p_data, sort_keys=True)
        
        return case_id

    @gl.public.write
    def record_verdict(self, case_id: str, verdict: str, winner: str, loser: str) -> str:
        """Record a verdict and update reputation scores."""
        case_data = self.case_index.get(case_id)
        if case_data is None:
            return "CASE_NOT_FOUND"
        
        case = json.loads(case_data)
        case["status"] = "RESOLVED"
        case["verdict"] = verdict
        self.case_index[case_id] = json.dumps(case, sort_keys=True)
        
        self.total_verdicts_rendered += u256(1)
        
        # Update winner reputation
        w_profile = self.profiles.get(winner)
        if w_profile is not None:
            w_data = json.loads(w_profile)
            w_data["cases_won"] = w_data.get("cases_won", 0) + 1
            w_data["trust_score"] = min(w_data.get("trust_score", 100) + 10, 1000)
            self.profiles[winner] = json.dumps(w_data, sort_keys=True)
        
        # Update loser reputation
        l_profile = self.profiles.get(loser)
        if l_profile is not None:
            l_data = json.loads(l_profile)
            l_data["cases_lost"] = l_data.get("cases_lost", 0) + 1
            l_data["trust_score"] = max(l_data.get("trust_score", 100) - 15, 0)
            self.profiles[loser] = json.dumps(l_data, sort_keys=True)
        
        return "VERDICT_RECORDED"

    @gl.public.view
    def get_profile(self, wallet: str) -> str:
        """Get a user's profile by wallet address."""
        profile = self.profiles.get(wallet)
        if profile is None:
            return "NOT_FOUND"
        return profile

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        """Get a case summary by ID."""
        case = self.case_index.get(case_id)
        if case is None:
            return "NOT_FOUND"
        return case

    @gl.public.view
    def get_platform_stats(self) -> str:
        """Get overall platform statistics."""
        stats = {
            "total_users": str(self.total_users),
            "total_cases": str(self.total_cases_registered),
            "total_verdicts": str(self.total_verdicts_rendered)
        }
        return json.dumps(stats, sort_keys=True)

    @gl.public.view
    def get_categories(self) -> str:
        """Get available dispute categories."""
        return self.categories
