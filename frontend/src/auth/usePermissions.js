import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';

/**
 * 权限管理Hook
 * 提供基于角色的权限检查功能
 */
export const usePermissions = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useTranslation();

  return {
    // 当前用户信息
    user,
    
    // 基础权限检查
    hasPermission,
    
    // 是否为编辑用户
    isEditor: () => hasPermission('editor'),
    
    // 是否为只读用户
    isReader: () => hasPermission('reader'),
    
    // 检查是否可以执行写操作
    canEdit: () => hasPermission('editor'),
    
    // 检查是否可以查看
    canView: () => hasPermission('reader'),
    
    // 权限相关的样式类
    getPermissionClass: (requiredRole = 'reader') => {
      return hasPermission(requiredRole) ? '' : 'permission-disabled';
    },
    
    // 权限相关的按钮属性
    getButtonProps: (requiredRole = 'editor') => ({
      disabled: !hasPermission(requiredRole),
      title: hasPermission(requiredRole)
        ? ''
        : t('auth.permission.needPermission', {
            action: requiredRole === 'editor' ? t('common.edit') : t('auth.permission.view')
          })
    })
  };
};

export default usePermissions;
