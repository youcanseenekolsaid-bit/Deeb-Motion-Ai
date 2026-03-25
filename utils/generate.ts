"use client";

import { GoogleGenAI, Type } from "@google/genai";

export async function generateVideoScript(prompt: string, durationInSeconds: number, fps: number = 30, currentCode?: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Role
You are an expert Remotion video developer and a helpful AI assistant.
Your task is to generate or modify a production-ready TSX file based on the user's description.

Output requirements
You must return a JSON object with two fields:
1. "message": A conversational response explaining what you are doing or what you have changed. Be friendly and concise. Respond in the same language as the user's prompt (e.g. if Arabic, respond in Arabic).
2. "code": The complete TSX code for the Remotion video.

Video specs
Aspect ratio
Use 16:9 or 9:16 if the user requests it
If the user does not specify, use 1920x1080

Duration
Maximum 10 seconds

FPS
30

Code structure mandatory
Your output MUST follow this exact structure and sections:

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing, AbsoluteFill } from 'remotion';

// =============================================================================
// COMPOSITION CONFIG (Required for auto-discovery)
// =============================================================================
export const compositionConfig = {
  id: '[UniqueComponentName]',
  durationInSeconds: [1-5],
  fps: 30,
  width: 1080,
  height: 1920,
};

// =============================================================================
// PRE-GENERATED DATA (if needed - computed once, NOT during render)
// =============================================================================
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// [Any arrays/objects for particles, items, etc. go here]

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const [ComponentName]: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animation calculations here...

  return (
    <AbsoluteFill style={{ backgroundColor: '#...' }}>
      {/* Content */}
    </AbsoluteFill>
  );
};

export default [ComponentName];

Animation rules
1. ALL animations must be frame based using useCurrentFrame() and interpolate()
2. NEVER use useState, useEffect, setTimeout, or CSS animations
3. Use extrapolateLeft: 'clamp' and extrapolateRight: 'clamp' to prevent value overflow
4. Use Easing functions for professional motion (example: easing: Easing.out(Easing.ease) - do not call the inner function, or use Easing.bezier(0.25, 0.1, 0.25, 1))
5. Stagger animations logically, do not animate everything at once
6. The composition ID cannot have underscores or hyphens
7. Make sure text components are clear and big enough to be seen on mobile screens

Layout rules
1. Use AbsoluteFill as the root container
2. Position elements with position: absolute and percentage based positioning
3. Reserve safe zones: top 10%, bottom 15% for platform UI overlays
4. Center important content vertically between 25% and 75% of screen height
5. Use transform: translate(-50%, -50%) with left: 50% for true centering

Typography guidelines
DO NOT add any text, titles, or typography to the video UNLESS the user explicitly asks for it in their prompt. If they do ask for text, follow these rules:
Headlines
72 to 120px, bold, high contrast

Subheadlines
36 to 48px

Body text
28 to 36px minimum for readability

Additional typography rules
Always set margin: 0 on text elements
Use textAlign: 'center' for centered layouts

Quality standards
Professional color schemes, avoid pure #000000 or #FFFFFF as backgrounds
Subtle background elements like gradients or particles to add depth
Text shadows or glows to improve readability
Smooth easing on all transitions
`;

    const userContent = currentCode 
      ? `Current Code:\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nUser Request: "${prompt}"\n\nPlease modify the current code to fulfill the user's request.`
      : `User Prompt: "${prompt}"`;

    const config = {
      systemInstruction: systemPrompt + "\n\nCRITICAL: Ensure the generated code is valid TypeScript and JSX. Do not use unescaped characters in JSX text. Always close tags properly. Do not use any undefined variables.",
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          message: {
            type: Type.STRING,
            description: "A conversational response explaining what you are doing or what you have changed."
          },
          code: {
            type: Type.STRING,
            description: "The complete TSX code for the Remotion video."
          }
        },
        required: ["message", "code"]
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: userContent,
        config
      });
    } catch (primaryError: any) {
      console.warn("Primary model (gemini-3.1-pro-preview) failed, falling back to gemini-3-pro-preview. Error:", primaryError.message);
      response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: userContent,
        config
      });
    }

    const jsonStr = response.text?.trim() || "{}";
    const parsed = JSON.parse(jsonStr);

    return { success: true, code: parsed.code, message: parsed.message };
  } catch (error: any) {
    console.error("Error generating script:", error);
    return { success: false, error: error.message || "Failed to generate video script." };
  }
}
