"use client";

import { GoogleGenAI, Type } from "@google/genai";

export async function generateVideoScript(
  prompt: string, 
  durationInSeconds: number | "auto", 
  fps: number = 30, 
  currentCode?: string, 
  imageArray?: string[], 
  isSeamlessLoop?: boolean,
  abortSignal?: AbortSignal
) {
  try {
    if (abortSignal?.aborted) throw new Error("AbortError");
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });

    let systemPrompt = `Role
You are an expert Remotion video developer and a helpful AI assistant.
Your task is to generate or modify a production-ready TSX file based on the user's description.

Output requirements
You must return a JSON object with three fields:
1. "message": A conversational response explaining what you are doing or what you have changed. Be friendly and concise. Respond in the same language as the user's prompt (e.g. if Arabic, respond in Arabic).
2. "code": The complete TSX code for the Remotion video.
3. "durationInSeconds": The duration of the video in seconds.

Video specs
Aspect ratio
Use 16:9 or 9:16 if the user requests it
If the user does not specify, use 1920x1080

Duration
${durationInSeconds === "auto" ? "The user requested an 'auto' duration. Please determine the best duration for this video based on the prompt and ensure your code reflects it. The duration should be between 5 and 60 seconds." : `Exactly ${durationInSeconds} seconds.`}

FPS
30

Code structure mandatory
Your output MUST follow this exact structure and sections:

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing, AbsoluteFill, spring, Sequence, Series } from 'remotion';
import { AnimatedText, PopOutImage, GridBackground, FloatingIcon } from '@/components/motion';
import * as LucideIcons from 'lucide-react';

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

Animation & Design Rules (Dan Koe Style)
1. Use Spring Physics: For professional motion, use \`spring()\` instead of linear \`interpolate()\` whenever possible. This gives a "bouncy" and smooth feel.
2. Use Sequences & Series: Divide your video into logical scenes using \`<Sequence>\` or \`<Series>\`.
3. Use Pre-built Motion Components:
   - \`<AnimatedText text="Hello" delay={10} wordByWord={true} style={{...}} />\` for text that appears character by character or word by word.
   - \`<PopOutImage src="url" delay={5} style={{...}} />\` for images that pop in.
   - \`<GridBackground color="rgba(255,255,255,0.1)" backgroundColor="#0a0a0a" gridSize={60} speed={1} />\` for a moving grid background.
   - \`<FloatingIcon icon={<LucideIcons.Star color="yellow" size={100} />} delay={0} />\` for floating SVG icons.
4. Use Lucide Icons: For graphics, use \`lucide-react\` icons (e.g., \`<LucideIcons.Rocket size={200} color="white" />\`). They are SVGs and look highly professional.
5. Fetching Images: If you need real images, use \`https://source.unsplash.com/random/800x800/?keyword\` (replace keyword).
6. ALL animations must be frame based using useCurrentFrame() and interpolate() or spring()
7. NEVER use useState, useEffect, setTimeout, or CSS animations
8. Use extrapolateLeft: 'clamp' and extrapolateRight: 'clamp' to prevent value overflow
9. The composition ID cannot have underscores or hyphens
10. Make sure text components are clear and big enough to be seen on mobile screens

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

    if (isSeamlessLoop) {
      systemPrompt += `\n\nSEAMLESS LOOP REQUIREMENT:
The user has requested a SEAMLESS LOOP video. You MUST ensure that the very last frame of the animation perfectly matches the very first frame.
- Animate elements so they return to their exact starting positions, opacities, and scales by the end of the duration.
- Use math like \`Math.sin(frame / durationInFrames * Math.PI * 2)\` to create perfect cyclic animations.
- Ensure there are no sudden jumps or cuts when the video restarts.`;
    }

    const parts: any[] = [];
    if (currentCode) {
      parts.push({ text: `Current Code:\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nUser Request: "${prompt}"\n\nPlease modify the current code to fulfill the user's request.` });
    } else {
      parts.push({ text: `User Prompt: "${prompt}"` });
    }

    if (imageArray && imageArray.length > 0) {
      imageArray.forEach(img => {
        const base64Data = img.split(',')[1] || img;
        const mimeTypeMatch = img.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
        parts.push({ inlineData: { data: base64Data, mimeType } });
      });
    }

    const userContent = { parts };

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
          },
          durationInSeconds: {
            type: Type.NUMBER,
            description: "The duration of the video in seconds. If the user requested 'auto', provide your chosen duration here."
          }
        },
        required: ["message", "code", "durationInSeconds"]
      }
    };

    let response;
    try {
      if (abortSignal?.aborted) throw new Error("AbortError");
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: userContent,
        config
      });
    } catch (primaryError: any) {
      if (abortSignal?.aborted) throw new Error("AbortError");
      console.warn("Primary model (gemini-3.1-pro-preview) failed, falling back to gemini-3-pro-preview. Error:", primaryError.message);
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: userContent,
          config
        });
      } catch (secondaryError: any) {
        if (abortSignal?.aborted) throw new Error("AbortError");
        console.warn("Secondary model (gemini-3-pro-preview) failed, falling back to gemini-3-flash-preview. Error:", secondaryError.message);
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userContent,
          config
        });
      }
    }

    if (abortSignal?.aborted) throw new Error("AbortError");

    const jsonStr = response.text?.trim() || "{}";
    const parsed = JSON.parse(jsonStr);

    return { success: true, code: parsed.code, message: parsed.message, durationInSeconds: parsed.durationInSeconds };
  } catch (error: any) {
    if (error.message === "AbortError") {
      return { success: false, error: "AbortError" };
    }
    console.error("Error generating script:", error);
    let errorMessage = error.message || "Failed to generate video script.";
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      errorMessage = "عذراً، لقد تجاوزت الحد المسموح به من الطلبات (Quota Exceeded). يرجى المحاولة مرة أخرى لاحقاً أو التحقق من خطة الفوترة الخاصة بك.";
    }
    return { success: false, error: errorMessage };
  }
}
