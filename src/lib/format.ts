import he from 'he';

/** 去掉 HTML 标签并解码实体, 用于简介等来自第三方源的文本 */
export function stripHtml(input?: string): string {
  if (!input) return '';
  return he.decode(input.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** "2026-11-08 12:00:11" -> "11-08" */
export function shortDate(time?: string): string {
  if (!time) return '';
  const m = time.match(/\d{4}-(\d{2}-\d{2})/);
  return m ? m[1] : '';
}
