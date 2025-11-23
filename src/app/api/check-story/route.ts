import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(req: NextRequest) {
    try {
        const { victim, characters, physicalClues } = await req.json()

        const prompt = `You are a professional murder mystery writer and editor. Analyze the following mystery for coherence, plot holes, inconsistencies, and improvement opportunities.

**THE MURDER:**
Victim: ${victim.name} (${victim.role})
Cause of Death: ${victim.causeOfDeath}
Time: ${victim.timeOfDeath}
Location: ${victim.location}
Backstory: ${victim.backstory}

**CHARACTERS:**
${characters.map((char: any) => `
- ${char.name} (${char.role})
  Backstory: ${char.backstory}
  Secret: ${char.secret_objective}
  Opening Action: ${char.opening_action || 'None'}
  Relationships: ${char.relationships?.map((r: any) => `${r.character}: ${r.relationship}`).join(', ') || 'None'}
  Quirks: ${char.quirks?.join(', ') || 'None'}
`).join('\n')}

**PHYSICAL CLUES:**
${physicalClues?.map((clue: any, idx: number) => `
${idx + 1}. [${clue.timing}] ${clue.description}
   Setup: ${clue.setupInstruction}
   Content: "${clue.content}"
   Related to: ${clue.relatedTo?.join(', ') || 'All'}
`).join('\n') || 'None'}

---

**Please provide:**

1. **Plot Holes**: Any gaps in logic or missing connections
2. **Relationship Conflicts**: Inconsistencies in character relationships
3. **Clue Analysis**: Are clues too obvious/obscure? Do they progress naturally?
4. **Character Balance**: Is one character too central/peripheral?
5. **Social Engineering**: Will this create drama and force interactions?
6. **Improvement Suggestions**: Specific, actionable recommendations

Be constructive but honest. Focus on making the mystery more engaging and interactive.`

        const { text } = await generateText({
            model: openai('gpt-5.1'),
            prompt,
        })

        return NextResponse.json({ analysis: text })
    } catch (error) {
        console.error('Story check error:', error)
        return NextResponse.json(
            { error: 'Failed to analyze story' },
            { status: 500 }
        )
    }
}
