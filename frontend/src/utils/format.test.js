import { formatBytes, formatUptime, percent } from './format';
import { wsUrl } from './api';

test('formatBytes picks a readable unit', () => {
  expect(formatBytes(0)).toBe('0 B');
  expect(formatBytes(512)).toBe('512 B');
  expect(formatBytes(1536)).toBe('1.5 KB');
  expect(formatBytes(64 * 1024 * 1024)).toBe('64.0 MB');
  expect(formatBytes(300 * 1024 * 1024)).toBe('300 MB');
  expect(formatBytes(16 * 1024 ** 3)).toBe('16.0 GB');
});

test('formatUptime shows the two largest units', () => {
  expect(formatUptime(0)).toBe('0s');
  expect(formatUptime(42)).toBe('42s');
  expect(formatUptime(125)).toBe('2m');
  expect(formatUptime(3 * 3600 + 120)).toBe('3h 2m');
  expect(formatUptime(2 * 86400 + 5 * 3600)).toBe('2d 5h');
});

test('percent guards against zero', () => {
  expect(percent(1, 4)).toBe(25);
  expect(percent(1, 0)).toBe(0);
});

test('wsUrl follows the page origin', () => {
  expect(wsUrl('/ws/terminal/abc')).toBe('ws://localhost/ws/terminal/abc');
});
