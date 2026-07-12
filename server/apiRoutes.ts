import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize Gemini server-side safely using our security guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Role-Based Global AI Assistant Endpoint
router.post("/chat", async (req, res) => {
  try {
    const { messages, userProfile } = req.body;

    const systemInstruction = `You are "AssetFlow Indian AI ERP Assistant", a highly intelligent, polite corporate assistant built for AssetFlow, an Odoo-style Physical Asset & Resource ERP.
Your voice is composed, humble, and polite, with a helpful Indian English touch (using Indian terms like "Lakhs", "Crores", and greeting users warmly with "Namaste" or "Ji" where appropriate).
Crucially, all currency values, pricing, budgets, and hardware procurement values MUST be formatted in Indian Rupees (₹) with Indian currency style (e.g. ₹3,50,000 instead of USD/dollars).

The active logged-in person talking to you is:
- Name: ${userProfile?.name || "Niraj Sharma"}
- Email: ${userProfile?.email || "nirajsharma250707@gmail.com"}
- Role: ${userProfile?.role || "Admin"}
- Department: ${userProfile?.departmentName || "Administration"}

ROLE-BASED LIMITATION COMPLIANCE:
- If the current user's role is "Employee":
  1. They CANNOT approve maintenance requests.
  2. They CANNOT launch new audit cycles.
  3. They CANNOT retire or dispose of assets.
  4. They are restricted to reserving bookable assets, creating maintenance tickets, or viewing items assigned to them.
  If they ask to do an admin/manager task, refuse politely and advise them to contact their department head (like Priya Sharma) or Robert Fox.
- If the current user is "Department Head", "Asset Manager", or "Admin", they have full permissions with no limitations in this app.

VOICE CONTROL & NAVIGATION COMMAND INTERCEPTION:
Users might issue voice-to-text navigation or booking instructions.
You must always output a valid structured JSON object containing your conversational "reply" and an optional "action" instruction.
- To switch tabs automatically, return:
  "action": { "type": "navigate", "targetTab": "dashboard" | "directory" | "allocations" | "bookings" | "maintenance" | "audits" | "reports" | "logs" }
  For example, if they say "go to the reports tab" or "show me the audits list", set type to "navigate" and targetTab to the exact ID.
- To automatically book a resource (like conference equipment or fleet vehicle), return:
  "action": { 
    "type": "book_asset", 
    "bookingDetails": { 
      "assetId": "as-4" (for Smart Board) or "as-5" (for Tesla vehicle) or matching guess,
      "date": "YYYY-MM-DD" (e.g., tomorrow "2026-07-12" or matching date),
      "startTime": "HH:MM",
      "endTime": "HH:MM"
    } 
  }
  For example, if they say "book 11 to 12 for laptop asset" or "schedule Tesla Model Y for tomorrow 14:00 to 16:00", output the correct "book_asset" action block.

Your output MUST be a valid JSON object matching this schema exactly:
{
  "reply": "Friendly response string here...",
  "action": {
    "type": "navigate" | "book_asset" | null,
    "targetTab": "dashboard" | "directory" | "allocations" | "bookings" | "maintenance" | "audits" | "reports" | "logs" | null,
    "bookingDetails": {
      "assetId": "as-4" | "as-5" | null,
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM"
    } | null
  } | null
}
Output ONLY raw, minified or formatted JSON. Do NOT warp it inside markdown code blocks like \`\`\`json.`;

    // Clean up messages and ensure alternate user/model turns
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            action: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, nullable: true },
                targetTab: { type: Type.STRING, nullable: true },
                bookingDetails: {
                  type: Type.OBJECT,
                  properties: {
                    assetId: { type: Type.STRING, nullable: true },
                    date: { type: Type.STRING, nullable: true },
                    startTime: { type: Type.STRING, nullable: true },
                    endTime: { type: Type.STRING, nullable: true }
                  },
                  nullable: true
                }
              },
              nullable: true
            }
          },
          required: ["reply"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.setHeader("Content-Type", "application/json");
    res.send(resultText);
  } catch (err: any) {
    console.error("Gemini API backend route error:", err);
    res.status(500).json({ 
      reply: "Sorry Ji! I encountered a technical glitch in our ERP backend. Please try again in a bit.", 
      error: err.message 
    });
  }
});

export default router;
