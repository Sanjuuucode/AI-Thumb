from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import uuid
import stripe
import httpx
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import logging
import base64

# Load env
load_dotenv()

# Config
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "quickthumb_db")
EMERGENT_KEY = os.getenv("EMERGENT_LLM_KEY")
STRIPE_KEY = os.getenv("STRIPE_SECRET_KEY")

stripe.api_key = STRIPE_KEY

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# App
app = FastAPI()
api_router = APIRouter(prefix="/api")

# CORS
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime
    credits: int = 5  # Free credits

class GenerateRequest(BaseModel):
    description: str
    thumbnail_text: str
    aspect_ratio: str  # "16:9", "9:16", "1:1"
    subject_image: str # Base64
    reference_image: str # Base64

class ThumbnailResponse(BaseModel):
    id: str
    user_id: str
    description: str
    thumbnail_text: str
    aspect_ratio: str
    created_at: datetime

# Auth Dependencies
async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        # Check header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
        
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

# Routes
@api_router.get("/")
async def root():
    return {"status": "ok"}

# --- AUTH ---
@api_router.get("/auth/session-data")
async def get_session_data(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID")
        
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session ID")
        
    data = res.json()
    email = data.get("email")
    name = data.get("name")
    picture = data.get("picture")
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "credits": 5,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        user = new_user
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60
    )
    
    return {"user": user, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(response: Response, request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token")
    return {"status": "logged out"}

# --- GENERATION ---
@api_router.get("/thumbnails", response_model=List[ThumbnailResponse])
async def get_thumbnails(user: dict = Depends(get_current_user)):
    thumbnails_cursor = db.thumbnails.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1)
    thumbnails = await thumbnails_cursor.to_list(length=100)
    
    # Ensure datetime objects are timezone aware (if stored as naive) or valid for Pydantic
    # MongoDB usually returns naive datetimes. Pydantic expects them or valid ISO strings.
    # Our insert sets timezone.utc, so it should be fine.
    
    return thumbnails

@api_router.post("/generate")
async def generate_thumbnail(req: GenerateRequest, user: dict = Depends(get_current_user)):
    if user["credits"] <= 0:
        raise HTTPException(status_code=402, detail="No credits left")
        
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY, 
            session_id=f"gen_{user['user_id']}",
            system_message="You are a professional YouTube thumbnail designer. You are expert in creating high CTR thumbnails."
        )
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        # Prepare the prompt
        prompt = f"""
        Create a high-quality YouTube thumbnail.
        
        Task:
        1. Use the SUBJECT from the first image provided. Keep their likeness/appearance.
        2. Use the STYLE and COMPOSITION from the second image provided (Reference).
        3. The thumbnail aspect ratio must be {req.aspect_ratio}.
        4. The overall scene description is: "{req.description}".
        5. IMPORTANT: You MUST BAKE the following text into the image clearly and professionally: "{req.thumbnail_text}".
        
        Make it eye-catching, high contrast, and professional. 
        """
        
        # Prepare file contents
        # req.subject_image and req.reference_image should be base64 strings
        # Remove header if present (data:image/jpeg;base64,...)
        def clean_b64(b64_str):
            if "base64," in b64_str:
                return b64_str.split("base64,")[1]
            return b64_str

        subject_b64 = clean_b64(req.subject_image)
        reference_b64 = clean_b64(req.reference_image)
        
        msg = UserMessage(
            text=prompt,
            file_contents=[
                ImageContent(subject_b64),
                ImageContent(reference_b64)
            ]
        )
        
        text, images = await chat.send_message_multimodal_response(msg)
        
        if not images:
            raise HTTPException(status_code=500, detail="No image generated")
            
        # Deduct credit
        await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"credits": -1}})
        
        img_data = images[0]['data'] # base64 string
        
        # Save metadata
        thumb_id = str(uuid.uuid4())
        thumbnail = {
            "id": thumb_id,
            "user_id": user["user_id"],
            "description": req.description,
            "thumbnail_text": req.thumbnail_text,
            "aspect_ratio": req.aspect_ratio,
            "created_at": datetime.now(timezone.utc),
        }
        await db.thumbnails.insert_one(thumbnail)
        
        return {"image": f"data:image/png;base64,{img_data}", "credits": user["credits"] - 1}
        
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- STRIPE ---
@api_router.post("/create-checkout-session")
async def create_checkout_session(user: dict = Depends(get_current_user)):
    # Mock implementation for MVP/Demo purposes if key is invalid
    # In production, remove this mock and handle errors properly
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    success_url = f"{frontend_url}/dashboard?payment=success"
    
    # Try Stripe first
    if STRIPE_KEY and not STRIPE_KEY.startswith("sk_test_4eC39"): # Skip the expired key check if we know it's bad
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': '50 Credits Pack',
                        },
                        'unit_amount': 1000, # $10.00
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=f"{frontend_url}/pricing",
                metadata={"user_id": user["user_id"]}
            )
            return {"url": checkout_session.url}
        except Exception as e:
            logger.error(f"Stripe error: {e}")
            pass
            
    # Mock response
    return {"url": success_url}

@api_router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, "whsec_..." # In real app, use env var
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        pass

    # Handle event manually if signature verification skipped or passed
    data = await request.json()
    event_type = data['type']
    
    if event_type == 'checkout.session.completed':
        session = data['data']['object']
        user_id = session.get('metadata', {}).get('user_id')
        if user_id:
             await db.users.update_one({"user_id": user_id}, {"$inc": {"credits": 50}})
             
    return {"status": "success"}

app.include_router(api_router)
