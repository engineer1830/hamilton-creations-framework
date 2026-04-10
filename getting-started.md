Getting Started
This guide walks you through creating your first content library.

1. Clone or download the template
Code
content-site-template/
Open it in VS Code or your editor of choice.

2. Add your first Markdown file
Create:

Code
content/my-first-topic.md
Add:

markdown
# My First Topic

This is my first piece of content in the Content Library Framework.
3. Add an entry to content.json
Open:

Code
data/content.json
Add:

json
{
  "title": "My First Topic",
  "slug": "my-first-topic",
  "category": "General",
  "keywords": ["first", "demo"],
  "contentPath": "content/my-first-topic.md"
}
4. Refresh the browser
You’ll see:

a new card on the homepage

a new link in the sidebar

a fully rendered Markdown page

5. Add more content
Repeat steps 2–4.
The framework handles everything else automatically.

6. Customize the design
Open:

Code
styles/content.css
Modify the design tokens at the top to change:

colors

typography

spacing

shadows

radii

Your entire site updates instantly.

7. Deploy anywhere
Because the framework is 100% static, you can deploy to:

GitHub Pages

Netlify

Vercel

Cloudflare Pages

S3

Azure Static Web Apps

No backend.
No build step.
No dependencies.