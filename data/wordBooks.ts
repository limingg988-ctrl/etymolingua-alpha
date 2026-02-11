
import { RESTORED_BACKUP } from './initialData';
import { BUSINESS_WORDS } from './businessWords';
import { TECH_WORDS } from './techWords';
import { WordEntry } from '../types';

// Helper to normalize data structure
const normalize = (data: any[]): any[] => {
  return data.map(item => ({
    ...item,
    // Ensure all required fields exist for safety
    synonyms: item.synonyms || [],
    collocations: item.collocations || [],
    derivatives: item.derivatives || [],
    idioms: item.idioms || [],
    relatedWords: item.relatedWords || [],
    isTrashed: false,
    status: item.status || 'unknown',
  }));
};

export interface WordBook {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  data: any[];
}

export const WORD_BOOKS: WordBook[] = [
  {
    id: 'general',
    title: '一般・教養英単語',
    description: '日常会話からアカデミックな表現まで、語源で覚える基本の単語セット。',
    icon: 'fa-earth-americas',
    color: 'from-blue-500 to-cyan-500',
    data: normalize(RESTORED_BACKUP)
  },
  {
    id: 'business',
    title: 'ビジネス英語',
    description: '会議、交渉、プレゼンで役立つプロフェッショナルな語彙。',
    icon: 'fa-briefcase',
    color: 'from-slate-600 to-slate-800',
    data: normalize(BUSINESS_WORDS)
  },
  {
    id: 'tech',
    title: 'IT・エンジニアリング',
    description: '開発現場や技術文書で頻出する、必須のテクニカルターム。',
    icon: 'fa-microchip',
    color: 'from-violet-500 to-purple-600',
    data: normalize(TECH_WORDS)
  }
];
