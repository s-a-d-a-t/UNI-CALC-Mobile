import { apiClient } from './client';
import { AcademicProfile, Assignment, Semester, StudyLog, User } from '../types';
import { TokenStorage, LocalCache } from '../lib/storage';

export const AcademicAPI = {
  // Authentication
  async login(email: string, password: string): Promise<User> {
    const res = await apiClient.post('/auth/login', { email, password });
    const { user, token } = res.data;
    if (token) {
      await TokenStorage.saveTokens(token);
    }
    await LocalCache.set('user', user);
    return user;
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    major?: string;
    studentId?: string;
  }): Promise<User> {
    const res = await apiClient.post('/auth/register', userData);
    const { user, token } = res.data;
    if (token) {
      await TokenStorage.saveTokens(token);
    }
    await LocalCache.set('user', user);
    return user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {}
    await TokenStorage.clearTokens();
    await LocalCache.remove('user');
  },

  async getSession(): Promise<User | null> {
    try {
      const res = await apiClient.get('/auth/session');
      if (res.data?.user) {
        await LocalCache.set('user', res.data.user);
        return res.data.user;
      }
    } catch (e) {}
    return await LocalCache.get<User>('user');
  },

  // Profile
  async getProfile(): Promise<AcademicProfile> {
    try {
      const res = await apiClient.get('/profile');
      if (res.data?.profile) {
        await LocalCache.set('profile', res.data.profile);
        return res.data.profile;
      }
    } catch (e) {}
    // Return cached profile if offline
    const cached = await LocalCache.get<AcademicProfile>('profile');
    if (cached) return cached;
    return {
      name: '',
      studentId: '',
      major: '',
      targetCgpa: 3.5,
      graduationCredits: 145,
      coreCreditsRequired: 100,
      electiveCreditsRequired: 45,
    };
  },

  async updateProfile(profileData: Partial<AcademicProfile>): Promise<AcademicProfile> {
    const res = await apiClient.put('/profile', profileData);
    await LocalCache.set('profile', res.data.profile);
    return res.data.profile;
  },

  // Semesters & Courses
  async getSemesters(): Promise<Semester[]> {
    try {
      const res = await apiClient.get('/semesters');
      if (res.data?.semesters) {
        await LocalCache.set('semesters', res.data.semesters);
        return res.data.semesters;
      }
    } catch (e) {}
    // Offline fallback
    const cached = await LocalCache.get<Semester[]>('semesters');
    return cached || [];
  },

  async saveSemesters(semesters: Semester[]): Promise<Semester[]> {
    await LocalCache.set('semesters', semesters);
    try {
      const res = await apiClient.put('/semesters', { semesters });
      return res.data.semesters;
    } catch (e) {
      // Saved to local cache, return as is if offline
      return semesters;
    }
  },

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    try {
      const res = await apiClient.get('/assignments');
      if (res.data?.assignments) {
        await LocalCache.set('assignments', res.data.assignments);
        return res.data.assignments;
      }
    } catch (e) {}
    const cached = await LocalCache.get<Assignment[]>('assignments');
    return cached || [];
  },

  async saveAssignments(assignments: Assignment[]): Promise<Assignment[]> {
    await LocalCache.set('assignments', assignments);
    const res = await apiClient.put('/assignments', { assignments });
    return res.data.assignments;
  },

  // Study Logs
  async getStudyLogs(): Promise<StudyLog[]> {
    try {
      const res = await apiClient.get('/study-logs');
      if (res.data?.studyLogs) {
        await LocalCache.set('studyLogs', res.data.studyLogs);
        return res.data.studyLogs;
      }
    } catch (e) {}
    const cached = await LocalCache.get<StudyLog[]>('studyLogs');
    return cached || [];
  },

  async saveStudyLogs(studyLogs: StudyLog[]): Promise<StudyLog[]> {
    await LocalCache.set('studyLogs', studyLogs);
    const res = await apiClient.put('/study-logs', { studyLogs });
    return res.data.studyLogs;
  },
};
