from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import Optional, List, Dict, Tuple
from googletrans import Translator
import chromadb
from chromadb.config import Settings
import re
from difflib import SequenceMatcher
from sentence_transformers import SentenceTransformer

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize translation client
translator = Translator()

# Initialize sentence transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize ChromaDB
chroma_client = chromadb.Client(Settings(persist_directory="db"))
collection = chroma_client.get_or_create_collection(name="faqs")

def string_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def extract_keywords(text: str) -> List[str]:
    # Remove special characters and convert to lowercase
    text = re.sub(r'[^\w\s]', '', text.lower())
    words = text.split()
    # Remove common stop words but keep important question words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were'}
    return [w for w in words if w not in stop_words]

def find_best_matches(query: str, faqs: List[Dict], num_matches: int = 3) -> List[Tuple[Dict, float]]:
    query_keywords = set(extract_keywords(query))
    matches = []
    
    # Define category keywords for better matching
    categories = {
        'customer_service': {'customer', 'service', 'support', 'contact', 'help', 'center', 'centres', 'centers', 'available', 'location'},
        'product': {'make', 'product', 'sell', 'offer', 'available', 'buy'},
        'company': {'mission', 'vision', 'philips', 'company', 'business', 'about'},
        'warranty': {'warranty', 'guarantee', 'repair', 'replace', 'service'}
    }
    
    # Determine query category
    query_categories = []
    for category, keywords in categories.items():
        if any(word in query_keywords for word in keywords):
            query_categories.append(category)
    
    for faq in faqs:
        # Calculate different types of matches
        faq_keywords = set(extract_keywords(faq["question"]))
        faq_answer_keywords = set(extract_keywords(faq["answer"]))
        
        # Basic keyword overlap score
        question_score = len(query_keywords.intersection(faq_keywords)) / max(len(query_keywords), len(faq_keywords)) if query_keywords else 0
        
        # Answer content score
        answer_score = len(query_keywords.intersection(faq_answer_keywords)) / len(query_keywords) if query_keywords else 0
        
        # Direct string similarity score
        similarity_score = string_similarity(query, faq["question"])
        
        # Category match score
        category_score = 0.0
        for category in query_categories:
            if any(word in faq["question"].lower() for word in categories[category]):
                category_score += 0.2
            if any(word in faq["answer"].lower() for word in categories[category]):
                category_score += 0.1
        
        # Exact phrase matching score
        phrase_score = 0.0
        query_phrases = [q for q in query.lower().split() if len(q) > 3]
        for phrase in query_phrases:
            if phrase in faq["question"].lower():
                phrase_score += 0.3
            if phrase in faq["answer"].lower():
                phrase_score += 0.2
        
        # Combined score with weights
        total_score = (
            question_score * 0.3 +
            answer_score * 0.2 +
            similarity_score * 0.2 +
            category_score * 0.2 +
            phrase_score * 0.1
        )
        
        matches.append((faq, total_score))
    
    # Sort by score and return top matches
    return sorted(matches, key=lambda x: x[1], reverse=True)[:num_matches]

def generate_combined_answer(matches: List[Tuple[Dict, float]], query: str) -> str:
    if not matches:
        return "I couldn't find a good match for your question. Could you please rephrase it or ask something else?"
    
    # If we have a very good match (score > 0.7), return it directly
    if matches[0][1] > 0.7:
        return matches[0][0]["answer"]
    
    # For multiple relevant matches, combine them intelligently
    relevant_matches = [m for m in matches if m[1] > 0.3]
    if len(relevant_matches) > 1:
        # Check if the answers are very similar
        if string_similarity(relevant_matches[0][0]["answer"], relevant_matches[1][0]["answer"]) > 0.7:
            return relevant_matches[0][0]["answer"]
        
        # Combine multiple relevant answers
        combined = "Based on your question:\n\n"
        for i, (faq, score) in enumerate(relevant_matches, 1):
            if i == 1:
                combined += f"{faq['answer']}\n\n"
            else:
                # Add additional relevant information
                additional_info = faq['answer']
                if string_similarity(additional_info, relevant_matches[0][0]["answer"]) < 0.7:
                    combined += f"Additional information: {additional_info}\n\n"
        return combined.strip()
    
    return matches[0][0]["answer"]

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str
    language: Optional[str] = "en"

