# 📤 How to Upload Pages Folder to GitHub

I've created all the `pages` folder files for you. Now let's upload them!

---

## 🎯 Files You Now Have

These files are ready to upload:

```
pages/
├── _app.tsx
├── dashboard.tsx
├── login.tsx
└── api/
    └── chat.ts
```

---

## ✅ OPTION A: Upload via GitHub Web (Easiest - 5 minutes)

### Step 1: Go to Your GitHub Repo
- Open: `github.com/YOUR_USERNAME/finwise-ai-hackathon`
- Replace `YOUR_USERNAME` with your actual username

### Step 2: Click "Add file" → "Upload files"
- Look for the green **"Add file"** button
- Click it
- Select **"Upload files"** from dropdown

### Step 3: Upload These Files

**Create the folder structure:**

The page shows: "Drag files here to add them"

1. **For _app.tsx:**
   - Drag the file from `/home/claude/finwise-pages/pages/_app.tsx`
   - OR copy the code and create it manually
   
2. **For dashboard.tsx:**
   - Drag the file from `/home/claude/finwise-pages/pages/dashboard.tsx`
   - OR copy the code and create it manually

3. **For login.tsx:**
   - Drag the file from `/home/claude/finwise-pages/pages/login.tsx`
   - OR copy the code and create it manually

4. **For api/chat.ts:**
   - Drag the file from `/home/claude/finwise-pages/pages/api/chat.ts`
   - OR copy the code and create it manually

### Step 4: Commit the Files
1. Scroll down to "Commit changes"
2. Type message: `Add missing pages folder with all components`
3. Click "Commit changes"

**DONE!** ✅

---

## 🔄 What Happens Next

After you commit:
1. Vercel automatically detects the changes (webhook)
2. Vercel automatically starts rebuilding
3. Wait 2-3 minutes
4. Your app should deploy successfully!

---

## 🎯 OPTION B: Create Files Manually in GitHub (If Copy-Paste Easier)

If you prefer not to upload files:

### Step 1: Create _app.tsx
1. Go to your repo
2. Click "Add file" → "Create new file"
3. Name: `pages/_app.tsx`
4. Copy-paste this code:

```typescript
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <Component {...pageProps} />
}
```

5. Click "Commit new file"

### Step 2: Create login.tsx
1. Click "Add file" → "Create new file"
2. Name: `pages/login.tsx`
3. Copy-paste login.tsx code (very long, see file)
4. Commit

### Step 3: Create dashboard.tsx
1. Click "Add file" → "Create new file"
2. Name: `pages/dashboard.tsx`
3. Copy-paste dashboard.tsx code (very long, see file)
4. Commit

### Step 4: Create api/chat.ts
1. Click "Add file" → "Create new file"
2. Name: `pages/api/chat.ts`
3. Copy-paste this code:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, system } = req.body

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' })
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://finwise-ai.app',
        'X-Title': 'FinWise AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content: system,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter error:', error)
      return res.status(response.status).json({ error: 'Failed to get AI response' })
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    return res.status(200).json({ content })
  } catch (error) {
    console.error('Chat API error:', error)
    return res.status(500).json({ error: 'Failed to process chat' })
  }
}
```

4. Commit

---

## ✅ After Upload/Creation

Once all 4 files are in GitHub:

1. Check your Vercel dashboard
2. It should show "Deploying..." 
3. Wait 2-3 minutes
4. Should show "Ready" ✅
5. Get your live URL! 🎉

---

## 📋 File Checklist

Verify these exist in your GitHub repo:

```
✅ pages/_app.tsx
✅ pages/login.tsx
✅ pages/dashboard.tsx
✅ pages/api/chat.ts
```

If all 4 exist → Deployment should work! ✨

---

## 🎯 Quick Action Plan

**Choose ONE:**

**Option A (Easiest):**
- Copy files from `/home/claude/finwise-pages/pages/` to GitHub via upload
- Takes 5 minutes
- Vercel auto-redeploys

**Option B (Manual):**
- Create each file manually in GitHub
- Copy-paste code for each
- Vercel auto-redeploys

**Both lead to the same result!** Choose whichever is easier for you.

---

## 📞 After You Upload

Tell me:
- "Pages folder uploaded to GitHub ✅"
- Or screenshot of GitHub showing the files
- Or screenshot of Vercel redeploying

Then we wait 2-3 minutes and check if it worked! 🚀

---

**Let's get your app live!** 💪
