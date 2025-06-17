import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useNotify } from './notification-store';

export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  isDirty: boolean;
  isSubmitted: boolean;
  validationErrors: Record<string, string>;
}

export interface FormStoreState {
  forms: Record<string, FormState>;
  
  // Core form actions
  initializeForm: (formId: string) => void;
  setLoading: (formId: string, loading: boolean) => void;
  setError: (formId: string, error: string | null) => void;
  setSuccess: (formId: string, success: string | null) => void;
  setDirty: (formId: string, dirty: boolean) => void;
  setSubmitted: (formId: string, submitted: boolean) => void;
  setValidationErrors: (formId: string, errors: Record<string, string>) => void;
  setValidationError: (formId: string, field: string, error: string | null) => void;
  
  // Compound actions
  startSubmit: (formId: string) => void;
  submitSuccess: (formId: string, message?: string) => void;
  submitError: (formId: string, error: string | Error) => void;
  resetForm: (formId: string) => void;
  clearForm: (formId: string) => void;
  
  // Validation helpers
  validateField: (formId: string, field: string, value: unknown, rules: ValidationRule[]) => boolean;
  validateForm: (formId: string, values: Record<string, unknown>, rules: Record<string, ValidationRule[]>) => boolean;
  
  // Selectors
  getFormState: (formId: string) => FormState;
  isFormValid: (formId: string) => boolean;
  hasFormErrors: (formId: string) => boolean;
}

export type ValidationRule = 
  | { type: 'required'; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'minLength'; length: number; message?: string }
  | { type: 'maxLength'; length: number; message?: string }
  | { type: 'pattern'; pattern: RegExp; message?: string }
  | { type: 'custom'; validate: (value: unknown) => boolean | string; message?: string };

const defaultFormState: FormState = {
  isLoading: false,
  error: null,
  success: null,
  isDirty: false,
  isSubmitted: false,
  validationErrors: {},
};

const validateValue = (value: unknown, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message || 'This field is required';
        }
        break;
        
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return rule.message || 'Please enter a valid email address';
        }
        break;
        
      case 'minLength':
        if (value && value.length < rule.length) {
          return rule.message || `Minimum length is ${rule.length} characters`;
        }
        break;
        
      case 'maxLength':
        if (value && value.length > rule.length) {
          return rule.message || `Maximum length is ${rule.length} characters`;
        }
        break;
        
      case 'pattern':
        if (value && !rule.pattern.test(value)) {
          return rule.message || 'Invalid format';
        }
        break;
        
      case 'custom':
        if (value) {
          const result = rule.validate(value);
          if (result === false) {
            return rule.message || 'Invalid value';
          }
          if (typeof result === 'string') {
            return result;
          }
        }
        break;
    }
  }
  return null;
};

export const useFormStore = create<FormStoreState>()(
  immer((set, get) => ({
    forms: {},

    // Initialize form
    initializeForm: (formId) => {
      set((state) => {
        if (!state.forms[formId]) {
          state.forms[formId] = { ...defaultFormState };
        }
      });
    },

    // Basic setters
    setLoading: (formId, loading) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        state.forms[formId].isLoading = loading;
      });
    },

    setError: (formId, error) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        state.forms[formId].error = error;
      });
    },

    setSuccess: (formId, success) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        state.forms[formId].success = success;
      });
    },

    setDirty: (formId, dirty) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        state.forms[formId].isDirty = dirty;
      });
    },

    setSubmitted: (formId, submitted) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        state.forms[formId].isSubmitted = submitted;
      });
    },

    setValidationErrors: (formId, errors) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        state.forms[formId].validationErrors = errors;
      });
    },

    setValidationError: (formId, field, error) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        if (error) {
          state.forms[formId].validationErrors[field] = error;
        } else {
          delete state.forms[formId].validationErrors[field];
        }
      });
    },

    // Compound actions
    startSubmit: (formId) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        const form = state.forms[formId];
        form.isLoading = true;
        form.error = null;
        form.success = null;
        form.isSubmitted = true;
      });
    },

    submitSuccess: (formId, message) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        const form = state.forms[formId];
        form.isLoading = false;
        form.error = null;
        form.success = message || 'Form submitted successfully';
        form.isDirty = false;
      });
    },

    submitError: (formId, error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        const form = state.forms[formId];
        form.isLoading = false;
        form.error = errorMessage;
        form.success = null;
      });
    },

    resetForm: (formId) => {
      set((state) => {
        if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
        const form = state.forms[formId];
        form.isLoading = false;
        form.error = null;
        form.success = null;
        form.isDirty = false;
        form.isSubmitted = false;
        form.validationErrors = {};
      });
    },

    clearForm: (formId) => {
      set((state) => {
        delete state.forms[formId];
      });
    },

    // Validation
    validateField: (formId, field, value, rules) => {
      const error = validateValue(value, rules);
      get().setValidationError(formId, field, error);
      return !error;
    },

    validateForm: (formId, values, rules) => {
      const errors: Record<string, string> = {};
      let isValid = true;

      Object.entries(rules).forEach(([field, fieldRules]) => {
        const error = validateValue(values[field], fieldRules);
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      });

      get().setValidationErrors(formId, errors);
      return isValid;
    },

    // Selectors
    getFormState: (formId) => {
      return get().forms[formId] || { ...defaultFormState };
    },

    isFormValid: (formId) => {
      const form = get().forms[formId];
      return form ? Object.keys(form.validationErrors).length === 0 : true;
    },

    hasFormErrors: (formId) => {
      const form = get().forms[formId];
      return form ? (!!form.error || Object.keys(form.validationErrors).length > 0) : false;
    },
  }))
);

// Custom hook for form management
export const useForm = (formId: string) => {
  const {
    initializeForm,
    setLoading,
    setError,
    setSuccess,
    setDirty,
    setSubmitted,
    setValidationError,
    startSubmit,
    submitSuccess,
    submitError,
    resetForm,
    validateField,
    validateForm,
    getFormState,
    isFormValid,
    hasFormErrors,
  } = useFormStore();

  // Initialize form on first use
  if (Object.keys(useFormStore.getState().forms).length === 0 || !useFormStore.getState().forms[formId]) {
    initializeForm(formId);
  }

  const notify = useNotify();

  const handleSubmit = async <T>(
    submitFn: () => Promise<T>,
    options: {
      successMessage?: string;
      showNotifications?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { successMessage, showNotifications = true } = options;

    startSubmit(formId);

    try {
      const result = await submitFn();
      
      const message = successMessage || 'Form submitted successfully';
      submitSuccess(formId, message);
      
      if (showNotifications) {
        notify.success(message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      submitError(formId, errorMessage);
      
      if (showNotifications) {
        notify.error('Submission Failed', errorMessage);
      }
      
      return null;
    }
  };

  return {
    form: getFormState(formId),
    setLoading: (loading: boolean) => setLoading(formId, loading),
    setError: (error: string | null) => setError(formId, error),
    setSuccess: (success: string | null) => setSuccess(formId, success),
    setDirty: (dirty: boolean) => setDirty(formId, dirty),
    setSubmitted: (submitted: boolean) => setSubmitted(formId, submitted),
    setValidationError: (field: string, error: string | null) => setValidationError(formId, field, error),
    validateField: (field: string, value: unknown, rules: ValidationRule[]) => validateField(formId, field, value, rules),
    validateForm: (values: Record<string, unknown>, rules: Record<string, ValidationRule[]>) => validateForm(formId, values, rules),
    resetForm: () => resetForm(formId),
    handleSubmit,
    isValid: isFormValid(formId),
    hasErrors: hasFormErrors(formId),
  };
};