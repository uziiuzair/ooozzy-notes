import { model } from "@/lib/firebase/gemini-ai";
import { Label, LabelInput } from "@/types/label";
import { aiDebugger } from "@/lib/ai/aiDebugger";

// Color palette for new labels (playful, matches design system)
const LABEL_COLORS = [
  "#7240fe", // electric-violet
  "#b17ce8", // heliotrope
  "#e868b1", // french-rose
  "#d3b5ff", // lavender
  "#ff6b9d", // violet-red
  "#ffa3c7", // nadeshiko-pink
  "#ffcce5", // classic-rose
  "#c084fc", // purple-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
];

export interface ClassificationInput {
  content: string; // Note content, photo caption, or link description
  title?: string; // Note/photo/link title
  url?: string; // Link URL (for domain-based classification)
  type: "note" | "photo" | "link";
  existingLabels: Label[]; // User's current labels
}

export interface ClassificationResult {
  suggestedLabelIds: string[]; // IDs of existing labels to apply
  newLabels: LabelInput[]; // New labels to create
}

/**
 * Classify content using Gemini AI and suggest labels
 * Max 3 labels total, max 2 new labels
 */
export async function classifyContent(
  input: ClassificationInput
): Promise<ClassificationResult> {
  const startTime = Date.now();

  try {
    // Build context string for AI
    const contentParts: string[] = [];
    if (input.title) contentParts.push(`Title: ${input.title}`);
    if (input.content) contentParts.push(`Content: ${input.content.slice(0, 500)}`); // Limit content length
    if (input.url) contentParts.push(`URL: ${input.url}`);

    const contentStr = contentParts.join("\n");
    const existingLabelNames = input.existingLabels.map((l) => l.name);

    // Construct AI prompt
    const prompt = `You are a label classification assistant. Analyze the following ${input.type} and suggest relevant labels for organization.

${contentStr}

EXISTING LABELS: ${existingLabelNames.length > 0 ? existingLabelNames.join(", ") : "None"}

RULES:
1. Suggest MAXIMUM 3 labels total
2. Suggest MAXIMUM 2 NEW labels (prefer reusing existing labels)
3. ALWAYS prefer existing labels when semantically similar (e.g., if "Work" exists, don't suggest "Professional")
4. New labels should be:
   - Short (1-2 words max)
   - Capitalized (e.g., "Work", "Personal", "Ideas", "Travel", "Tech", "Finance")
   - Broad categories
5. Return ONLY valid JSON, no markdown, no explanation

Return JSON format:
{
  "existingLabelIds": ["label-name-1", "label-name-2"],
  "newLabels": [{"name": "new-label", "color": "#7240fe"}]
}

If no labels are appropriate, return empty arrays.`;

    // Call Gemini AI
    const aiResult = await model.generateContent(prompt);
    const response = aiResult.response;
    const text = response.text();

    // Parse AI response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText) as {
      existingLabelIds: string[];
      newLabels: { name: string; color?: string }[];
    };

    // Map existing label names to IDs
    const suggestedLabelIds: string[] = [];
    for (const labelName of parsed.existingLabelIds || []) {
      const foundLabel = input.existingLabels.find(
        (l) => l.name.toLowerCase() === labelName.toLowerCase()
      );
      if (foundLabel) {
        suggestedLabelIds.push(foundLabel.id);
      }
    }

    // Limit to max 3 labels total, max 2 new
    // Assign random colors from palette (ensure variety)
    const usedColors = new Set<string>();
    const newLabels: LabelInput[] = (parsed.newLabels || [])
      .slice(0, 2) // Max 2 new labels
      .map((nl) => {
        // Pick a random color that hasn't been used yet if possible
        let color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
        let attempts = 0;
        while (usedColors.has(color) && attempts < LABEL_COLORS.length) {
          color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
          attempts++;
        }
        usedColors.add(color);

        return {
          name: nl.name.trim(), // Keep capitalization from AI
          color,
        };
      });

    // Ensure total doesn't exceed 3
    const totalLabels = suggestedLabelIds.length + newLabels.length;
    if (totalLabels > 3) {
      // Prioritize existing labels, trim new labels
      const allowedNewLabels = Math.max(0, 3 - suggestedLabelIds.length);
      newLabels.splice(allowedNewLabels);
    }

    const result = {
      suggestedLabelIds: suggestedLabelIds.slice(0, 3), // Safety check
      newLabels,
    };

    // Log successful AI interaction
    aiDebugger.log({
      type: "classification",
      operation: `Label Classification (${input.type})`,
      prompt,
      response: text,
      duration: Date.now() - startTime,
      metadata: {
        type: input.type,
        existingLabelsCount: input.existingLabels.length,
        suggestedExistingCount: result.suggestedLabelIds.length,
        suggestedNewCount: result.newLabels.length,
      },
    });

    return result;
  } catch (error) {
    console.error("AI label classification failed:", error);

    // Log failed AI interaction
    aiDebugger.log({
      type: "classification",
      operation: `Label Classification (${input.type})`,
      prompt: "Error occurred before prompt was sent",
      response: "",
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        type: input.type,
        existingLabelsCount: input.existingLabels.length,
      },
    });

    // Return empty suggestions on error (never block card creation)
    return {
      suggestedLabelIds: [],
      newLabels: [],
    };
  }
}
