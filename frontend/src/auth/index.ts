/**
 * 认证模块统一导出
 * 
 * 提供所有认证相关的组件、Hooks 和类型
 */

// 导出组件
export { AuthProvider } from './AuthContext';
export { default as AuthContext } from './AuthContext';
export { default as LoginPage } from './LoginPage';
export { default as ProtectedRoute } from './ProtectedRoute';

// 导出 Hooks
export { useAuth } from './useAuth';
export { usePermissions } from './usePermissions';

// 导出类型
export type {
  User,
  LoginResponse,
  GetCurrentUserResponse,
  TokenManager,
  UserManager,
  AuthAPI,
} from './auth';

export type {
  AuthContextState,
  LoginResult,
  AuthContextValue,
} from './useAuth.d';

export type { UsePermissionsReturn } from './usePermissions';

// 导出认证工具（从 auth.js）
export { tokenManager, userManager, authAPI, isAuthenticated, hasRole } from './auth';

/**
 * 使用示例:
 * 
 * @example 在应用入口使用 AuthProvider
 * ```tsx
 * import { AuthProvider } from '@/auth';
 * 
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes>...</Routes>
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 * ```
 * 
 * @example 使用 useAuth Hook
 * ```tsx
 * import { useAuth } from '@/auth';
 * 
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please login</div>;
 *   }
 *   
 *   return <div>Welcome, {user?.username}!</div>;
 * }
 * ```
 * 
 * @example 使用 usePermissions Hook
 * ```tsx
 * import { usePermissions } from '@/auth';
 * 
 * function EditButton() {
 *   const { canEdit, getButtonProps } = usePermissions();
 *   
 *   return (
 *     <Button {...getButtonProps('editor')}>
 *       Edit
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @example 使用 ProtectedRoute 保护路由
 * ```tsx
 * import { ProtectedRoute } from '@/auth';
 * 
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   }
 * />
 * 
 * // 需要编辑权限
 * <Route
 *   path="/edit"
 *   element={
 *     <ProtectedRoute requireRole="editor">
 *       <EditPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
