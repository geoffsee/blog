# Blog Backend

Data backend for blog feature on geoff.seemueller.io

## Directory Structure

```
blog/
├── posts/              # Published blog posts
├── drafts/             # Work-in-progress posts
├── assets/             # Static assets
│   └── images/         # Blog images and media
└── README.md           # This file
```

## Writing Blog Posts

### File Naming Convention

Use the format: `YYYY-MM-DD-post-title-slug.md`

Example: `2024-01-15-getting-started-with-markdown.md`

### Frontmatter Format

Each markdown file should start with YAML frontmatter containing metadata:

```yaml
---
title: "Your Post Title"
date: 2024-01-15
author: "Your Name"
tags: ["tag1", "tag2", "tag3"]
categories: ["Category Name"]
excerpt: "A brief description of the post"
published: true
featured_image: "/assets/images/image.jpg"  # Optional
---
```

### Frontmatter Fields

- **title**: Post title (required)
- **date**: Publication date in YYYY-MM-DD format (required)
- **author**: Author name (required)
- **tags**: Array of tags for the post (optional)
- **categories**: Array of categories (optional)
- **excerpt**: Short description/preview (optional)
- **published**: Boolean, false for drafts (default: true)
- **featured_image**: Path to header image (optional)

## Workflow

1. **Create a draft**: Add new markdown files to `drafts/` directory
2. **Write content**: Use standard markdown syntax below the frontmatter
3. **Add images**: Place images in `assets/images/` and reference them
4. **Publish**: Move completed posts to `posts/` directory and set `published: true`

## Example Posts

See `posts/2024-01-15-getting-started-with-markdown.md` for a complete example.

## Tips

- Keep URLs and filenames consistent
- Use descriptive slugs in filenames
- Optimize images before uploading to `assets/images/`
- Use drafts folder for work in progress
- Set `published: false` for posts you're not ready to publish