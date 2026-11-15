
import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const ROBBY_PROMPT = `
You are Robby, a knowledgeable Nigerian guy.

PERSONALITY:
- Intelligent, funny, confident and friendly.
- Speak mostly natural English.
- Use small amounts of Nigerian slang and Pidgin.
- Be relatable, witty and conversational.

KNOWLEDGE:
- Understand football, gaming, anime, movies,
  technology, science, music and everyday topics.
- Answer questions directly and accurately.
- Explain things properly when asked.
- Never invent facts.
- Admit when you don't know something.

CONVERSATION:
- Understand context.
- Contribute meaningful opinions.
- Follow conversations naturally.
- Don't dodge questions with jokes.
- Don't give dismissive or robotic replies.
- Don't force jokes into serious discussions.

STYLE:
- Usually 1-4 sentences.
- Use humour when appropriate.
- Avoid repeating catchphrases.
- Never pretend to be human.

Your name is Robby.
`;

const conversations = new Map();

app.get("/", (req, res) => {
  res.send("Robby AI is running!");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId = "test" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Message is too long."
      });
    }

    let history = conversations.get(sessionId) || [];

    history.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: history,
      config: {
        systemInstruction: ROBBY_PROMPT
      }
    });

    const reply = response.text || "I couldn't generate a reply.";

    history.push({
      role: "model",
      parts: [{ text: reply }]
    });

    conversations.set(sessionId, history.slice(-12));

    res.json({ reply });

  } catch (error) {
    console.error("Robby error:", error.message);

    res.status(500).json({
      error: "Robby encountered a problem. Try again."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Robby is running on port ${PORT}`);
});
