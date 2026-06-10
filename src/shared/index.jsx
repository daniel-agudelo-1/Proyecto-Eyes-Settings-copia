// ==================== COMPONENTES ====================

// Base
export { default as BaseInputField }   from './components/base/BaseInputField';
export { default as BaseFormLayout }   from './components/base/BaseFormLayout';
export { default as BaseFormSection }  from './components/base/BaseFormSection';
export { default as BaseFormField}     from './components/base/BaseFormField';
export { default as BaseViewField }    from './components/base/BaseViewField';
export { default as BaseFormActions }  from './components/base/BaseFormActions';
export { default as FormCol }          from './components/base/FormCol';
export { default as FormRow }          from './components/base/FormRow';
export { default as TextFieldLetters } from './components/base/TextFieldLetters';
export { default as TextFieldNumbers } from './components/base/TextFieldNumbers';
export { default as TextFieldAlphanumeric } from './components/base/TextFieldAlphanumeric';
export { default as TextFieldNoEmoji } from './components/base/TextFieldNoEmoji';
// Crud
export { default as CrudForm }         from './components/crud/CrudForm';
export { default as CrudTable }        from './components/crud/CrudTable';
export { default as CrudLayout }       from './components/crud/CrudLayout';
export { default as CrudPagination }   from './components/crud/CrudPagination';

// UI
export { default as Loading }          from './components/ui/Loading';
export { default as Modal }            from './components/ui/Modal';
export { default as CrudActions }      from './components/ui/CrudActions';

// Layouts
export { default as AppHeader }              from './components/layouts/AppHeader';
export { default as OpticaDashboardLayout }  from './components/layouts/OpticaDashboardLayout';
export { default as Sidebar }                from './components/layouts/Sidebar';

// Rutas protegidas
export { default as ProtectedRoute }   from './components/ProtectedRoute';

// ==================== CONSTANTES ====================

export * from './constants/menuStructure';
export * from './constants/permisos';
export * from './constants/roles';

// ==================== HOOKS ====================

export * from './hooks/useCrud';
export * from './hooks/useSidebar';
export {useActionBlocker} from'./hooks/useActionBlocker'

// ==================== UTILS ====================

export * from './utils/formatCOP';
export * from './utils/formatters';