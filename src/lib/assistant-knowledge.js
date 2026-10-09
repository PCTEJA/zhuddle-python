// Shared, factual platform guidance. Actions are IDs, never model-supplied selectors or URLs.
export const guideTopics = [
  { id: 'start', title: 'Find my way around', question: 'How do I get started?', text: 'Choose a chapter, read a mission, and write your Python in the editor. Add your name and UNT ID through Your profile before your first check. Run & check shows five checks, and you can retry as often as you like.', action: 'mission', label: 'Show my mission' },
  { id: 'chapters', title: 'Choose a chapter', question: 'How do I switch chapters?', text: 'Use the chapter selector in the course sidebar. On a phone, open the course menu first. Explore Variables, Conditionals, Functions, Loops, Strings, Files, or Lists; each chapter saves its own progress in this browser.', action: 'chapters', label: 'Show chapter selector' },
  { id: 'code', title: 'Run my code', question: 'How do I run and fix my code?', text: 'Write Python in the dark editor, then select Run & check. The output and five checks appear below. Code Coach explains failed checks and marks relevant lines. Edit your code, then run again to update your score. AI suggestions can be mistaken; the Python checks decide your XP.', action: 'editor', label: 'Show code editor' },
  { id: 'progress', title: 'XP & certificates', question: 'How do XP and certificates work?', text: 'Each chapter has 8 coding missions worth 10 XP each and 10 knowledge checks worth 2 XP each: 100 XP in total. Check all 18 current answers to unlock a certificate; a perfect score is not required. Editing an answer means you need to check it again. These are practice certificates, not official UNT credentials.', action: 'results', label: 'Show achievements' },
  { id: 'downloads', title: 'Save my work', question: 'How do I save or download my work?', text: 'Progress saves automatically in this browser. In Achievements, download your notebook, grade report, or unlocked certificate. Export before clearing browser data, switching devices, or starting a new student. There is no account sync between devices.', action: 'downloads', label: 'Show downloads' },
  { id: 'profile', title: 'My learner profile', question: 'Where do I enter my name and UNT ID?', text: 'Select Your profile at the top of the page to add or edit your name and UNT ID. These details personalize your downloads and stay in this browser. The assistant does not receive your profile fields.', action: 'profile', label: 'Show my profile' },
];

export function localGuide(message) {
  const text = message.toLowerCase();
  const id = /download|save|export|sync|device|notebook/.test(text) ? 'downloads'
    : /certificate|badge|score|xp|achievement|grade/.test(text) ? 'progress'
    : /chapter|switch|topic|lesson/.test(text) ? 'chapters'
    : /profile|name|unt|identity/.test(text) ? 'profile'
    : /code|run|error|python|check|editor/.test(text) ? 'code' : 'start';
  const topic = guideTopics.find(item => item.id === id);
  return { message: topic.text, action: topic.action, label: topic.label, provider: 'local' };
}
