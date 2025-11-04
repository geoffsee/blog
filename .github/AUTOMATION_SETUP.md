# Automated Blog Post Generation Setup

This repository includes a GitHub Actions workflow that automatically generates blog posts every 2 weeks based on your git activity.

## How It Works

The workflow:
1. Runs automatically on the 1st and 15th of each month
2. Analyzes your git commits from the last 2 weeks
3. Uses OpenAI's GPT-4 to write a blog post in your style
4. Generates dark-themed mermaid diagrams
5. Creates a custom featured image with DALL-E 3
6. Commits and pushes the new post to the repository

## Setup Instructions

### 1. Add OpenAI API Key as a GitHub Secret

**Option A: Using GitHub CLI (Recommended)**

```bash
# If you already have OPENAI_API_KEY in your shell environment
gh secret set OPENAI_API_KEY --body "$OPENAI_API_KEY"

# Or set it directly
gh secret set OPENAI_API_KEY --body "your-api-key-here"
```

Verify it was set:
```bash
gh secret list
```

**Option B: Using GitHub Web UI**

1. Go to your GitHub repository
2. Click on **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `OPENAI_API_KEY`
5. Value: Your OpenAI API key (get one from https://platform.openai.com/api-keys)
6. Click **Add secret**

### 2. Verify Workflow Permissions

1. Go to **Settings** > **Actions** > **General**
2. Scroll down to **Workflow permissions**
3. Ensure **Read and write permissions** is selected
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 3. Test the Workflow

You can manually trigger the workflow to test it:

1. Go to **Actions** tab
2. Click on **Auto Generate Blog Post** workflow
3. Click **Run workflow** > **Run workflow**
4. Wait for it to complete and check the new commit

## Workflow Schedule

- **Automatic runs**: 1st and 15th of each month at midnight UTC
- **Manual runs**: Can be triggered anytime from the Actions tab

## What Gets Generated

Each run creates:
- A new markdown blog post in `posts/YYYY-MM-DD-title.md`
- A custom featured image in `assets/images/YYYY-MM-DD-title.png`
- Dark-themed mermaid diagrams embedded in the post
- Proper YAML frontmatter with all metadata

## Preventing Duplicates

The script automatically checks if a blog post already exists for the current date and skips generation if found. This prevents duplicate posts if the workflow runs multiple times on the same day.

## Cost Estimates

Per blog post generation:
- GPT-4 Turbo (blog + diagrams): ~$0.20-0.40
- DALL-E 3 (featured image): ~$0.04
- **Total per post**: ~$0.24-0.44

With 2 posts per month: **~$0.50-1.00/month**

## Customization

To modify the workflow schedule, edit `.github/workflows/auto-blog-post.yml`:

```yaml
on:
  schedule:
    # Change this cron expression to adjust timing
    - cron: '0 0 1,15 * *'
```

Common schedules:
- Weekly: `'0 0 * * 0'` (every Sunday at midnight)
- Monthly: `'0 0 1 * *'` (1st of each month)
- Every 2 weeks: `'0 0 1,15 * *'` (current setting)

## Troubleshooting

### Workflow fails with "OpenAI API Key not set"
- Check that the `OPENAI_API_KEY` secret is properly set in repository settings

### Workflow fails with "Permission denied"
- Verify workflow permissions are set to "Read and write permissions"

### No blog post generated
- Check if there's been any git activity in the last 2 weeks
- Review the workflow logs in the Actions tab for errors

### Duplicate posts being created
- The script should prevent this automatically
- If duplicates occur, manually delete the older one

## Manual Generation

You can also run the blog generator locally:

```bash
export OPENAI_API_KEY='your-api-key-here'
./blog-agent.ts
```

This is useful for testing or generating posts on-demand.