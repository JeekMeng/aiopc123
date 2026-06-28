import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './middleware';
import { register, login, logout, changePassword, getMe } from './auth';
import { list as listBookmarks, create as createBookmark, update as updateBookmark, remove as removeBookmark } from './bookmarks';
import { list as listComments, create as createComment, remove as removeComment } from './comments';
import { requireAdmin } from './admin-middleware';
import { setupAdmin, listUsers, updateRole, deleteUser, listAllComments, deleteComment, listAllSubmissions, updateSubmissionStatus, deleteSubmission } from './admin';
import { create as createSubmission } from './submissions';
import { listPolicies, getPolicy, getPolicyStats } from './policies';
import { adminListPolicies, adminCreatePolicy, adminUpdatePolicy, adminDeletePolicy, adminImportPolicies, adminExportPolicies } from './admin-policies';

const app = new Hono<{ Bindings: Env; Variables: { userId: number } }>();

app.use('/api/*', cors({
  origin: ['https://www.aiopc123.com', 'https://aiopc123.pages.dev', 'http://localhost:1313', 'http://localhost:8787'],
  credentials: true,
  allowHeaders: ['Content-Type', 'X-Auth-User-Id'],
}));

app.get('/api/health', (c) => c.json({ status: 'ok' }));

const auth = new Hono();
auth.post('/register', register);
auth.post('/login', login);
auth.post('/logout', logout);
auth.post('/change-password', changePassword);
auth.get('/me', getMe);
app.route('/api/auth', auth);

const bookmarks = new Hono();
bookmarks.get('/', requireAuth, listBookmarks);
bookmarks.post('/', requireAuth, createBookmark);
bookmarks.put('/:id', requireAuth, updateBookmark);
bookmarks.delete('/:id', requireAuth, removeBookmark);
app.route('/api/bookmarks', bookmarks);

const comments = new Hono();
comments.get('/', listComments);
comments.post('/', requireAuth, createComment);
comments.delete('/:id', requireAuth, removeComment);
app.route('/api/comments', comments);

const submissions = new Hono();
submissions.post('/', createSubmission);
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
app.route('/api/admin/policies', adminPolicies);

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
