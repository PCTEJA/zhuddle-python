import additions from './chapters.json';
import questions from './questions.json';

export const functionsChapter = {
  id: 'functions', number: '04', title: 'Functions', fullTitle: 'Functions',
  source: 'https://www.py4e.com/html3/04-functions',
  reading: 'https://www.py4e.com/html3/04-functions',
  notebook: '/ZHUDDLE_Functions_Quest.ipynb', questions,
};
export const chapters = [...additions, functionsChapter].sort((a, b) => a.number.localeCompare(b.number));
export const chapterKey = chapter => `zhuddle-${chapter.id}-v1`;
export const PROFILE_KEY = 'zhuddle-student-v1';
export const ACTIVE_CHAPTER_KEY = 'zhuddle-active-chapter';
