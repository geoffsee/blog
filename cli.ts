#!/usr/bin/env bun
/**
 * ================================================
 * USAGE EXAMPLES & MODEL SWITCHING
 * ================================================
 *
 * BASIC USAGE:
 *   ./cli.ts content/posts/my-article.md
 *
 * DRY RUN (strongly recommended):
 *   ./cli.ts content/posts/my-article.md --dry-run
 *
 *
 * MODEL OVERRIDES
 * ================================================
 *
 * Default image model: gpt-image-1-mini
 *
 * Combine text and image models for full control:
 *   ./cli.ts content/posts/my-post.md \
 *     --brief-model=gpt-5 \
 *     --prompt-model=gpt-5.4-mini \
 *     --image-model=gpt-image-1-mini
 *
 * Full production command:
 *   ./cli.ts content/posts/ai-agents.md \
 *     --n=2 \
 *     --size=1536x1024 \
 *     --quality=high \
 *     --brief-model=gpt-5 \
 *     --prompt-model=gpt-5.4-mini \
 *     --image-model=gpt-image-1-mini
 *
 *
 * OTHER COMMON OPTIONS:
 *   --dry-run - Run in dry-run mode, no images generated
 *   --n=3 - Generate multiple images (default: 1)
 *   --size=1792x1024 - Image size (default: 1536x1024) Valid values depend on selected model
 *   --quality=medium - Image quality (default: high) Valid values: low, medium, high
 *   --format=webp - Output image format (default: png) Valid values: png, jpeg, webp
 *
 *
 * Troubleshooting:
 * - Invalid model name → OpenAI API error will be clearly logged
 * - Missing API key → Set OPENAI_API_KEY environment variable
 *
 * Tips:
 * - Always run with --dry-run first when changing models
 * - Use frontmatter image_subject, image_style, image_palette, and image_mood
 *   when a post needs stronger art direction.
 */

const DEFAULT_BRIEF_MODEL = "gpt-5";
const DEFAULT_PROMPT_BUILDING_MODEL = "gpt-5";
const DEFAULT_IMAGE_MODEL = "gpt-image-1-mini";
const DEFAULT_IMAGE_SIZE = "1536x1024";

const IMAGE_SIZES = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "1792x1024",
  "1024x1792",
  "256x256",
  "512x512",
] as const;

type ImageSize = (typeof IMAGE_SIZES)[number];

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Frontmatter = {
  title: string;
  excerpt?: string;
  date: string;
  featured_image?: string;
  image_style?: string;
  image_palette?: string;
  image_subject?: string;
  image_mood?: string;
  image_size?: string;
  image_quality?: "low" | "medium" | "high";
};

type CliOptions = {
  filePath: string;
  dryRun: boolean;
  n: number;
  size: ImageSize;
  quality: "low" | "medium" | "high";
  outputFormat: "png" | "jpeg" | "webp";
  briefModel: string;
  promptModel: string;
  imageModel: string;
};

type VisualBrief = {
  concept: string;
  anchors: string[];
  composition: string;
  mood: string;
  palette: string;
  avoid: string[];
};

const VISUAL_BRIEF_RESPONSE_FORMAT = {
  type: "json_schema",
  name: "visual_brief",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      concept: {
        type: "string",
        description: "One sentence describing the featured-image concept.",
      },
      anchors: {
        type: "array",
        description: "Concrete visual anchors drawn from the article.",
        items: { type: "string" },
      },
      composition: {
        type: "string",
        description: "The single dominant composition for the image.",
      },
      mood: {
        type: "string",
        description: "The emotional tone and visual energy.",
      },
      palette: {
        type: "string",
        description: "A concise color and material palette.",
      },
      avoid: {
        type: "array",
        description: "Specific visual cliches or mistakes to exclude.",
        items: { type: "string" },
      },
    },
    required: ["concept", "anchors", "composition", "mood", "palette", "avoid"],
  },
} as const;

