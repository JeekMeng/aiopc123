import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './middleware';
import { register, login, logout, changePassword, getMe, forgotPassword, resetPassword, getProfile, updateProfile } from './auth';
import { list as listBookmarks, create as createBookmark, update as updateBookmark, remove as removeBookmark } from './bookmarks';
import { list as listComments, create as createComment, remove as removeComment } from './comments';
import { requireAdmin } from './admin-middleware';
import { setupAdmin, listUsers, updateRole, deleteUser, listAllComments, deleteComment, listAllSubmissions, updateSubmissionStatus, deleteSubmission, listAllBookmarks, adminDeleteBookmark, listAllOpcs, adminDeleteOpc, setUserVipLevel } from './admin';
import { create as createSubmission, querySubmission } from './submissions';
import { list as listOpcs, getOne as getOpc, create as createOpc, update as updateOpc, remove as removeOpc, setDefault as setDefaultOpc } from './opc';
import { list as listProducts, create as createProduct, update as updateProduct, remove as removeProduct } from './opc-products';
import { list as listDepartments, create as createDepartment, update as updateDepartment, remove as removeDepartment, addTool as addDeptTool, removeTool as removeDeptTool, replaceTools as replaceDeptTools, reorder as reorderDepartments } from './opc-departments';
import { list as listTodos, create as createTodo, update as updateTodo, remove as removeTodo } from './opc-todos';
import { list as listNotices, create as createNotice, markRead as markNoticeRead, markAllRead as markAllNoticeRead, remove as removeNotice } from './opc-notices';
import { listPolicies, getPolicy, getPolicyStats } from './policies';
import { adminListPolicies, adminGetPolicy, adminCreatePolicy, adminUpdatePolicy, adminDeletePolicy, adminImportPolicies, adminExportPolicies } from './admin-policies';
import { listPublic as listPublicTemplates, listAdmin as listAdminTemplates, create as createTemplate, update as updateTemplate, remove as removeTemplate, shareTemplate } from './opc-templates';
import { uploadLogo } from './upload';
import { syncSites, listSites, listLogos } from './nav-sites';
import { signIn, getPoints, getPointLogs, addPoints, deductPoints } from './points';
import { aiChat, aiChatStream } from './ai-chat';
import { listNotifications, markRead, markAllRead, removeNotification, generateNotifications } from './user-notifications';

const app = new Hono<{ Bindings: Env; Variables: { userId: number } }>();

app.use('/api/*', cors({
  origin: ['https://www.aiopc123.com', 'https://aiopc123.pages.dev', 'http://localhost:1313', 'http://localhost:1317', 'http://localhost:8787'],
  credentials: true,
  allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'X-Auth-User-Id'],
}));

app.get('/api/health', (c) => c.json({ status: 'ok' }));

const auth = new Hono();
auth.post('/register', register);
auth.post('/login', login);
auth.post('/logout', logout);
auth.post('/change-password', changePassword);
auth.post('/forgot-password', forgotPassword);
auth.post('/reset-password', resetPassword);
auth.get('/me', getMe);
auth.get('/profile', requireAuth, getProfile);
auth.patch('/profile', requireAuth, updateProfile);
app.route('/api/auth', auth);

app.post('/api/user/sign-in', requireAuth, signIn);
app.get('/api/user/points', requireAuth, getPoints);
app.get('/api/user/point-logs', requireAuth, getPointLogs);
app.post('/api/user/points/add', requireAuth, addPoints);
app.post('/api/user/points/deduct', requireAuth, deductPoints);

app.get('/api/user/notifications', requireAuth, listNotifications);
app.patch('/api/user/notifications/read-all', requireAuth, markAllRead);
app.patch('/api/user/notifications/:id/read', requireAuth, markRead);
app.delete('/api/user/notifications/:id', requireAuth, removeNotification);
app.post('/api/user/notifications/generate', requireAuth, async (c) => {
  const userId = c.get('userId') as number;
  await generateNotifications(c, userId);
  return c.json({ message: '已生成' });
});

app.post('/api/ai/chat', requireAuth, aiChat);
app.post('/api/ai/chat/stream', requireAuth, aiChatStream);

const bookmarks = new Hono();
bookmarks.get('/', requireAuth, listBookmarks);
bookmarks.post('/', requireAuth, createBookmark);
bookmarks.put('/:id', requireAuth, updateBookmark);
bookmarks.delete('/:id', requireAuth, removeBookmark);
app.route('/api/bookmarks', bookmarks);