class FAQ(BaseModel):
    question: str
    answer: str

class Feedback(BaseModel):
    messageId: str
    isPositive: bool

def get_embedding(text: str) -> List[float]:
    """Get embedding using sentence-transformers."""
    try:
        # Generate embeddings using sentence-transformers
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"Embedding error: {e}")
        # Return a simple hash-based fallback
        return [hash(text) % 1000 / 1000.0] * 384  # MiniLM embeddings are 384-dimensional

def translate_text(text: str, target_lang: str) -> str:
    """Translate text to target language."""
    if target_lang == "en":
        return text
    try:
        # Special handling for Hindi
        if target_lang == "hi":
            translation = translator.translate(text, dest='hi')
            if translation and translation.text:
                return translation.text
            else:
                print(f"Translation failed for text: {text}")
                return text
        # For other languages
        translation = translator.translate(text, dest=target_lang)
        return translation.text if translation else text
    except Exception as e:
        print(f"Translation error: {e}")
        return text  # Return original text if translation fails

# Load initial FAQs if they exist
try:
    with open("faqs.json", "r") as f:
        faqs = json.load(f)
        # Add FAQs to vector store if not already added
        for faq in faqs:
            try:
                embedding = get_embedding(faq["question"])
                collection.add(
                    documents=[faq["question"]],
                    metadatas=[{"answer": faq["answer"]}],
                    embeddings=[embedding],
                    ids=[str(hash(faq["question"]))]
                )
            except Exception as e:
                print(f"Error adding FAQ to vector store: {e}")
except FileNotFoundError:
    faqs = []

@app.post("/ask")
async def ask_question(query: Question):
    try:
        # Try using embeddings first
        try:
            question_embedding = get_embedding(query.question)
            results = collection.query(
                query_embeddings=[question_embedding],
                n_results=1
            )
            if results['documents']:
                answer = results['metadatas'][0][0]['answer']
                if query.language and query.language != "en":
                    answer = translate_text(answer, query.language)
                return {"answer": answer}
        except Exception as e:
            print(f"Vector search failed, falling back to text matching: {e}")
        
        # Enhanced fallback using sophisticated text matching
        matches = find_best_matches(query.question, faqs)
        answer = generate_combined_answer(matches, query.question)
        
        # Translate if needed
        if query.language and query.language != "en":
            answer = translate_text(answer, query.language)
        
        if not answer:
            raise HTTPException(
                status_code=404,
                detail="No matching answer found for your question"
            )
        
        return {"answer": answer}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error processing question: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while processing your question"
        )

@app.post("/admin/add-faq")
async def add_faq(faq: FAQ):
    try:
        # Add to JSON file first
        faqs.append({"question": faq.question, "answer": faq.answer})
        with open("faqs.json", "w") as f:
            json.dump(faqs, f, indent=2)
        
        # Try to add to vector store, but don't fail if it doesn't work
        try:
            embedding = get_embedding(faq.question)
            collection.add(
                documents=[faq.question],
                metadatas=[{"answer": faq.answer}],
                embeddings=[embedding],
                ids=[str(hash(faq.question))]
            )
        except Exception as e:
            print(f"Warning: Could not add FAQ to vector store: {e}")
            # Continue anyway since we've saved to JSON
        
        return {"message": "FAQ added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(feedback: Feedback):
    try:
        # In a real application, you would store this in a database
        # For now, we'll just print it
        print(f"Feedback received: Message ID: {feedback.messageId}, Positive: {feedback.isPositive}")
        return {"message": "Feedback recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000) 