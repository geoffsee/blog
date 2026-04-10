import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error("Usage: bun run generate-image.ts <path-to-markdown-file>");
    process.exit(1);
  }

  console.log(`Processing ${filePath}...`);
  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`Could not read file ${filePath}:`, err);
    process.exit(1);
  }

  // Extract frontmatter properties
  const titleMatch = content.match(/title:\s*"([^"]+)"/);
  const excerptMatch = content.match(/excerpt:\s*"([^"]+)"/);
  const dateMatch = content.match(/date:\s*([^\s\n]+)/);

  if (!titleMatch) {
    console.error("Could not find title in frontmatter");
    process.exit(1);
  }

  const title = titleMatch[1];
  const excerpt = excerptMatch ? excerptMatch[1] : "";
  const dateStr = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0];

  const imagePrompt = `Create a modern, professional, abstract technical illustration for a blog post titled "${title}". ${excerpt ? `The post is about: ${excerpt}.` : ''} Style: clean, minimalist, tech-focused, professional gradient, abstract geometric shapes, suitable for a technical blog header. Use vibrant but professional colors. No text or words in the image.`;

  console.log(`Generating image for: "${title}"`);
  console.log(`Prompt: ${imagePrompt.slice(0, 100)}...`);

  try {
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

    console.log("Downloading generated image...");
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const imageFilename = `${dateStr}-${slug}.png`;
    const imagePath = join(process.cwd(), 'assets', 'images', imageFilename);

    writeFileSync(imagePath, buffer);
    console.log(`Image saved to: ${imagePath}`);

    const newImagePath = `/assets/images/${imageFilename}`;
    
    // Replace featured_image line in markdown
    if (content.match(/featured_image:\s*".*?"/)) {
      content = content.replace(
        /featured_image:\s*".*?"/, 
        `featured_image: "${newImagePath}"`
      );
    } else if (content.match(/featured_image:\s*.*/)) {
      content = content.replace(
        /featured_image:\s*.*/, 
        `featured_image: "${newImagePath}"`
      );
    } else {
      // If no featured_image exists, append it before the ending --- of frontmatter
      content = content.replace(
        /^---\n([\s\S]*?)\n---/m,
        `---\n$1\nfeatured_image: "${newImagePath}"\n---`
      );
    }

    writeFileSync(filePath, content, "utf-8");
    console.log(`Updated featured_image in ${filePath}`);

  } catch (error) {
    console.error("Error generating image:", error);
    process.exit(1);
  }
}

main();