const IMAGE_PROMPT_GUIDELINES = `
You MUST output exactly these five labeled fields and nothing else:

Scene: <concise environment description>
Subject: <single dominant subject>
Important details: <materials, geometry, lighting, rendering, constraints>
Use case: <what this image represents conceptually>
Constraints: <hard exclusions and invariants>

Rules:
- One dominant subject, designed for a technical blog hero image.
- Ground the image in concrete article-specific objects, materials, and failure modes.
- Prefer editorial photography, industrial still life, macro hardware detail, or cinematic documentary realism.
- No markdown, code fences, YAML, lists, prose paragraphs, captions, or extra sections.
- No readable text, labels, UI, diagrams, logos, or brand marks in the image.
- No humans, humanoids, robots, mannequins, costumes, glowing brains, generic neural-network meshes, or decorative abstract geometry unless the article explicitly demands it.
- Avoid generic server rooms, generic factories, blue holograms, and stock-photo tech cliches.
`.trim();

const REQUIRED_PROMPT_FIELDS = [
  "Scene:",
  "Subject:",
  "Important details:",
  "Use case:",
  "Constraints:",
];

function isImageSize(value: string): value is ImageSize {
  return IMAGE_SIZES.includes(value as ImageSize);
}

function parseImageSize(value: string | undefined): ImageSize {
  const size = value ?? DEFAULT_IMAGE_SIZE;
  if (isImageSize(size)) return size;

  console.error(`❌ Invalid image size: ${size}`);
  console.error(`   Valid sizes: ${IMAGE_SIZES.join(", ")}`);
  process.exit(1);
}

function resolveImageSize(frontmatterSize: string | undefined, optionSize: ImageSize): ImageSize {
  if (!frontmatterSize) return optionSize;
  if (isImageSize(frontmatterSize)) return frontmatterSize;

  console.warn(
      `⚠️  Ignoring invalid frontmatter image_size "${frontmatterSize}". Using ${optionSize}.`
  );
  return optionSize;
}

function parseArgs(argv: string[]): CliOptions {
  const filePath = argv[2];

  if (!filePath) {
    console.error("❌ Usage: ./cli.ts <path> [--dry-run] [--n=1] [--size=1536x1024] [--quality=high]");
    process.exit(1);
  }

  const getArg = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  };

  const quality = (getArg("quality") ?? "high") as CliOptions["quality"];
  const outputFormat = (getArg("format") ?? "png") as CliOptions["outputFormat"];
  const n = Number(getArg("n") ?? "1");


  const opts: CliOptions = {
    filePath,
    dryRun: argv.includes("--dry-run"),
    n,
    size: parseImageSize(getArg("size")),
    quality,
    outputFormat,
    briefModel:
        getArg("brief-model") ??
        getArg("metaphor-model") ??
        DEFAULT_BRIEF_MODEL,
    promptModel: getArg("prompt-model") ?? DEFAULT_PROMPT_BUILDING_MODEL,
    imageModel: getArg("image-model") ?? DEFAULT_IMAGE_MODEL,
  };

  console.log("🔧 CLI Options:", {
    filePath: opts.filePath,
    dryRun: opts.dryRun,
    n: opts.n,
    size: opts.size,
    quality: opts.quality,
    outputFormat: opts.outputFormat,
    briefModel: opts.briefModel,
    promptModel: opts.promptModel,
    imageModel: opts.imageModel,
  });

  return opts;
}

function parseFrontmatter(content: string): Frontmatter {
  console.log("📄 Parsing frontmatter...");
  const match = content.match(/^---\n([\s\S]*?)\n---/m);
  if (!match) throw new Error("Missing frontmatter");

  const fm = match[1] ?? "";

  const read = (key: string) => {
    const m =
        fm.match(new RegExp(`^${key}:\\s*"([^"]*)"`, "m")) ||
        fm.match(new RegExp(`^${key}:\\s*([^\\n]+)`, "m"));
    return m?.[1]?.replace(/^"|"$/g, "").trim();
  };

  const title = read("title");
  if (!title) throw new Error("Missing title in frontmatter");

  const frontmatter: Frontmatter = {
    title,
    excerpt: read("excerpt"),
    date: read("date") ?? new Date().toISOString().slice(0, 10),
    featured_image: read("featured_image"),
    image_style: read("image_style"),
    image_palette: read("image_palette"),
    image_subject: read("image_subject"),
    image_mood: read("image_mood"),
    image_size: read("image_size"),
    image_quality: read("image_quality") as any,
  };

  console.log("✅ Frontmatter parsed:", {
    title: frontmatter.title,
    date: frontmatter.date,
    hasExcerpt: !!frontmatter.excerpt,
    hasExistingFeaturedImage: !!frontmatter.featured_image,
    imageSize: frontmatter.image_size,
    imageQuality: frontmatter.image_quality,
  });

  return frontmatter;
}

