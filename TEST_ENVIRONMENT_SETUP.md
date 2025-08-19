# Test Environment Setup Guide

## Overview
This guide explains how to set up and use a separate test environment for Format Forge Visualizer without affecting the production database.

## Quick Start

### 1. Create Test Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: `format-forge-test`
3. Copy Project URL and Anon Key from Settings → API

### 2. Set Up Environment Variables
```bash
# Create .env.test file
VITE_SUPABASE_URL=https://your-test-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-project-anon-key
VITE_ADMIN_EMAIL=test@formatforge.com
VITE_ADMIN_PASSWORD=testpassword123
VITE_TEST_MODE=true
```

### 3. Set Up Database Schema
Run the complete `supabase-schema.sql` in your test project's SQL Editor.

### 4. Create Admin User
1. Go to Authentication → Users in test project
2. Add User:
   - Email: `test@formatforge.com`
   - Password: `testpassword123`
   - Email Confirm: ✅ Checked

### 5. Run Test Environment
```bash
npm run dev:test
```

## File Structure

### Environment Files
- `.env` - Production environment (main database)
- `.env.test` - Test environment (test database)
- `.gitignore` - Includes `.env.test` to prevent committing

### Test Data
- `src/utils/testData.ts` - Mock data and service for testing without database

### Package Scripts
```json
{
  "dev:test": "vite --mode test",
  "build:test": "vite build --mode test"
}
```

## Database Isolation

### Production Database
- Uses credentials from `.env`
- Contains real user data
- Never affected by test environment

### Test Database
- Uses credentials from `.env.test`
- Contains only test data
- Can be reset/deleted without consequences

## Common Issues & Solutions

### 1. Admin Login Not Working
**Problem**: "Incorrect password" error
**Solution**: 
- Ensure admin user exists in test database
- Check password matches `.env.test` file
- Restart test environment after changing `.env.test`

### 2. RLS Policy Errors
**Problem**: "new row violates row-level security policy"
**Solution**: Run this SQL in test database:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for form_submissions" ON form_submissions;

-- Create new permissive policy for form_submissions
CREATE POLICY "Allow all operations for form_submissions" ON form_submissions
  FOR ALL USING (true) WITH CHECK (true);

-- Also ensure templates table allows public read access
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON templates;
CREATE POLICY "Public templates are viewable by everyone" ON templates
  FOR SELECT USING (is_public = true);

-- Allow anonymous users to create form submissions
CREATE POLICY "Anonymous users can create form submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);
```

### 3. Mobile Download Issues
**Problem**: PDF download fails on mobile
**Solution**: 
- Check browser console for RLS errors
- Ensure RLS policies allow anonymous users
- Test with different mobile browsers

## Testing Checklist

### ✅ Basic Functionality
- [ ] Admin login works
- [ ] Template creation works
- [ ] Image upload works
- [ ] Form field positioning works
- [ ] PDF generation works

### ✅ Mobile Testing
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] PDF download works on mobile
- [ ] Form submission works on mobile

### ✅ Database Operations
- [ ] Templates save to test database
- [ ] Form submissions save to test database
- [ ] No data appears in production database

## Switching Between Environments

### To Use Test Environment
```bash
npm run dev:test
# Access at http://localhost:8084/
```

### To Use Production Environment
```bash
npm run dev
# Access at http://localhost:5173/
```

## Reset Test Environment

### Option 1: Delete and Recreate Test Project
1. Delete test Supabase project
2. Create new test project
3. Follow setup steps again

### Option 2: Clear Test Data
```sql
-- Clear all test data
DELETE FROM form_submissions;
DELETE FROM templates;
DELETE FROM template_shares;
```

## Best Practices

1. **Always use test environment** for new feature development
2. **Never commit `.env.test`** to git (already in .gitignore)
3. **Test on both desktop and mobile** before deploying
4. **Check RLS policies** if database operations fail
5. **Use different admin credentials** for test vs production

## Troubleshooting

### Environment Variables Not Loading
- Restart the dev server after changing `.env.test`
- Check that `.env.test` is in the correct location
- Verify variable names start with `VITE_`

### Database Connection Issues
- Verify Supabase URL and Anon Key in `.env.test`
- Check if test project is active in Supabase dashboard
- Ensure database schema is properly set up

### Build Issues
- Use `npm run build:test` for test environment builds
- Check that all environment variables are properly set
- Verify TypeScript compilation passes

## Security Notes

- Test environment uses separate database with no real user data
- Admin credentials in `.env.test` are for testing only
- RLS policies in test environment can be more permissive for testing
- Never use test credentials in production

## Future Improvements

- Add automated test data seeding
- Implement test environment health checks
- Add integration tests for database operations
- Create test environment monitoring
