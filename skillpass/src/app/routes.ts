import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import Home, { AdminHome } from './pages/Home';
import TopicPage, { AdminTopicPage } from './pages/TopicPage';
import LessonPage, { AdminLessonPage } from './pages/LessonPage';
import EditorPage from './pages/EditorPage';

function EditorRedirect() {
  return createElement(Navigate, { to: '/admin/editor', replace: true });
}

export const router = createBrowserRouter([
  // Пользовательская версия сайта
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/module/:moduleId/topic/:topicId',
    Component: TopicPage,
  },
  {
    path: '/module/:moduleId/topic/:topicId/lesson/:lessonId',
    Component: LessonPage,
  },

  // Админ-версия сайта
  {
    path: '/admin',
    Component: AdminHome,
  },
  {
    path: '/admin/editor',
    Component: EditorPage,
  },
  {
    path: '/admin/module/:moduleId/topic/:topicId',
    Component: AdminTopicPage,
  },
  {
    path: '/admin/module/:moduleId/topic/:topicId/lesson/:lessonId',
    Component: AdminLessonPage,
  },

  // Старый путь оставлен как редирект, чтобы существующие ссылки не ломались.
  {
    path: '/editor',
    Component: EditorRedirect,
  },
]);
