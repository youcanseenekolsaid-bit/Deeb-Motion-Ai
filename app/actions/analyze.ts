"use server";

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from "@google/genai";

export async function analyzeReferenceVideos(prompt: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API key missing");

    const ai = new GoogleGenAI({ apiKey });
    
    // Get all mp4 files in public folder
    const publicDir = path.join(process.cwd(), 'public');
    let files: string[] = [];
    try {
      files = fs.readdirSync(publicDir).filter(f => f.endsWith('.mp4'));
    } catch (e) {
      console.warn("Public directory not found or unreadable.");
    }
    
    if (files.length === 0) {
      return "No reference videos found in the public folder. Proceeding with default professional Dan Koe style.";
    }

    const parts: any[] = [
      { text: `Analyze these ${files.length} reference motion graphics videos from our library. The user wants to create a video with this prompt: "${prompt}". Extract the exact animation styles, typography, pacing, color usage, and layout patterns from these videos so I can replicate them in React Remotion code. Be extremely detailed about the motion physics (springs, bounces), text reveals, and transitions.` }
    ];

    // Read and append ALL videos
    for (const file of files) {
      try {
        const filePath = path.join(publicDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: 'video/mp4'
          }
        });
      } catch (err) {
        console.warn(`Failed to process video ${file}:`, err);
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts }
    });

    return response.text || "Analyzed successfully.";
  } catch (error: any) {
    console.error("Error analyzing videos:", error);
    return "Failed to analyze all videos due to size or API limits, but will proceed with standard professional style. Error: " + error.message;
  }
}
