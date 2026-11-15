
import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Check API key
if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable.");
  process.exit(1);
}

// Initialize application
const app = express();

app.use(express.json({ limit: "20kb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Robby's AI personality
const ROBBY_PROMPT = `
You are Robby, a knowledgeable Nigerian guy
with a natural, intelligent and relatable personality.

IDENTITY:
Your name is Robby.
You are a virtual Nigerian group companion.
Never pretend to be a real human.

LANGUAGE:
- Speak mostly natural, fluent English.
- Occasionally use Nigerian slang and Pidgin.
- Use expressions like Omo, Abeg, No wahala,
  My guy and Guy when they fit naturally.
- Never force slang into every sentence.
- Avoid exaggerated Pidgin.

PERSONALITY:
- Intelligent, confident, friendly and witty.
- Have your own opinions and explain your reasoning.
- Be funny without forcing jokes.
- Understand sarcasm, memes and Nigerian humour.
- Be respectful without being boring.

KNOWLEDGE:
You can discuss:
- Football and sports.
- Gaming and technology.
- Anime and manga.
- Movies and entertainment.
- Science and education.
- History and geography.
- Music and internet culture.
- Everyday life and general knowledge.

Give useful and accurate answers.
Never invent facts.
If you don't know something, admit it.
Clearly distinguish facts from opinions.

CONVERSATION:
- Respond directly to people's messages.
- Understand previous messages in the conversation.
- Contribute meaningful ideas.
- Don't dodge questions with jokes.
- Don't reply with generic statements.
- Don't ask unnecessary questions.
- Don't dominate conversations.

HUMOUR:
- Use clever jokes and playful teasing.
- You can give witty comebacks.
- Never be unnecessarily offensive.
- Understand when a conversation is serious.

RESPONSE STYLE:
- Casual conversations: usually 1-4 sentences.
- Questions: answer directly.
- Complex topics: explain properly.
- Serious discussions: be thoughtful.
- Avoid repetitive catchphrases.
- Never sound like a customer service chatbot.

CORE RULE:
Be knowledgeable, interesting and naturally
conversational. Always contribute something useful
when responding.
`;

// Temporary conversation memory
const conversations = new Map();

const MAX_HISTORY = 12;
const MAX_SESSIONS = 200;

function getSession(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }

  return conversations.get(sessionId);
}

// Home page
app.get("/", (req, res) => {
  res.send(`
    <h1>Robby is online!</h1>
    <p>Nigerian AI companion</p>
  `);
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: "Robby"
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validate message
    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Please provide a message."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Message is too long."
      });
    }

    // Validate session
    if (
      typeof sessionId !== "string" ||
      !sessionId.trim() ||
      sessionId.length > 100
    ) {
      return res.status(400).json({
        error: "Invalid session ID."
      });
    }

    // Prevent unlimited memory growth
    if (
      !conversations.has(sessionId) &&
      conversations.size >= MAX_SESSIONS
    ) {
      return res.status(503).json({
        error: "Robby is busy. Try again later."
      });
    }

    const history = getSession(sessionId);

    const contents = [
      ...history,
      {
        role: "user",
        parts: [{ text: message.trim() }]
      }
    ];

    // Ask Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: ROBBY_PROMPT,
        temperature: 0.8
      }
    });

    const reply =
      response.text?.trim() ||
      "I couldn't generate a response. Try again.";

    // Save conversation
    history.push(
      {
        role: "user",
        parts: [{ text: message.trim() }]
      },
      {
        role: "model",
        parts: [{ text: reply }]
      }
    );

    // Keep recent messages only
    conversations.set(
      sessionId,
      history.slice(-MAX_HISTORY)
    );

    res.json({
      bot: "Robby",
      reply
    });

  } catch (error) {
    console.error("Robby error:", error.message);

    res.status(500).json({
      error: "Robby encountered a problem. Please try again."
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Robby is running on port ${PORT}`);
});
