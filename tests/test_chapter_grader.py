"""Run with python -m unittest discover -s tests -p 'test_*.py'."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
environment = {}
exec((ROOT / 'public/grader.py').read_text(encoding='utf-8'), environment)
exec((ROOT / 'public/chapter-grader.py').read_text(encoding='utf-8'), environment)
evaluate = environment['_evaluate_chapter']
manifest = json.loads((ROOT / 'public/chapter-checks.json').read_text(encoding='utf-8'))
solutions = json.loads((ROOT / 'tests/solutions.json').read_text(encoding='utf-8'))
chapters = json.loads((ROOT / 'src/data/chapters.json').read_text(encoding='utf-8'))


class CurriculumTests(unittest.TestCase):
    def test_every_chapter_has_the_same_pattern_and_source(self):
        for chapter in chapters:
            qs = chapter['questions']
            self.assertEqual(len(qs), 18)
            self.assertEqual(sum(q['kind'] == 'code' for q in qs), 8)
            self.assertEqual(sum(q['points'] for q in qs), 100)
            self.assertEqual(len(set(q['id'] for q in qs)), 18)
            for q in qs:
                self.assertEqual(q['sourceUrl'], chapter['reading'])
                self.assertTrue(q['source'])
                if q['kind'] == 'mcq':
                    self.assertEqual(len(q['options']), 4)
                    self.assertIn(q['answer'], [o['letter'] for o in q['options']])
                    self.assertTrue(q['explanation'])

    def test_all_48_solutions_pass_all_240_checks(self):
        for chapter, answers in solutions.items():
            for qid, source in answers.items():
                with self.subTest(chapter=chapter, question=qid):
                    result = evaluate(chapter, qid, source, manifest)
                    self.assertEqual(result['earned'], 10, result)
                    self.assertIsNone(result['error'])
                    self.assertEqual(len(result['checks']), 5)

    def test_starters_and_empty_answers_do_not_pass(self):
        for chapter in chapters:
            for q in chapter['questions']:
                if q['kind'] != 'code': continue
                with self.subTest(chapter=chapter['id'], question=q['id']):
                    self.assertLess(evaluate(chapter['id'], q['id'], q['starter'], manifest)['earned'], 10)
                    self.assertLess(evaluate(chapter['id'], q['id'], '', manifest)['earned'], 10)

    def test_wrong_grade_boundary_fails(self):
        source = solutions['conditionals']['C08'].replace('score >= .9', 'score > .9')
        self.assertEqual(evaluate('conditionals', 'C08', source, manifest)['earned'], 8)

    def test_negative_maximum_rejects_zero_initializer(self):
        source = solutions['loops']['C06'].replace('largest = None', 'largest = 0')
        self.assertLess(evaluate('loops', 'C06', source, manifest)['earned'], 10)

    def test_sample_hardcoding_is_not_full_credit(self):
        self.assertLess(evaluate('variables', 'C02', 'original = 17\nn = 18\nprint(n)', manifest)['earned'], 10)

    def test_files_are_reset_on_every_retry_and_chapter(self):
        for _ in range(2):
            for chapter, qid in [('files','C08'),('files','C01'),('lists','C07')]:
                self.assertEqual(evaluate(chapter,qid,solutions[chapter][qid],manifest)['earned'],10)

    def test_unprotected_short_mail_line_is_rejected(self):
        source = solutions['lists']['C08'].replace('len(words) < 2 or ', '')
        self.assertLess(evaluate('lists', 'C08', source, manifest)['earned'], 10)

    def test_bad_syntax_and_runaway_loop_give_feedback(self):
        for source in ['if :', 'while True:\n    pass']:
            result = evaluate('variables', 'C02', source, manifest)
            self.assertEqual(result['earned'],0)
            self.assertTrue(result['error'])

    def test_unknown_chapter_does_not_use_functions_checks(self):
        with self.assertRaises(ValueError): evaluate('missing', 'C01', '', manifest)


if __name__ == '__main__': unittest.main()
