import importlib.util
from pathlib import Path
import unittest

root = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('film_renderer', root/'engine/render.py')
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)

class ServerBoundary(unittest.TestCase):
    def setUp(self):
        self.handler = object.__new__(renderer.Handler)
        self.handler.proj = root

    def test_traversal_is_blocked(self):
        for path in ['/../.env.local', '/%2e%2e/package.json', '/engine/../../package.json', '/engine/%2e%2e/%2e%2e/package.json']:
            with self.subTest(path=path):
                self.assertEqual(Path(self.handler.translate_path(path)).name, '__not_served__')

    def test_private_files_and_directories_are_blocked(self):
        for path in ['/.gitignore', '/engine/render.py', '/assets/', '/engine/']:
            with self.subTest(path=path):
                self.assertEqual(Path(self.handler.translate_path(path)).name, '__not_served__')

    def test_explicit_assets_are_available(self):
        for path in ['/', '/film.js', '/engine/vk.js', '/watch.html', '/renders/opening-v2.mp4']:
            with self.subTest(path=path):
                result = Path(self.handler.translate_path(path))
                self.assertNotEqual(result.name, '__not_served__')
                self.assertTrue(result.is_relative_to(root))

if __name__ == '__main__': unittest.main()
