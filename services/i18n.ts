export type AppLanguage = 'ja' | 'en' | 'zh-CN' | 'ko';

const TEXT = {
  ja: {
    header: {
      dictionary: '辞典',
      list: 'リスト',
      quiz: 'クイズ',
      chat: 'AI会話',
      notebook: 'ノート',
      trash: 'ゴミ箱',
      login: 'ログイン',
      logout: 'ログアウト',
      switchBook: '単語帳を切り替える',
      language: '言語',
    },
    app: {
      loading: '読み込み中...',
      searchPlaceholder: '英単語を入力...',
      search: '検索',
      searchMode: '検索モード:',
      addWord: '「{word}」を単語帳に追加',
      addAll: '表示中の {count} 語をまとめて追加',
      searchFailed: '検索に失敗しました',
      firebaseDenied: '保存に失敗しました（権限不足）。ログイン状態とFirebaseプロジェクト設定を確認してください。',
      loginRequired: '保存にはログインが必要です。ログイン後にもう一度お試しください。',
      saveLoginRequired: '保存にはログインが必要です',
      noWordsImported: 'インポート対象の単語が見つかりませんでした',
    },
    chat: {
      initial: 'こんにちは！AIチューターです。\n\n【この機能の使い方】\n私と英語について会話をした後、右上の「ノートに保存」ボタンを押してください。\n\n会話の内容から、重要単語や文法ポイントをまとめた「あなただけの参考書ページ」を作成して「Smart Note」に保存します。\n\nまずは「単語帳からクイズを出して」や「この単語の類義語は？」など、何でも聞いてください！',
      error: 'すみません、エラーが発生しました。もう一度お試しください。',
      saveDone: '✅ 会話をノートに保存しました！「Smart Note」タブで確認できます。',
      creating: 'ノートを作成中...',
      creatingSub: '会話の要点をまとめています。\nSmart Noteに保存中...',
      saveToNote: 'ノートに保存',
      saveHint: '※会話後に有効になります',
      thinking: 'Thinking',
      inputPlaceholder: '質問を入力（例: この単語で例文を作って / クイズを出して）',
      saveTitle: '会話の内容を要約して保存',
    },
    quiz: {
      lookupWord: 'この単語を調べる',
      lookupHint: 'AI出題の単語を辞典タブで確認します',
      next: '次の問題へ',
      tapToFlip: 'タップして答えを表示',
    },
  },
  en: {
    header: { dictionary: 'Dictionary', list: 'List', quiz: 'Quiz', chat: 'AI Chat', notebook: 'Notes', trash: 'Trash', login: 'Login', logout: 'Logout', switchBook: 'Switch wordbook', language: 'Language' },
    app: {
      loading: 'Loading...', searchPlaceholder: 'Enter English word...', search: 'Search', searchMode: 'Search mode:', addWord: 'Add "{word}" to wordbook', addAll: 'Add all {count} words shown', searchFailed: 'Search failed', firebaseDenied: 'Save failed (permission denied). Please check login state and Firebase project settings.', loginRequired: 'Login is required to save. Please login and try again.', saveLoginRequired: 'Login is required for saving', noWordsImported: 'No words found to import'
    },
    chat: {
      initial: 'Hi! I am your AI tutor.\n\n[How to use]\nAfter chatting with me about English, press the "Save to Note" button at the top-right.\n\nI will summarize key vocabulary and grammar into your personal study note in Smart Note.\n\nTry asking things like "Give me a quiz from my wordbook" or "What are synonyms of this word?"',
      error: 'Sorry, an error occurred. Please try again.', saveDone: '✅ Chat was saved to note! Check the Smart Note tab.', creating: 'Creating note...', creatingSub: 'Summarizing key points from your chat.\nSaving to Smart Note...', saveToNote: 'Save to Note', saveHint: '*Enabled after you chat', thinking: 'Thinking', inputPlaceholder: 'Ask something (e.g. Make a sentence with this word / Give me a quiz)', saveTitle: 'Summarize and save this chat'
    },
    quiz: { lookupWord: 'Look up this word', lookupHint: 'Open this AI-generated word in Dictionary tab', next: 'Next question', tapToFlip: 'Tap to reveal answer' },
  },
  'zh-CN': {
    header: { dictionary: '词典', list: '列表', quiz: '测验', chat: 'AI 对话', notebook: '笔记', trash: '回收站', login: '登录', logout: '退出', switchBook: '切换词书', language: '语言' },
    app: {
      loading: '加载中...', searchPlaceholder: '输入英文单词...', search: '搜索', searchMode: '搜索模式：', addWord: '将“{word}”加入词书', addAll: '将显示的 {count} 个词全部加入', searchFailed: '搜索失败', firebaseDenied: '保存失败（权限不足）。请检查登录状态和 Firebase 项目设置。', loginRequired: '保存需要登录，请登录后重试。', saveLoginRequired: '保存需要登录', noWordsImported: '未找到可导入的单词'
    },
    chat: {
      initial: '你好！我是 AI 导师。\n\n【使用方法】\n先和我聊英语，然后点击右上角“保存到笔记”。\n\n我会把关键单词和语法整理成你的专属学习笔记并保存到 Smart Note。\n\n你可以先问："用我的词书出题" 或 "这个词的近义词是什么？"',
      error: '抱歉，发生错误，请重试。', saveDone: '✅ 对话已保存到笔记！请在 Smart Note 标签查看。', creating: '正在生成笔记...', creatingSub: '正在整理对话重点。\n保存到 Smart Note 中...', saveToNote: '保存到笔记', saveHint: '※对话后可用', thinking: 'Thinking', inputPlaceholder: '输入问题（例如：用这个词造句 / 出个测验）', saveTitle: '总结并保存对话'
    },
    quiz: { lookupWord: '查询这个单词', lookupHint: '在词典标签中查看 AI 出题词汇', next: '下一题', tapToFlip: '点击显示答案' },
  },
  ko: {
    header: { dictionary: '사전', list: '목록', quiz: '퀴즈', chat: 'AI 대화', notebook: '노트', trash: '휴지통', login: '로그인', logout: '로그아웃', switchBook: '단어장 전환', language: '언어' },
    app: {
      loading: '로딩 중...', searchPlaceholder: '영단어를 입력하세요...', search: '검색', searchMode: '검색 모드:', addWord: '"{word}"를 단어장에 추가', addAll: '표시된 {count}개 단어 모두 추가', searchFailed: '검색에 실패했습니다', firebaseDenied: '저장에 실패했습니다(권한 부족). 로그인 상태와 Firebase 프로젝트 설정을 확인하세요.', loginRequired: '저장하려면 로그인이 필요합니다. 로그인 후 다시 시도해 주세요.', saveLoginRequired: '저장하려면 로그인이 필요합니다', noWordsImported: '가져올 단어를 찾지 못했습니다'
    },
    chat: {
      initial: '안녕하세요! AI 튜터입니다.\n\n[사용 방법]\n영어에 대해 대화한 뒤, 오른쪽 위의 "노트로 저장" 버튼을 누르세요.\n\n대화 내용에서 핵심 단어와 문법을 정리해 Smart Note에 저장해 드립니다.\n\n"내 단어장으로 퀴즈 내줘" 또는 "이 단어의 유의어는?"처럼 편하게 물어보세요!',
      error: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.', saveDone: '✅ 대화를 노트로 저장했습니다! Smart Note 탭에서 확인하세요.', creating: '노트 생성 중...', creatingSub: '대화 핵심을 정리하고 있습니다.\nSmart Note에 저장 중...', saveToNote: '노트로 저장', saveHint: '※ 대화 후 활성화됩니다', thinking: 'Thinking', inputPlaceholder: '질문을 입력하세요 (예: 이 단어로 예문 만들어줘 / 퀴즈 내줘)', saveTitle: '대화를 요약해 저장'
    },
    quiz: { lookupWord: '이 단어 검색', lookupHint: 'AI 출제 단어를 사전 탭에서 확인', next: '다음 문제', tapToFlip: '탭해서 정답 보기' },
  },
} as const;

export const t = (lang: AppLanguage, key: string, vars?: Record<string, string | number>) => {
  const parts = key.split('.');
  const fallback = TEXT.en as any;
  let value: any = TEXT[lang] as any;

  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value !== 'string') {
    value = parts.reduce((acc: any, part) => acc?.[part], fallback);
  }
  if (typeof value !== 'string') return key;

  if (!vars) return value;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    value,
  );
};

export const getLanguageLabel = (lang: AppLanguage) => {
  if (lang === 'ja') return '日本語';
  if (lang === 'en') return 'English';
  if (lang === 'zh-CN') return '中文';
  return '한국어';
};

export const getLanguageInstruction = (lang: AppLanguage) => {
  if (lang === 'ja') return 'Respond in Japanese.';
  if (lang === 'zh-CN') return 'Respond in Simplified Chinese.';
  if (lang === 'ko') return 'Respond in Korean.';
  return 'Respond in English.';
};
