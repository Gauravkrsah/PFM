from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import os
from supabase import create_client, Client

router = APIRouter()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

class ExpensesRequest(BaseModel):
    user_id: str
    group_id: Optional[int] = None

@router.post("/expenses")
async def get_expenses_with_users(request: ExpensesRequest):
    """Get expenses with user names from backend"""
    try:
        if not supabase:
            return {"error": "Database not configured"}
        
        # Build query
        query = supabase.from('expenses').select('*')
        
        if request.group_id:
            query = query.eq('group_id', request.group_id)
        else:
            query = query.eq('user_id', request.user_id).is_('group_id', None)
        
        # Get expenses
        expenses_result = query.order('date', desc=True).execute()
        expenses = expenses_result.data or []
        
        if not expenses:
            return {"expenses": []}
        
        # Get unique user IDs
        user_ids = list(set([exp['user_id'] for exp in expenses if exp.get('user_id')]))
        
        if not user_ids:
            return {"expenses": expenses}
        
        # Fetch user profiles
        profiles_result = supabase.from('profiles').select('id, full_name, email').in_('id', user_ids).execute()
        profiles = {p['id']: p for p in (profiles_result.data or [])}
        
        # Add user names to expenses
        for expense in expenses:
            user_id = expense.get('user_id')
            if user_id and user_id in profiles:
                profile = profiles[user_id]
                expense['user_name'] = profile.get('full_name') or profile.get('email', '').split('@')[0] or 'Unknown'
            else:
                expense['user_name'] = expense.get('added_by') or 'Unknown'
            
            # Ensure added_by is also set for consistency
            if not expense.get('added_by'):
                expense['added_by'] = expense['user_name']
        
        return {"expenses": expenses}
        
    except Exception as e:
        return {"error": str(e)}