
# Infi Project - Core Framework Documentation

Tài liệu này chứa **Mã nguồn nền tảng (Core Source Code)** của dự án. Đây là bộ khung sườn có thể tái sử dụng cho bất kỳ ứng dụng quản lý nào (CRM, CMS, Task Management, v.v...) sử dụng React + Supabase.

Để tạo một dự án mới, hãy sao chép các file trong phần **Core** dưới đây, sau đó chỉ cần thay thế phần **Business Logic**.

---

## 📚 MỤC LỤC

1.  **Cấu hình dự án (Configuration)**: Thiết lập môi trường Build.
2.  **Kết nối & Xác thực (Connection & Auth)**: Supabase Client và Auth Hook.
3.  **Tiện ích cốt lõi (Core Hooks)**: Quản lý Cache, LocalStorage, Timer.
4.  **Hệ thống giao diện (UI System)**: Context, Themes, Toasts.
5.  **Components cơ sở (Base Components)**: Modal, Form, Auth UI.
6.  **Hướng dẫn mở rộng (Extension Guide)**: Cách thay thế chức năng chính.
7.  **Cơ sở dữ liệu (Database)**: Cấu trúc bảng SQL.

---

## 7. CƠ SỞ DỮ LIỆU (DATABASE)

Dưới đây là SQL để tạo các bảng cần thiết trong Supabase SQL Editor.

### Migration: Thêm cột `created_at` vào bảng Groups (Nếu bảng đã tồn tại)
Nếu bạn đã có bảng `channel_groups` nhưng thiếu cột ngày tạo, hãy chạy lệnh này:

```sql
ALTER TABLE public.channel_groups 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
```

### Full Schema: Tạo bảng Channel Groups hoàn chỉnh
```sql
create table if not exists public.channel_groups (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  channel_ids text[] default array[]::text[],
  created_at timestamptz default now(),
  primary key (id)
);
alter table public.channel_groups enable row level security;
create policy "Users can manage own groups" on channel_groups for all using (auth.uid() = user_id);
```

### Full Schema: Tạo bảng Movies hoàn chỉnh
```sql
create table if not exists public.movies (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'Playlist',
  note text default '',
  added_at timestamptz default now(),
  channel_3d_ids text[] default array[]::text[],
  channel_2d_ids text[] default array[]::text[],
  primary key (id)
);
alter table public.movies enable row level security;
create policy "Users can manage own movies" on movies for all using (auth.uid() = user_id);
```

---

## 1. CẤU HÌNH DỰ ÁN (CONFIGURATION)

### `vite.config.ts`
Cấu hình alias `@` để import gọn gàng.

```typescript
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './'),
    },
  },
});
```

### `tsconfig.json`
Thiết lập TypeScript chuẩn cho React.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["."],
  "exclude": ["node_modules", "vite.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 2. KẾT NỐI & XÁC THỰC (CONNECTION & AUTH)

### `lib/supabase.ts`
Khởi tạo kết nối đến Backend. *Lưu ý: Thay thế URL/KEY khi đổi dự án.*

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = 'https://yhnqwxejjkfgmjmiquhb.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlobnF3eGVqamtmZ21qbWlxdWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjMxOTIsImV4cCI6MjA3ODU5OTE5Mn0.U_h3961ZbbF_udT4M2fyJsMpvk8f0bJaOvMo5Mr6O5s';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn("Supabase is not configured.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### `hooks/useSupabaseAuth.ts`
Hook quản lý phiên đăng nhập, tự động đồng bộ trạng thái User.

```typescript
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) { setLoading(false); return; }
        
        // Lấy session hiện tại
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Lắng nghe thay đổi auth (đăng nhập/đăng xuất/hết hạn)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
    };

    return { session, loading, handleSignOut };
};
```

---

## 3. TIỆN ÍCH CỐT LÕI (CORE HOOKS)

### `hooks/useLocalStorage.ts`
Lưu trữ trạng thái vào browser storage (Theme, Settings, Cache).

```typescript
import React, { useState, useCallback, useEffect } from 'react';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) { console.error(error); }
  }, [key]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) { console.error(error); }
  }, [key]);
  
  return [storedValue, setValue];
}
```

### `hooks/useCachedSupabaseQuery.ts`
**Quan trọng:** Hook này giúp ứng dụng chạy mượt mà bằng cách cache dữ liệu API, tự động refresh khi có thay đổi Realtime.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { DataChange } from '../App';

interface CacheEntry<T> { data: T; timestamp: number; }
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useCachedSupabaseQuery<T>({
  cacheKey, query, dependencies = [], lastDataChange,
}: {
  cacheKey: string;
  query: () => Promise<{ data: T | null; error: any }>;
  dependencies?: any[];
  lastDataChange: DataChange | null;
}) {
  const [cachedData, setCachedData] = useLocalStorage<CacheEntry<T> | null>(cacheKey, null);
  const [data, setData] = useState<T | null>(cachedData?.data ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) setLoading(true);
    setError(null);
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempts < maxAttempts && !success) {
      try {
        const { data: freshData, error: queryError } = await query();
        if (queryError) throw queryError;
        setData(freshData as T);
        setCachedData({ data: freshData as T, timestamp: Date.now() });
        success = true;
      } catch (err: any) {
        attempts++;
        if (attempts >= maxAttempts) setError(err);
        else await wait(500 * Math.pow(2, attempts - 1));
      }
    }
    if (!isBackgroundRefresh) setLoading(false);
  }, [cacheKey, ...dependencies]);

  useEffect(() => {
    const isCacheStale = !cachedData || (Date.now() - cachedData.timestamp > CACHE_DURATION);
    if (isCacheStale || !cachedData?.data) fetchData(false);
    else { setData(cachedData.data); setLoading(false); fetchData(true); }
  }, [fetchData]);

  // Xử lý cập nhật Realtime (Add/Update/Delete) để update cache cục bộ
  useEffect(() => {
    if (!lastDataChange || loading) return;
    const currentData = data;
    const isArray = (d: any): d is { id: any }[] => Array.isArray(d);
    
    // ... Logic merge dữ liệu realtime vào cache (Xem source file gốc để lấy logic chi tiết) ...
    
    fetchData(true); // Fallback: Refresh dữ liệu nếu logic phức tạp
  }, [lastDataChange]);

  return { data, loading, error };
}
```

---

## 4. HỆ THỐNG GIAO DIỆN (UI SYSTEM)

### `context/ToastContext.tsx`
Hệ thống thông báo toàn cục (Success/Error).

```typescript
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast { id: number; message: string; type: ToastType; }
interface ToastContextType { toasts: Toast[]; addToast: (message: string, type: ToastType) => void; removeToast: (id: number) => void; }

