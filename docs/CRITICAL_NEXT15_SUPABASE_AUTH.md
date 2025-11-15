# 🔥 CRITICAL: Next.js 15 + Supabase Auth - GOLDEN RULES

**READ THIS BEFORE CREATING ANY NEW AUTHENTICATED PAGES OR API ROUTES!**

---

## ⚠️ GOLDEN RULES - NEVER FORGET!

### 1. **ALWAYS USE `cookies()` WITH `createClient()` IN SERVER CONTEXTS**

**Problem:** `Auth session missing!` errors in server components and API routes

**Solution:**
```typescript
// ❌ WRONG - Will fail with "Auth session missing!"
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();

// ✅ CORRECT - Always pass cookies
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const supabase = await createClient(cookieStore);
```

**Applies to:**
- ✅ Server Components (all `page.tsx` without 'use client')
- ✅ API Routes (`app/api/**/route.ts`)
- ✅ Server Actions
- ❌ NOT needed in Client Components ('use client')

---

### 2. **`params` IS A PROMISE IN NEXT.JS 15**

**Problem:** `params.id` returns `undefined`, routes fail

**Solution:**
```typescript
// ❌ WRONG - params.id is undefined
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id; // undefined!
}

// ✅ CORRECT - Always await params
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**Applies to:**
- ✅ All dynamic route pages (`[id]/page.tsx`)
- ✅ All API routes with dynamic segments (`[id]/route.ts`)
- ✅ generateMetadata functions
- ✅ Any function receiving params from Next.js

---

### 3. **PREFER CLIENT COMPONENTS FOR AUTH-HEAVY PAGES**

**Problem:** Server components have cookie/session issues even with proper setup

**When to use Client Component:**
- Page needs authentication checks
- Page has interactive forms
- Page fetches user-specific data
- Multiple auth-dependent operations

**Solution:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // client, not server!

export default function Page() {
  const supabase = createClient(); // No cookies needed
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/sign-in');
      }
    }
    checkAuth();
  }, []);
}
```

**Benefits:**
- ✅ Session available automatically from browser cookies
- ✅ No cookie passing needed
- ✅ Real-time updates
- ✅ Better UX with loading states

---

### 4. **DEBUGGING CHECKLIST FOR AUTH ISSUES**

When you see "Auth session missing!" or 401 errors:

```typescript
// 1. Check if it's a server component/API route
// 2. Verify cookies() is imported and used
console.log('🔐 Auth debug:', {
  hasUser: !!user,
  userId: user?.id,
  authError: authError?.message,
});

// 3. Check params handling
console.log('📋 Params:', { 
  paramsType: typeof params,
  id: await params.id // or params.id depending on context
});

// 4. CRITICAL: Verify cookieStore is valid!
const cookieStore = await cookies();
console.log('🍪 CookieStore check:', {
  hasCookieStore: !!cookieStore,
  hasGet: typeof cookieStore?.get,
  hasSet: typeof cookieStore?.set,
  hasDelete: typeof cookieStore?.delete,  // Next.js uses delete!
  hasRemove: typeof cookieStore?.remove,
});

// 5. Consider converting to client component if auth is complex
```

**⚠️ IMPORTANT:** Next.js `cookies()` uses `.delete()` not `.remove()`!
Make sure your Supabase client creation accepts this.

---

## 📋 COMPLETE PATTERNS BY CONTEXT

### **Server Component Pattern:**
```typescript
// app/[locale]/dashboard/example/page.tsx
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/sign-in`);

  // ... rest of component
}
```

### **Client Component Pattern:**
```typescript
// app/[locale]/dashboard/example/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${params.locale}/auth/sign-in`);
        return;
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return <LoadingSpinner />;
  // ... rest of component
}
```

### **API Route Pattern:**
```typescript
// app/api/example/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 🔥 CRITICAL: In API routes, use request.cookies NOT await cookies()!
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  // 🔥 CRITICAL: Use getSession() NOT getUser()!
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of route
}
```

**⚠️ WHY getSession() NOT getUser()?**
- Supabase SSR stores auth in ONE cookie: `sb-session`
- `getSession()` reads directly from `sb-session` cookie
- `getUser()` tries to extract JWT from headers (FAILS in API routes!)
- `request.cookies` contains the actual cookies sent by the browser

---

## 🎯 MIGRATION CHECKLIST

When adding new authenticated pages/routes:

- [ ] Is it a Server Component or Client Component?
- [ ] If Server: Import and use `cookies()`
- [ ] If Client: Use `'use client'` directive
- [ ] Are params used? If yes: `await params`
- [ ] Add auth check with proper error handling
- [ ] Add loading states (Client) or redirects (Server)
- [ ] Test auth flow: logged in → works, logged out → redirects
- [ ] Check console for "Auth session missing!" errors

---

## 💡 WHY THESE ISSUES HAPPEN

**Next.js 15 Changes:**
- `params` changed from sync object to async Promise
- `cookies()` must be awaited
- Server Components run on server without browser context
- Auth sessions stored in HTTP-only cookies

**Supabase SSR:**
- Needs cookies to access session from headers
- Without cookies → creates anonymous client
- Anonymous client → no auth session
- Server vs Client have different cookie access patterns

---

## 🔍 Real-World Example: The Enrichment Bug

**What happened:**
1. Created server component without cookies → Auth failed ❌
2. Added cookies → Still failed (cache issue) ❌
3. Converted to client component → Page loaded ✅
4. API still failed → No cookies in API ❌
5. Added cookies to API → Still failed! ❌
6. Added detailed logging → Found root cause! 🎯
7. Fixed cookieStore validation → Finally worked! ✅

**The REAL root cause:**
- `isValidCookieStore()` checked for `.remove()` method
- Next.js `cookies()` uses `.delete()` instead!
- Validation failed → Client created without session support
- Result: "Auth session missing!" error

**The fix:**
```typescript
// Accept EITHER remove() OR delete()
const isValidCookieStore = (obj: any): boolean => {
  return obj && 
    typeof obj.get === 'function' && 
    typeof obj.set === 'function' && 
    (typeof obj.remove === 'function' || typeof obj.delete === 'function');
}
```

**Lesson:** Always validate that your cookieStore implementation matches Next.js's API!

**Time wasted:** ~3 hours debugging

**Time saved with this guide:** ~2 hours 50 minutes

---

## ⚡ Quick Reference Card

```
SERVER COMPONENT:
import { cookies } from 'next/headers';
const cookieStore = await cookies();
const supabase = await createClient(cookieStore);

CLIENT COMPONENT:
'use client';
const supabase = createClient(); // No cookies!

API ROUTE: 🔥 DIFFERENT!
import { createServerClient } from '@supabase/ssr';
const supabase = createServerClient(url, key, {
  cookies: {
    get: (name) => request.cookies.get(name)?.value,
    set: () => {},
    remove: () => {},
  }
});

PARAMS (ALL CONTEXTS):
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
```

---

**🚨 REMEMBER: When in doubt, use a CLIENT COMPONENT!**