function slugify(input: string) {
  return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 90);
}

function extractBody(content: string): string {
  console.log("📝 Extracting post body...");
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  const body = match?.[1]?.trim() ?? content;
  console.log(`📏 Body length: ${body.length} characters`);
  return body;
}

function buildPostContext(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n");
  const headings = Array.from(normalized.matchAll(/^#{2,3}\s+(.+)$/gm))
      .map((match) => match[1]?.trim() ?? "")
      .filter(Boolean)
      .map((heading) => `- ${heading}`)
      .slice(0, 24);
  const opening = normalized.slice(0, 8500);
  const ending =
      normalized.length > 12000
          ? normalized.slice(Math.max(0, normalized.length - 3500))
          : "";

  return [
    headings.length ? `Headings:\n${headings.join("\n")}` : "",
    `Article excerpt:\n${opening}`,
    ending ? `Later article excerpt:\n${ending}` : "",
  ]
      .filter(Boolean)
      .join("\n\n");
}

function buildImageDirectives(fm: Frontmatter): string {
  const directives = [
    fm.image_subject ? `Preferred subject: ${fm.image_subject}` : "",
    fm.image_style ? `Preferred style: ${fm.image_style}` : "",
    fm.image_palette ? `Preferred palette: ${fm.image_palette}` : "",
    fm.image_mood ? `Preferred mood: ${fm.image_mood}` : "",
  ].filter(Boolean);

  return directives.length
      ? directives.join("\n")
      : "No explicit frontmatter image directives.";
}

function parseJsonObject(raw: string): unknown {
  const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error(`Model did not return JSON: ${raw.slice(0, 200)}`);
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
}

function normalizeVisualBrief(value: unknown): VisualBrief {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Visual brief JSON must be an object.");
  }

  const record = value as Record<string, unknown>;
  const brief: VisualBrief = {
    concept: asString(record.concept),
    anchors: asStringArray(record.anchors).slice(0, 8),
    composition: asString(record.composition),
    mood: asString(record.mood),
    palette: asString(record.palette),
    avoid: asStringArray(record.avoid).slice(0, 12),
  };

  if (!brief.concept || brief.anchors.length === 0 || !brief.composition) {
    throw new Error(
        `Visual brief is missing required fields: ${JSON.stringify(brief)}`
    );
  }

  return brief;
}

function normalizeImagePrompt(raw: string): string {
  let prompt = raw.trim();
  prompt = prompt
      .replace(/^---\s*/i, "")
      .replace(/^```(?:text)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/^~~~(?:text)?\s*/i, "")
      .replace(/\s*~~~$/i, "")
      .trim();

  const missing = REQUIRED_PROMPT_FIELDS.filter((field) => !prompt.includes(field));
  if (missing.length > 0) {
    console.warn(`⚠️  Generated prompt is missing fields: ${missing.join(", ")}`);
  }

  return prompt;
}

async function generateVisualBrief(
    model: string,
    fm: Frontmatter,
    body: string
): Promise<VisualBrief> {
  console.log(`🧠 Generating visual brief using model: ${model}...`);

  const res = await openai.responses.create({
    model,
    text: {
      format: VISUAL_BRIEF_RESPONSE_FORMAT,
    },
    input: [
      {
        role: "system",
        content: [
          "You are a senior art director for technical blog feature images.",
          "Create a concrete visual brief from the article, not a generic metaphor.",
          "Favor specific physical artifacts, systems failure modes, infrastructure details, and editorial composition.",
          "Return valid JSON only with keys: concept, anchors, composition, mood, palette, avoid.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Analyze this post and create a featured-image brief.

Title: ${fm.title}
Excerpt: ${fm.excerpt ?? ""}

Frontmatter image directives:
${buildImageDirectives(fm)}

Selection rules:
- Choose one strong image idea that could plausibly be photographed or rendered as a physical scene.
- Use 3-8 concrete anchors from the article.
- Preserve the article's main tension and lesson, not just the title.
- Avoid literal text, labels, screenshots, dashboards, and diagrams because the final image cannot contain readable text.
- Avoid the common generic traps: humanoids, robots, costumes, glowing neural nets, generic server racks, abstract geometry, and random factories.

Article context:
${buildPostContext(body)}`,
      },
    ],
  });

  const brief = normalizeVisualBrief(parseJsonObject(res.output_text));

  console.log("✅ Visual brief generated:", brief.concept);
  console.log(`   Anchors: ${brief.anchors.join("; ")}`);

  return brief;
}

