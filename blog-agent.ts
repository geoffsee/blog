#!/usr/bin/env bun

import OpenAI from "openai";
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { finished } from "stream/promises";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get git activity for the current user (geoffsee)
async function getGitActivity() {
  try {
    // Get current git user
    const gitUser = execSync("git config user.name").toString().trim();
    console.log(`Collecting git activity for: ${gitUser}`);

    // Get detailed git log with stats for the last 2 weeks
    const gitLog = execSync(
      `git log --author="${gitUser}" --since="2 weeks ago" --pretty=format:"%H|||%an|||%ae|||%ad|||%s" --date=iso --numstat`
    ).toString();

    // Get recent commits with full diffs
    const gitDiff = execSync(
      `git log --author="${gitUser}" --since="2 weeks ago" --pretty=format:"%H|||%s|||%b" -p --max-count=10`
    ).toString();

    return {
      user: gitUser,
      log: gitLog,
      diff: gitDiff,
    };
  } catch (error) {
    console.error("Error collecting git activity:", error);
    throw error;
  }
}

// Generate blog post using OpenAI agent
async function generateBlogPost(gitActivity: any) {
  console.log("Generating blog post with OpenAI...");

  // Read example posts to understand style
  const examplePost1 = await Bun.file("./posts/2025-11-03-simple-wins-matter.md").text();
  const examplePost2 = await Bun.file("./posts/2025-11-03-building-exechub.md").text();

  const systemPrompt = `You are an expert technical blog post writer. You analyze git commit history and create insightful, well-structured blog posts similar to the examples provided.

Your blog posts should:
1. Have YAML frontmatter with: title, date, author, tags, categories, excerpt, published, featured_image
2. Include sections like: Summary, Core Problem/Challenge, Implementation Details, Philosophy, Honest Assessment, The Real Question
3. Be technical but accessible, focusing on insights and lessons learned
4. Include code snippets where relevant
5. Have a philosophical angle that connects technical decisions to broader principles
6. Be honest about tradeoffs and challenges
7. Use the current date (${new Date().toISOString().split('T')[0]})

Here are two example posts for style reference:

EXAMPLE 1:
${examplePost1}

EXAMPLE 2:
${examplePost2}`;

  const userPrompt = `Based on the following git activity for ${gitActivity.user}, create a compelling technical blog post that tells the story of what was built, the challenges faced, and the lessons learned.

Git Activity (commits and stats):
${gitActivity.log}

Recent Changes (diffs):
${gitActivity.diff.slice(0, 15000)}

Analyze this activity and create a blog post that:
1. Identifies the main theme or project being worked on
2. Explains the technical decisions and implementation
3. Discusses challenges and how they were solved
4. Provides insights that would be valuable to other developers
5. Maintains the philosophical, thoughtful tone of the example posts

Generate the complete blog post in markdown format with YAML frontmatter.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating blog post:", error);
    throw error;
  }
}

// Enhance blog post with mermaid diagrams styled for dark backgrounds
async function enhanceWithMermaidDiagrams(blogPost: string) {
  console.log("Enhancing blog post with mermaid diagrams...");

  const systemPrompt = `You are an expert at creating mermaid diagrams for technical blog posts. Your task is to:

1. Analyze the blog post content and identify 2-3 key concepts that would benefit from visual diagrams
2. Generate mermaid diagrams that illustrate these concepts
3. IMPORTANT: Style all diagrams for DARK BACKGROUNDS using the %%{init: {}}%% directive

For dark backgrounds, use this styling template:
\`\`\`mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#1a1a1a','primaryTextColor':'#e0e0e0','primaryBorderColor':'#666','lineColor':'#888','secondaryColor':'#2a2a2a','tertiaryColor':'#3a3a3a','nodeTextColor':'#e0e0e0','edgeLabelBackground':'#1a1a1a','clusterBkg':'#2a2a2a','clusterBorder':'#666','titleColor':'#e0e0e0'}}}%%
graph TD
    ...
\`\`\`

Key styling requirements:
- Use 'dark' theme
- Light text colors (#e0e0e0 or similar) for readability on black
- Dark backgrounds for nodes (#1a1a1a, #2a2a2a)
- Visible but not harsh borders (#666, #888)
- Ensure all text is readable on dark backgrounds

Return the COMPLETE blog post with the mermaid diagrams inserted in appropriate locations.`;

  const userPrompt = `Analyze this blog post and add 2-3 well-placed mermaid diagrams styled for dark backgrounds:

${blogPost}

Insert the diagrams in logical places that enhance understanding. Make sure ALL diagrams use the dark theme configuration provided in the system prompt.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error enhancing with mermaid diagrams:", error);
    console.log("Continuing with original blog post...");
    return blogPost; // Return original if enhancement fails
  }
}

// Generate featured image using DALL-E
async function generateFeaturedImage(blogPost: string) {
  console.log("Generating featured image with DALL-E...");

  try {
    // Extract title and excerpt from blog post
    const titleMatch = blogPost?.match(/title:\s*"([^"]+)"/);
    const excerptMatch = blogPost?.match(/excerpt:\s*"([^"]+)"/);

    const title = titleMatch ? titleMatch[1] : "Blog Post";
    const excerpt = excerptMatch ? excerptMatch[1] : "";

    // Create a prompt for DALL-E
    const imagePrompt = `Create a modern, professional, abstract technical illustration for a blog post titled "${title}". ${excerpt ? `The post is about: ${excerpt}.` : ''} Style: clean, minimalist, tech-focused, professional gradient, abstract geometric shapes, suitable for a technical blog header. Use vibrant but professional colors. No text or words in the image.`;

    console.log(`Generating image with prompt: ${imagePrompt.slice(0, 100)}...`);

    // Generate image with DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    // Download the image
    console.log("Downloading generated image...");
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create filename from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const date = new Date().toISOString().split('T')[0];
    const imageFilename = `${date}-${slug}.png`;
    const imagePath = join(process.cwd(), 'assets', 'images', imageFilename);

    // Save image
    writeFileSync(imagePath, buffer);
    console.log(`Image saved to: ${imagePath}`);

    // Return the web path for the frontmatter
    return `/assets/images/${imageFilename}`;
  } catch (error) {
    console.error("Error generating featured image:", error);
    console.log("Continuing with default image...");
    return "/assets/images/agentic-ai.png"; // Fallback to existing image
  }
}

// Save blog post to posts directory
function saveBlogPost(content: string) {
  const date = new Date().toISOString().split('T')[0];

  // Extract title from frontmatter to create filename
  const titleMatch = content?.match(/title:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : "untitled";
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filename = `${date}-${slug}.md`;
  const filepath = join(process.cwd(), 'posts', filename);

  // Check if a blog post already exists for today
  const { existsSync } = require('fs');
  if (existsSync(filepath)) {
    console.log(`⚠️  Blog post already exists: ${filepath}`);
    console.log("Skipping to avoid duplicate. Delete the existing file to regenerate.");
    return filepath;
  }

  writeFileSync(filepath, content || "");
  console.log(`Blog post saved to: ${filepath}`);

  return filepath;
}

// Main execution
async function main() {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Error: OPENAI_API_KEY environment variable is not set");
      console.error("\nPlease set your OpenAI API key:");
      console.error("  export OPENAI_API_KEY='your-api-key-here'");
      process.exit(1);
    }

    console.log("Starting blog post generation...\n");

    // Step 1: Collect git activity
    console.log("Step 1: Collecting git activity...");
    const gitActivity = await getGitActivity();
    console.log(`✓ Collected activity for ${gitActivity.user}\n`);

    // Step 2: Generate blog post with OpenAI
    console.log("Step 2: Generating blog post with OpenAI...");
    const blogPost = await generateBlogPost(gitActivity);
    console.log("✓ Blog post generated\n");

    // Step 3: Enhance with mermaid diagrams styled for dark backgrounds
    console.log("Step 3: Adding mermaid diagrams with dark theme...");
    const enhancedBlogPost = await enhanceWithMermaidDiagrams(blogPost!);
    console.log("✓ Mermaid diagrams added\n");

    // Step 4: Generate featured image with DALL-E
    console.log("Step 4: Generating featured image...");
    const imagePath = await generateFeaturedImage(enhancedBlogPost!);
    console.log("✓ Featured image generated\n");

    // Step 5: Update frontmatter with generated image path
    console.log("Step 5: Updating frontmatter with image path...");
    const finalBlogPost = enhancedBlogPost!.replace(
      /featured_image:\s*"[^"]*"/,
      `featured_image: "${imagePath}"`
    );
    console.log("✓ Frontmatter updated\n");

    // Step 6: Save blog post
    console.log("Step 6: Saving blog post...");
    const filepath = saveBlogPost(finalBlogPost);
    console.log(`✓ Blog post saved to ${filepath}\n`);

    console.log("Done! Your blog post is ready to review and publish.");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();