const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const useToasts = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return <ToastContext.Provider value={{ toasts, addToast, removeToast }}>{children}</ToastContext.Provider>;
};
```

### `components/Toast.tsx` & `components/ToastContainer.tsx`
UI hiển thị thông báo. (Xem file nguồn để lấy code Tailwind CSS cho hiệu ứng animation).

---

## 5. COMPONENTS CƠ SỞ (BASE COMPONENTS)

Các component này độc lập với logic nghiệp vụ, sử dụng để dựng layout.

### `components/ActionModal.tsx`
Modal xác nhận chung (Confirm Dialog).

```typescript
import React, { useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

export interface ActionModalProps {
  isOpen: boolean; onClose: () => void; onConfirm?: () => void;
  title: string; message: string; confirmText?: string; cancelText?: string;
  children?: React.ReactNode;
};

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onConfirm, title, message, children, confirmText }) => {
  const { t } = useSettings();
  // ... Handle KeyDown 'Enter' ...
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md my-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold dark:text-gray-100">{title}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
        {children}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border dark:border-gray-600">{t.cancel}</button>
            {onConfirm && <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">{confirmText || t.save}</button>}
        </div>
      </div>
    </div>
  );
};
export default ActionModal;
```

### `components/GenericListModal.tsx`
Modal hiển thị danh sách có bộ lọc (dùng cho Log, Notification, List Items).

```typescript
// Component khung sườn cho modal danh sách, hỗ trợ header, filter slot, content slot và footer slot.
// Xem file nguồn để lấy code chi tiết.
```

### `components/Auth.tsx`
Form đăng nhập/đăng ký chuẩn sử dụng Supabase Auth. Hỗ trợ Magic Link hoặc Email/Password.

### `components/Skeleton.tsx`
Các UI Loading placeholder.

---

## 6. HƯỚNG DẪN MỞ RỘNG (EXTENSION GUIDE)

Để biến Core Framework này thành một ứng dụng cụ thể (Ví dụ: CRM quản lý khách hàng), bạn cần thực hiện các bước sau:

1.  **Cập nhật Database:**
    *   Tạo bảng `customers` thay vì `tasks`.
    *   Giữ nguyên bảng `profiles`, `activity_logs`, `notifications`.

2.  **Định nghĩa lại Types (`types.ts`):**
    *   Thay đổi interface `Task` thành `Customer`.

3.  **Viết Business Hooks:**
    *   Copy `hooks/useAppActions.ts` -> đổi tên thành `hooks/useCustomerActions.ts`.
    *   Sửa logic `handleSaveTask` thành `handleSaveCustomer`.

4.  **Tạo Components Nghiệp vụ:**
    *   Thay `TaskCard.tsx` bằng `CustomerCard.tsx`.
    *   Thay `EmployeeDashboard.tsx` bằng `CustomerList.tsx`.

5.  **Cập nhật Router (`App.tsx`):**
    *   Import các component mới vào Main Layout.

Hệ thống Auth, Settings, Theme, Realtime Cache sẽ tự động hoạt động mà không cần sửa đổi.
