from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client, Client

router = APIRouter()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

class GetExpensesRequest(BaseModel):
    user_id: str
    group_id: Optional[int] = None

@router.post("/get-expenses")
def get_expenses_with_names(request: GetExpensesRequest):
    try:
        if not supabase:
            return {"error": "Database not configured"}
        
        # Get expenses
        query = supabase.from('expenses').select('*')
        
        if request.group_id:
            query = query.eq('group_id', request.group_id)
        else:
            query = query.eq('user_id', request.user_id).is_('group_id', None)
        
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
                expense['added_by_name'] = profile.get('full_name') or profile.get('email', '').split('@')[0] or 'Unknown User'
            else:
                expense['added_by_name'] = expense.get('added_by') or 'Unknown User'
        
        return {"expenses": expenses}
        
    except Exception as e:
        return {"error": str(e)}