app.get('/api/opc', requireAuth, listOpcs);
app.get('/api/opc/', requireAuth, listOpcs);
app.get('/api/opc/:id', requireAuth, getOpc);
app.post('/api/opc', requireAuth, createOpc);
app.post('/api/opc/', requireAuth, createOpc);
app.put('/api/opc/:id', requireAuth, updateOpc);
app.delete('/api/opc/:id', requireAuth, removeOpc);
app.patch('/api/opc/:id/default', requireAuth, setDefaultOpc);
app.get('/api/opc/:opcId/products', requireAuth, listProducts);
app.post('/api/opc/:opcId/products', requireAuth, createProduct);
app.put('/api/opc/:opcId/products/:id', requireAuth, updateProduct);
app.delete('/api/opc/:opcId/products/:id', requireAuth, removeProduct);
app.get('/api/opc/:opcId/departments', requireAuth, listDepartments);
app.patch('/api/opc/:opcId/departments/reorder', requireAuth, reorderDepartments);
app.post('/api/opc/:opcId/departments', requireAuth, createDepartment);
app.put('/api/opc/:opcId/departments/:id', requireAuth, updateDepartment);
app.delete('/api/opc/:opcId/departments/:id', requireAuth, removeDepartment);
app.post('/api/opc/:opcId/departments/:deptId/tools', requireAuth, addDeptTool);
app.delete('/api/opc/:opcId/departments/:deptId/tools/:toolIndex', requireAuth, removeDeptTool);
app.put('/api/opc/:opcId/departments/:deptId/tools', requireAuth, replaceDeptTools);
app.get('/api/opc/:opcId/todos', requireAuth, listTodos);
app.post('/api/opc/:opcId/todos', requireAuth, createTodo);
app.put('/api/opc/:opcId/todos/:id', requireAuth, updateTodo);
app.delete('/api/opc/:opcId/todos/:id', requireAuth, removeTodo);
app.get('/api/opc/:opcId/notices', requireAuth, listNotices);
app.post('/api/opc/:opcId/notices', requireAuth, createNotice);
app.patch('/api/opc/:opcId/notices/:id/read', requireAuth, markNoticeRead);
app.patch('/api/opc/:opcId/notices/read-all', requireAuth, markAllNoticeRead);
app.delete('/api/opc/:opcId/notices/:id', requireAuth, removeNotice);

app.post('/api/upload/logo', requireAuth, uploadLogo);

const comments = new Hono();
comments.get('/', listComments);
comments.post('/', requireAuth, createComment);
comments.delete('/:id', requireAuth, removeComment);
app.route('/api/comments', comments);

const submissions = new Hono();
submissions.post('/', createSubmission);
submissions.get('/query', querySubmission);
app.route('/api/submissions', submissions);

const admin = new Hono();
admin.post('/setup', setupAdmin);
admin.get('/users', requireAdmin, listUsers);
admin.patch('/users/:id/role', requireAdmin, updateRole);
admin.delete('/users/:id', requireAdmin, deleteUser);
admin.get('/comments', requireAdmin, listAllComments);
admin.delete('/comments/:id', requireAdmin, deleteComment);
admin.get('/submissions', requireAdmin, listAllSubmissions);
admin.patch('/submissions/:id/status', requireAdmin, updateSubmissionStatus);
admin.delete('/submissions/:id', requireAdmin, deleteSubmission);
admin.get('/bookmarks', requireAdmin, listAllBookmarks);
admin.delete('/bookmarks/:id', requireAdmin, adminDeleteBookmark);
admin.get('/opcs', requireAdmin, listAllOpcs);
admin.delete('/opcs/:id', requireAdmin, adminDeleteOpc);
admin.patch('/users/:id/vip', requireAdmin, setUserVipLevel);
app.route('/api/admin', admin);

const policies = new Hono();
policies.get('/', listPolicies);
policies.get('/stats', getPolicyStats);
policies.get('/:id', getPolicy);
app.route('/api/policies', policies);

const adminPolicies = new Hono();
adminPolicies.get('/', requireAdmin, adminListPolicies);
adminPolicies.post('/', requireAdmin, adminCreatePolicy);
adminPolicies.put('/:id', requireAdmin, adminUpdatePolicy);
adminPolicies.delete('/:id', requireAdmin, adminDeletePolicy);
adminPolicies.post('/import', requireAdmin, adminImportPolicies);
adminPolicies.get('/export', requireAdmin, adminExportPolicies);
adminPolicies.get('/:id', requireAdmin, adminGetPolicy);
app.route('/api/admin/policies', adminPolicies);

app.get('/api/templates', listPublicTemplates);
app.get('/api/nav-sites', listSites);
app.get('/api/nav-sites/logos', listLogos);
app.post('/api/opc/:id/share-template', requireAuth, shareTemplate);
app.post('/api/admin/sync-sites', requireAdmin, syncSites);
app.get('/api/admin/templates', requireAdmin, listAdminTemplates);
app.post('/api/admin/templates', requireAdmin, createTemplate);
app.put('/api/admin/templates/:id', requireAdmin, updateTemplate);
app.delete('/api/admin/templates/:id', requireAdmin, removeTemplate);

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
