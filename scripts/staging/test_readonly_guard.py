"""Offline runner/control-flow regressions; never execute SQL or connect."""
from pathlib import Path
import importlib.util
import re
import sys
import unittest

sys.dont_write_bytecode=True

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('readonly_runner',ROOT/'scripts/staging/inspect-cloud-readonly.py')
runner=importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)  # main is not invoked
SQL=(ROOT/'docs/staging/B2C2C1-readonly-inspection.sql').read_text()


def selected_path(flags):
    """Select psql conditional branches only; no SQL interpretation/execution."""
    states=[]
    output=[]
    for line in SQL.splitlines():
        stripped=line.strip()
        active=all(states)
        if stripped.startswith('\\if :'):
            states.append(flags[stripped[5:]])
        elif stripped=='\\else':
            states[-1]=not states[-1]
        elif stripped=='\\endif':
            states.pop()
        elif active:
            output.append(line)
            if stripped=='\\quit':
                break
    return '\n'.join(output)


class GuardTests(unittest.TestCase):
    def test_native_zero_without_completion_is_failure(self):
        self.assertFalse(runner.classify(0,'B2C2C1_FAILURE_IDENTITY_OR_READONLY\n','')['success'])
        self.assertFalse(runner.classify(0,'B2C2C1_GUARD_PASS\n','')['success'])

    def test_exact_success_proofs_required(self):
        good='B2C2C1_GUARD_PASS\nB2C2C1_INSPECTION_COMPLETE\n'
        self.assertTrue(runner.classify(0,good,'')['success'])
        for code,text,err in [(1,good,''),('TIMEOUT',good,''),(0,good,'warning'),
                              (0,good+'B2C2C1_FAILURE_FINAL_READONLY\n',''),
                              (0,good+good,''),(0,'\n'.join(reversed(good.splitlines())), '')]:
            with self.subTest(code=code,text=text,err=err):
                self.assertFalse(runner.classify(code,text,err)['success'])

    def test_guard_uses_current_transaction_not_default(self):
        guard=SQL[SQL.index('SELECT (current_database()'):SQL.index('\\if :guard_ok')]
        self.assertIn("current_setting('transaction_read_only')='on'",guard)
        self.assertNotIn('default_transaction_read_only',guard)
        self.assertNotRegex(SQL,re.compile(r'^\s*SET\s+(?:SESSION\b|default_transaction_read_only\b)',re.M|re.I))

    def test_success_path_has_one_transaction_through_all_queries(self):
        for history_exists in (False,True):
            text=selected_path(dict(guard_ok=True,presence_shape_ok=True,presence_access_ok=True,
                                    history_exists=history_exists,history_shape_ok=True,final_readonly_ok=True))
            self.assertEqual(len(re.findall(r'^BEGIN TRANSACTION READ ONLY;',text,re.M)),1)
            self.assertEqual(len(re.findall(r'^ROLLBACK;',text,re.M)),1)
            self.assertGreater(text.index('ROLLBACK;'),text.index("AS final_readonly_ok"))
            self.assertLess(text.index('B2C2C1_GUARD_PASS'),text.index('from pg_policies'))
            self.assertNotRegex(text,re.compile(r'^\s*(COMMIT|END\s+TRANSACTION)\b',re.M|re.I))
            self.assertNotRegex(text,re.compile(r'^\\(?:connect|c\b|i\b|ir\b|gexec|!)',re.M))

    def test_guard_failure_cannot_reach_metadata(self):
        text=selected_path(dict(guard_ok=False,presence_shape_ok=True,presence_access_ok=True,
                               history_exists=True,history_shape_ok=True,final_readonly_ok=True))
        self.assertIn('B2C2C1_FAILURE_IDENTITY_OR_READONLY',text)
        self.assertNotIn('from pg_policies',text)
        self.assertNotIn('FROM storage.buckets',text)
        self.assertNotIn('B2C2C1_INSPECTION_COMPLETE',text)
        self.assertTrue(text.endswith('\\quit'))
        self.assertIn('ROLLBACK;',text)

    def test_no_write_statement_or_numeric_quit(self):
        self.assertNotRegex(SQL,re.compile(r'^\s*(?:INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|GRANT|REVOKE|CALL|DO|COPY|VACUUM|ANALYZE|TRUNCATE)\b',re.M|re.I))
        self.assertNotRegex(SQL,re.compile(r'^\\quit[ \t]+\S+',re.M))

    def test_later_failures_rollback_without_completion(self):
        for flag in ('presence_shape_ok','presence_access_ok','history_shape_ok','final_readonly_ok'):
            flags=dict(guard_ok=True,presence_shape_ok=True,presence_access_ok=True,
                       history_exists=True,history_shape_ok=True,final_readonly_ok=True)
            flags[flag]=False
            with self.subTest(flag=flag):
                text=selected_path(flags)
                self.assertEqual(len(re.findall(r'^BEGIN TRANSACTION READ ONLY;',text,re.M)),1)
                self.assertEqual(len(re.findall(r'^ROLLBACK;',text,re.M)),1)
                self.assertIn('B2C2C1_FAILURE_',text)
                self.assertNotIn('B2C2C1_INSPECTION_COMPLETE',text)
                self.assertTrue(text.endswith('\\quit'))


if __name__=='__main__':
    unittest.main()
