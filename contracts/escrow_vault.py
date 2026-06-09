# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class EscrowVault(gl.Contract):
    """
    ChainJury Escrow Vault: Trustless Milestone-Based Escrow Management.
    
    This contract manages the financial side of disputes:
    - Creating escrow agreements between buyers and sellers
    - Milestone-based payment tracking
    - Fund locking during active disputes
    - Automatic release/refund based on dispute verdicts
    - AI-powered milestone verification
    
    The escrow is designed to work hand-in-hand with the DisputeEngine:
    when a verdict is rendered, funds are automatically directed to the
    rightful party based on the AI jury's decision.
    """
    # Escrow records: escrow_id -> JSON escrow state
    # State: { "escrow_id": str, "buyer": str, "seller": str,
    #          "total_amount": str, "status": str, 
    #          "milestones": [{"name": str, "amount": str, "status": str}],
    #          "dispute_case_id": str, "created_at": str }
    escrows: TreeMap[str, str]
    
    # Escrow counter
    escrow_count: u256
    
    # Total value locked (tracked as string for display)
    total_locked: u256
    total_released: u256
    total_refunded: u256

    def __init__(self):
        self.escrow_count = u256(0)
        self.total_locked = u256(0)
        self.total_released = u256(0)
        self.total_refunded = u256(0)

    @gl.public.write
    def create_escrow(self, buyer: str, seller: str, total_amount: str,
                      milestones_json: str) -> str:
        """
        Create a new escrow agreement with milestone-based payments.
        milestones_json should be a JSON array of milestone objects.
        """
        self.escrow_count += u256(1)
        escrow_id = "ESC-" + str(self.escrow_count)
        
        # Parse milestones
        try:
            milestones = json.loads(milestones_json)
        except Exception:
            milestones = [{"name": "Full Delivery", "amount": total_amount, "status": "PENDING"}]
        
        # Ensure each milestone has proper structure
        formatted_milestones = []
        for m in milestones:
            formatted_milestones.append({
                "amount": str(m.get("amount", "0")),
                "name": str(m.get("name", "Milestone")),
                "status": "PENDING"
            })
        
        escrow = {
            "buyer": buyer,
            "created_at": "on-chain",
            "dispute_case_id": "",
            "escrow_id": escrow_id,
            "milestones": formatted_milestones,
            "seller": seller,
            "status": "ACTIVE",
            "total_amount": total_amount
        }
        
        self.escrows[escrow_id] = json.dumps(escrow, sort_keys=True)
        
        try:
            self.total_locked += u256(int(total_amount))
        except Exception:
            pass
        
        return escrow_id

    @gl.public.write
    def release_milestone(self, escrow_id: str, milestone_index: str) -> str:
        """Release a specific milestone payment to the seller."""
        escrow_data = self.escrows.get(escrow_id)
        if escrow_data is None:
            return "ESCROW_NOT_FOUND"
        
        escrow = json.loads(escrow_data)
        
        if escrow["status"] == "DISPUTED":
            return "ESCROW_UNDER_DISPUTE"
        
        idx = int(milestone_index)
        milestones = escrow["milestones"]
        
        if idx < 0 or idx >= len(milestones):
            return "INVALID_MILESTONE"
        
        if milestones[idx]["status"] != "PENDING":
            return "MILESTONE_ALREADY_PROCESSED"
        
        milestones[idx]["status"] = "RELEASED"
        escrow["milestones"] = milestones
        
        # Check if all milestones are released
        all_released = all(m["status"] == "RELEASED" for m in milestones)
        if all_released:
            escrow["status"] = "COMPLETED"
        
        self.escrows[escrow_id] = json.dumps(escrow, sort_keys=True)
        
        try:
            self.total_released += u256(int(milestones[idx]["amount"]))
        except Exception:
            pass
        
        return "MILESTONE_RELEASED"

    @gl.public.write
    def lock_for_dispute(self, escrow_id: str, case_id: str) -> str:
        """Lock an escrow when a dispute is filed."""
        escrow_data = self.escrows.get(escrow_id)
        if escrow_data is None:
            return "ESCROW_NOT_FOUND"
        
        escrow = json.loads(escrow_data)
        escrow["status"] = "DISPUTED"
        escrow["dispute_case_id"] = case_id
        
        self.escrows[escrow_id] = json.dumps(escrow, sort_keys=True)
        return "LOCKED_FOR_DISPUTE"

    @gl.public.write
    def execute_verdict(self, escrow_id: str, verdict: str) -> str:
        """
        Execute a dispute verdict on the escrow.
        PLAINTIFF_WINS (buyer) -> Full refund
        DEFENDANT_WINS (seller) -> Full release
        DRAW -> 50/50 split
        """
        escrow_data = self.escrows.get(escrow_id)
        if escrow_data is None:
            return "ESCROW_NOT_FOUND"
        
        escrow = json.loads(escrow_data)
        
        if escrow["status"] != "DISPUTED":
            return "NOT_IN_DISPUTE"
        
        verdict_upper = verdict.strip().upper()
        
        if "PLAINTIFF" in verdict_upper:
            # Buyer wins - refund all pending milestones
            for m in escrow["milestones"]:
                if m["status"] == "PENDING":
                    m["status"] = "REFUNDED"
                    try:
                        self.total_refunded += u256(int(m["amount"]))
                    except Exception:
                        pass
            escrow["status"] = "REFUNDED"
        elif "DEFENDANT" in verdict_upper:
            # Seller wins - release all pending milestones
            for m in escrow["milestones"]:
                if m["status"] == "PENDING":
                    m["status"] = "RELEASED"
                    try:
                        self.total_released += u256(int(m["amount"]))
                    except Exception:
                        pass
            escrow["status"] = "COMPLETED"
        else:
            # Draw - mark as split
            for m in escrow["milestones"]:
                if m["status"] == "PENDING":
                    m["status"] = "SPLIT"
            escrow["status"] = "SPLIT_RESOLVED"
        
        self.escrows[escrow_id] = json.dumps(escrow, sort_keys=True)
        return "VERDICT_EXECUTED"

    @gl.public.write
    def verify_delivery(self, escrow_id: str, delivery_url: str, 
                        requirements: str) -> str:
        """
        AI-powered delivery verification. Checks if a deliverable matches
        the agreed-upon requirements by fetching and analyzing the delivery URL.
        Uses GenLayer's equivalence principle for consensus-based verification.
        """
        escrow_data = self.escrows.get(escrow_id)
        if escrow_data is None:
            return "ESCROW_NOT_FOUND"
        
        # Fetch the deliverable content
        def _fetch_delivery() -> str:
            try:
                response = gl.nondet.web.get(delivery_url)
                return response.body.decode("utf-8")[:2000]
            except Exception:
                return "Unable to fetch delivery URL"
        
        delivery_content = gl.eq_principle.strict_eq(_fetch_delivery)
        
        # AI verification prompt
        verification_prompt = (
            "You are verifying whether a delivery meets the agreed requirements.\n\n"
            "REQUIREMENTS:\n" + requirements + "\n\n"
            "DELIVERED CONTENT/EVIDENCE:\n" + delivery_content + "\n\n"
            "Does the delivery meet the requirements? "
            "Output EXACTLY one of: VERIFIED, PARTIAL, or REJECTED\n"
            "Then on a new line: REASON: [brief explanation]"
        )
        
        def _verify() -> str:
            return gl.nondet.exec_prompt(verification_prompt)
        
        result = gl.eq_principle.prompt_comparative(
            _verify,
            principle="Both verifications must reach the same conclusion: VERIFIED, PARTIAL, or REJECTED."
        )
        
        clean = result.strip().upper()
        if "VERIFIED" in clean and "REJECTED" not in clean:
            status = "VERIFIED"
        elif "PARTIAL" in clean:
            status = "PARTIAL"
        else:
            status = "REJECTED"
        
        return json.dumps({
            "escrow_id": escrow_id,
            "delivery_status": status,
            "details": result.strip()
        }, sort_keys=True)

    @gl.public.view
    def get_escrow(self, escrow_id: str) -> str:
        """Get full escrow details."""
        escrow = self.escrows.get(escrow_id)
        if escrow is None:
            return "NOT_FOUND"
        return escrow

    @gl.public.view
    def get_vault_stats(self) -> str:
        """Get escrow vault statistics."""
        stats = {
            "total_escrows": str(self.escrow_count),
            "total_locked": str(self.total_locked),
            "total_refunded": str(self.total_refunded),
            "total_released": str(self.total_released)
        }
        return json.dumps(stats, sort_keys=True)
