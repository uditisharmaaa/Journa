from flask import Flask, request, jsonify
from flask_cors import CORS
import cohere
import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
from supabase import create_client, Client


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)




app = Flask(__name__)
CORS(app)


# Setup API clients
co = cohere.Client('VBUQ2wy9yi3ewwT4hWYimRd1LRwx4aFG7XUJNFw9')  # Your Cohere API key
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# ------------------- Cohere Analyze Route -------------------
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    entry = data.get('entry', '')

    if not entry:
        return jsonify({'error': 'No journal entry provided.'}), 400

    sentences = [s.strip() for s in entry.split('.') if s.strip()]

    try:
        response = co.classify(
            model='5d634318-a112-48f9-b899-3cf5ef2140db-ft',
            inputs=sentences,
        )

        results = []
        for classification in response.classifications:
            results.append({
                'sentence': classification.input,
                'predicted_distortion': classification.prediction,
                'confidence': classification.confidence,
            })

        return jsonify({'results': results})

    except Exception as e:
        print('❌ Cohere classification error:', e)
        return jsonify({'error': 'Cohere classification failed.'}), 500

# ------------------- Gemini Reframe Route -------------------
@app.route('/generate_reframes', methods=['POST'])
def generate_reframes():
    data = request.json
    entry = data.get('entry', '')
    distortion_map = data.get('distortion_map', {})

    if not entry or not distortion_map:
        return jsonify({'error': 'Missing entry or distortion map.'}), 400

    try:
        # Gemini Prompt
        prompt = f"""
        You are a compassionate and practical CBT therapist AI.

        Your goal is to help the user reframe their negative thoughts based on their specific journal entry and the cognitive distortions identified by an ML model.

        ---

        ✅ USER'S JOURNAL ENTRY:

        \"\"\"{entry}\"\"\"

        ---

        ✅ DETECTED DISTORTIONS AND TRIGGER SENTENCES:

        {json.dumps(distortion_map, indent=2)}

        ---

        ✅ TASK:

        For each distortion, do the following:

        1. **Reframe:** Write a short (1-2 sentence) personalized cognitive reframe.  
        Make it **directly relevant to the user's actual journal text and emotions**.  
        Avoid generic or robotic advice.  
        Be warm, supportive, and emotionally attuned.

        2. **Reflection Prompt:** Give **1 CBT-style thought-challenging question** that the user can ask themselves to help reframe their thinking.

        ✅ STYLE REQUIREMENTS:
        - ✅ NO "Let's..." phrases
        - ✅ NO therapist-speak like "clients often feel..."
        - ✅ NO disclaimers, preambles, or definitions of distortions
        - ✅ NO unnecessary conversational tone (no "I'm here to help you..." etc)
        - ✅ Output ONLY valid JSON with this exact format:

        {{
        "Distortion Type 1": {{
            "reframe": "Personalized reframe for this distortion...",
            "question": "Thought-challenging question..."
        }},
        "Distortion Type 2": {{
            "reframe": "Personalized reframe...",
            "question": "Thought-challenging question..."
        }}
        }}

        Do not add explanations, preambles, or comments outside the JSON.

        ---

        ✅ REMINDER: The reframes should sound like something a CBT therapist would actually write in a worksheet, customized for this specific journal entry.
        """
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)

        gemini_text = response.text
        print("\n✅ Gemini raw output:\n", gemini_text)

        # ✅ Clean output if Gemini wraps in ```json ```
        if gemini_text.startswith("```"):
            gemini_text = gemini_text.replace("```json", "").replace("```", "").strip()

        try:
            reframes_json = json.loads(gemini_text)
        except json.JSONDecodeError as parse_error:
            print('❌ Gemini JSON parse error:', parse_error)
            return jsonify({'error': 'Invalid JSON from Gemini', 'gemini_output': gemini_text}), 500

        return jsonify(reframes_json)

    except Exception as e:
        print('❌ Gemini generation error:', e)
        return jsonify({'error': 'Gemini generation failed.'}), 500
    


# ------------------- Supabase -------------------



# ✅ Supabase connection (add these with your actual keys)
@app.route('/save_entry', methods=['POST'])
def save_entry():
    data = request.json

    user_id = data.get('user_id')
    entry_text = data.get('entry_text')
    detected_distortions = data.get('detected_distortions', [])
    ai_reframes = data.get('ai_reframes', {})
    user_reflections = data.get('user_reflections', {})

    if not user_id or not entry_text:
        return jsonify({'error': 'Missing user_id or entry_text'}), 400

    try:
        # Insert entry into Supabase
        response = supabase.table('journal_logs').insert({
            'user_id': user_id,
            'entry_text': entry_text,
            'detected_distortions': detected_distortions,
            'ai_reframes': ai_reframes,
            'user_reflections': user_reflections
        }).execute()

        print('✅ Saved journal entry:', response)
        return jsonify({'status': 'success'})

    except Exception as e:
        print('❌ Error during save_entry:', e)
        return jsonify({'error': 'Saving failed.'}), 500




# ------------------- Run Server -------------------
if __name__ == '__main__':
    app.run(port=5003, debug=True)
