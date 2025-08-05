export type RootStackParamList = {
  MainScreen: undefined;
  CalendarView: undefined;
  DiaryEntryEditor: { timestamp: string }; // if it expects a timestamp
  DiaryView: undefined;
  MeditationSessionWindow: { sessionId: string }; // if it expects a sessionId
  SessionTimerForm: { id?: string }; // if edit, else undefined
  SettingsMenu: undefined;
  StatisticsPage: undefined;
  // ...any others
};
