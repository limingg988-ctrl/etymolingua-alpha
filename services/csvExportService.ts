import { WordEntry, BookMetadata } from '../types';

// Helper for safe JSON stringification that handles circular references
const safeStringify = (obj: any) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return; // Remove circular reference
      }
      seen.add(value);
    }
    return value;
  }, 2);
};

export const exportToCSV = (history: WordEntry[]) => {
  // Define headers for the CSV
  const headers = [
    'Status', 
    'Word', 
    'Meaning', 
    'Pronunciation', 
    'Etymology', 
    'Mnemonic', 
    'Logic', 
    'Example Sentence', 
    'Example Translation', 
    'Added Date'
  ];

  // Map history data to rows
  const rows = history.map(item => [
    item.status, // Add status value (unknown, learning, mastered)
    item.word,
    item.meaning,
    item.pronunciation,
    item.etymology,
    item.mnemonic,
    item.logic,
    item.exampleSentence,
    item.exampleSentenceTranslation,
    new Date(item.timestamp).toLocaleDateString()
  ]);

  // Combine headers and rows, escaping quotes
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const stringCell = cell ? String(cell) : '';
        // Escape double quotes by doubling them, and wrap cell in quotes
        return `"${stringCell.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  // Create a Blob with BOM (Byte Order Mark) so Excel opens it correctly with UTF-8
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });

  // Create download link and trigger click
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `etymolingua_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (history: WordEntry[]) => {
  const jsonContent = safeStringify(history);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `etymolingua_book_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 新機能: 全てのデータ（Book情報 + 単語データ）を完全バックアップ
export const exportFullBackup = (books: BookMetadata[], words: WordEntry[]) => {
  const backupData = {
    version: 2,
    timestamp: Date.now(),
    type: 'full_backup',
    books: books,
    words: words
  };
  
  const jsonContent = safeStringify(backupData);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `etymolingua_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
