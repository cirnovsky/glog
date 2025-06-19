import { format as formatDate } from 'date-fns';

export function dating(post: any) {
    let displayDate = 'Unknown date';
    const date = post.frontmatter?.date || post.createdAt;
    if (date) {
      let parsedDate: Date | null = null;
      if (!isNaN(Date.parse(date))) {
        parsedDate = new Date(date);
      } else if (/^\d{8}$/.test(date)) {
        // Convert YYYYMMDD to YYYY-MM-DD
        const isoDate = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
        parsedDate = new Date(isoDate);
      }
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        displayDate = formatDate(parsedDate, 'MMMM d, yyyy');
      }
    }
    return displayDate
}
