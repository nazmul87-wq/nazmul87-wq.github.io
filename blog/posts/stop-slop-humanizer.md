# Two Claude skills that fix how AI writes my emails

I use Claude to draft email. The drafts come out polite and correct, and they sound like a chatbot wrote them. You know the style. The email opens with "I hope this email finds you well," apologizes for existing, and signs off with "Please don't hesitate to reach out."

This week I installed two Claude Code skills to fix that: stop-slop and Humanizer.

## The problem email

Say I ask Claude to move Thursday's meeting with a colleague, and I mention I'm free Friday afternoon or Monday morning. A typical draft looks like this:

> Hi Sarah,
>
> I hope this email finds you well! I wanted to reach out regarding our meeting on Thursday. Unfortunately, due to an unexpected conflict, I will be unable to attend. Would it be possible to reschedule at a time that works best for you? I truly appreciate your understanding and flexibility.
>
> Please don't hesitate to let me know if you have any questions!
>
> Best regards

Sarah needs one fact from that email: you can't make Thursday. She has to read six sentences to find it, and the draft dropped the two times I offered.

## stop-slop writes a cleaner draft

Hardik Pandya wrote stop-slop as a one-page rulebook backed by three reference files. You type `/stop-slop` before Claude writes, and Claude follows the rules as it drafts. The rules ban filler openers, adverbs, passive voice and em dashes. They also forbid the "it's not X, it's Y" line AI uses to sound wise, and they push Claude to name specific things.

After drafting, Claude scores the email from 1 to 10 on directness, rhythm, trust, authenticity and density. Anything under 35 out of 50 gets rewritten.

With stop-slop on, the meeting email shrinks to this:

> Hi Sarah,
>
> I have a conflict Thursday and can't make our meeting. Could we move it to Friday afternoon or Monday morning?
>
> Thanks,
> Nazmul

Sarah gets the news and the ask in two sentences, and she can answer in one line.

## Humanizer edits what you have

Blader's Humanizer works on finished text, such as your own draft or an email ChatGPT wrote for you. It checks for 26 patterns taken from Wikipedia's "Signs of AI writing" guide, starting with the strongest tells.

Paste two or three emails you wrote yourself, and Humanizer matches your voice: your sentence length and the way you open and close. It also refuses to invent facts. A rewrite can't add a name or a date that wasn't in your text, and if a sentence needs a detail Humanizer doesn't have, it asks you.

Say your emails run short and casual, like "hey, running late, start without me." Humanizer keeps both facts and turns the meeting email into:

> hi Sarah, something came up Thursday so I can't make our meeting. would Friday afternoon or Monday morning work?
>
> thanks,
> Nazmul

## My setup

I write new emails with `/stop-slop` and check the score. For emails I care about, I run `/humanizer` last with a few of my real emails pasted in. stop-slop is strict. It bans every adverb, and its drafts can read stiff. Humanizer loosens the wording into normal speech without touching the facts.

## Installing them

Each skill is a set of plain Markdown files, and neither one runs code when you use it. I read every file before installing. To add them to Claude Code, clone each repo into your skills folder:

```bash
git clone https://github.com/blader/humanizer.git ~/.claude/skills/humanizer
git clone https://github.com/hardikpandya/stop-slop.git ~/.claude/skills/stop-slop
```

Claude Code picks them up as `/stop-slop` and `/humanizer`.