async function generateImagePrompt(
    model: string,
    fm: Frontmatter,
    brief: VisualBrief
): Promise<string> {
  console.log(`🎨 Generating structured image prompt using model: ${model}...`);

  const res = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          "You write image-generation prompts for mature technical editorial art.",
          "The result must feel specific to the article, not like stock AI imagery.",
          "Use the brief exactly; do not introduce people, humanoids, logos, text, UI, diagrams, or extra narrative subjects.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Create the final image prompt for this technical blog feature image.

Title: ${fm.title}
Excerpt: ${fm.excerpt ?? ""}

Frontmatter image directives:
${buildImageDirectives(fm)}

Visual brief:
${JSON.stringify(brief, null, 2)}

## Prompt Guidelines
${IMAGE_PROMPT_GUIDELINES}`,
      },
    ],
  });

  const prompt = normalizeImagePrompt(res.output_text);
  console.log("\n📋 Generated Image Prompt:");
  console.log("─".repeat(80));
  console.log(prompt);
  console.log("─".repeat(80));

  return prompt;
}

function updateFeaturedImage(content: string, newPath: string): string {
  console.log(`🔄 Updating frontmatter with featured_image: ${newPath}`);

  if (content.match(/^featured_image:/m)) {
    return content.replace(
        /^featured_image:.*$/m,
        `featured_image: "${newPath}"`
    );
  }

  return content.replace(
      /^---\n([\s\S]*?)\n---/m,
      `---\n$1\nfeatured_image: "${newPath}"\n---`
  );
}

async function main() {
  console.log("🚀 Starting image generation script...\n");

  const opts = parseArgs(process.argv);

  try {
    const content = readFileSync(opts.filePath, "utf-8");
    console.log(`📂 File loaded: ${opts.filePath} (${content.length} chars)`);

    const fm = parseFrontmatter(content);
    const body = extractBody(content);

    const brief = await generateVisualBrief(opts.briefModel, fm, body);
    const imagePrompt = await generateImagePrompt(opts.promptModel, fm, brief);

    if (opts.dryRun) {
      console.log("🧪 Dry-run mode enabled — skipping image generation and file changes.");
      return;
    }

    console.log(`🖼️  Generating ${opts.n} image(s) using ${opts.imageModel}...`);

    const response = await openai.images.generate({
      model: opts.imageModel,
      prompt: imagePrompt,
      size: resolveImageSize(fm.image_size, opts.size),
      quality: fm.image_quality ?? opts.quality,
      n: opts.n,
      output_format: opts.outputFormat,
    });

    const images = response.data ?? [];
    console.log(`✅ OpenAI returned ${images.length} image(s)`);

    const slug = slugify(fm.title);
    const outDir = join(process.cwd(), "assets", "images");

    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
      console.log(`📁 Created output directory: ${outDir}`);
    }

    let firstPath = "";

    images.forEach((img: { b64_json?: string }, i: number) => {
      const filename = `${fm.date}-${slug}${opts.n > 1 ? `-${i + 1}` : ""}.${
          opts.outputFormat
      }`;
      const fullPath = join(outDir, filename);

      if (!img.b64_json) {
        throw new Error(`Image #${i + 1} did not include base64 image data.`);
      }

      writeFileSync(fullPath, Buffer.from(img.b64_json, "base64"));

      if (i === 0) firstPath = `/assets/images/${filename}`;

      console.log(`💾 Saved image #${i + 1}: ${fullPath}`);
    });

    // Update frontmatter
    const updated = updateFeaturedImage(content, firstPath);
    writeFileSync(opts.filePath, updated, "utf-8");

    console.log(`✅ Successfully updated ${opts.filePath}`);
    console.log(`   Featured image path: ${firstPath}`);

  } catch (error) {
    console.error("❌ ERROR during execution:");
    console.error(error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("💥 Uncaught error in main():", e);
  process.exit(1);
});
