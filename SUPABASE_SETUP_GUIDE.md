# 🚀 SUPABASE INTEGRATION SETUP GUIDE

## 📋 **PREREQUISITES**
- ✅ Supabase account with project "VigyanShaala Template Assignment"
- ✅ Project URL and API keys from Supabase dashboard
- ✅ Local development environment ready

---

## 🔧 **STEP-BY-STEP SETUP**

### **Step 1: Get Your Supabase Credentials**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Navigate to: "Vijay Vigyanshaala" → "VigyanShaala Template Assignment"

2. **Get API Keys:**
   - Click "Settings" → "API"
   - Copy these values:
     ```
     Project URL: https://[your-project-id].supabase.co
     Anon/Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

### **Step 2: Set Up Environment Variables**

1. **Create `.env` file in project root:**
   ```bash
   # Copy env.example to .env
   cp env.example .env
   ```

2. **Add your Supabase credentials:**
   ```env
   VITE_SUPABASE_URL=https://[your-project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_ADMIN_PASSWORD=Vigyan@Assignments123
   ```

### **Step 3: Set Up Database Schema**

1. **Go to Supabase SQL Editor:**
   - In your Supabase dashboard, click "SQL Editor"

2. **Run the schema script:**
   - Copy the contents of `supabase-schema.sql`
   - Paste and execute in the SQL Editor

3. **Verify tables created:**
   - Go to "Table Editor"
   - You should see `templates` and `template_shares` tables

### **Step 4: Test the Connection**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Check browser console:**
   - Look for any Supabase connection errors
   - Should see successful connection messages

3. **Test template operations:**
   - Try creating a new template
   - Check if it appears in Supabase dashboard

---

## 🗄️ **DATABASE SCHEMA OVERVIEW**

### **Tables Created:**

**1. `templates` table:**
- `id` - Unique UUID for each template
- `name` - Template name
- `type` - Template type (cv, resume, swot, custom)
- `fields` - JSONB field data
- `field_positions` - JSONB position data
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - User identifier (anonymous for now)
- `is_public` - Public visibility flag
- `share_token` - Unique share token

**2. `template_shares` table:**
- `id` - Unique UUID for each share
- `template_id` - Reference to template
- `share_token` - Unique share token
- `created_at` - Share creation timestamp
- `expires_at` - Share expiration (30 days)
- `access_count` - Number of times accessed

### **Row Level Security (RLS):**
- Public templates are viewable by everyone
- Users can create, update, and delete their own templates
- Share tokens are publicly accessible

---

## 🔄 **MIGRATION FROM LOCALSTORAGE**

### **Current State:**
- Templates stored in browser localStorage
- No cross-device sharing
- Data lost on browser clear

### **New State:**
- Templates stored in Supabase database
- Real-time sync across devices
- Public/private template sharing
- Share links with expiration

### **Migration Process:**
1. **Backup existing templates:**
   - Export current templates from localStorage
   - Save as JSON backup file

2. **Import to Supabase:**
   - Use the new Supabase service to import templates
   - Verify all templates are accessible

3. **Test functionality:**
   - Create new templates
   - Share templates
   - Access from different devices

---

## 🚀 **FEATURES ENABLED**

### **✅ Real-time Updates:**
- Live template sync across devices
- Instant updates when templates are modified

### **✅ Template Sharing:**
- Generate share links for templates
- 30-day expiration on share links
- Access tracking for shared templates

### **✅ Public Templates:**
- Make templates public for everyone
- Browse public template library
- Community template sharing

### **✅ Cloud Storage:**
- No more localStorage limitations
- Templates accessible from any device
- Automatic backups and data persistence

### **✅ Admin Features:**
- View all templates in database
- Manage public/private status
- Monitor template usage

---

## 🛠️ **TROUBLESHOOTING**

### **Common Issues:**

**1. Connection Errors:**
```
Error: Missing Supabase environment variables
```
**Solution:** Check your `.env` file and ensure variables are set correctly.

**2. RLS Policy Errors:**
```
Error: new row violates row-level security policy
```
**Solution:** Check RLS policies in Supabase dashboard.

**3. Template Not Loading:**
```
Error: Failed to load templates from database
```
**Solution:** Check network connection and Supabase project status.

### **Debug Steps:**
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test Supabase connection in dashboard
4. Check RLS policies are enabled
5. Verify database schema is correct

---

## 📚 **NEXT STEPS**

### **Phase 1: Basic Integration (Current)**
- ✅ Supabase client setup
- ✅ Database schema
- ✅ Template CRUD operations
- ✅ Real-time subscriptions

### **Phase 2: Enhanced Features (Future)**
- 🔄 User authentication
- 🔄 Advanced sharing options
- 🔄 Template categories
- 🔄 Analytics dashboard

### **Phase 3: Advanced Features (Future)**
- 🔄 Collaborative editing
- 🔄 Version control
- 🔄 Template marketplace
- 🔄 Advanced analytics

---

## 🎯 **SUCCESS CRITERIA**

### **✅ Integration Complete When:**
- Templates save to Supabase database
- Real-time updates work across devices
- Share links function correctly
- Public templates are accessible
- No localStorage dependency
- Error handling works properly

### **✅ Testing Checklist:**
- [ ] Create new template
- [ ] Save template to database
- [ ] Load templates from database
- [ ] Share template link
- [ ] Access shared template
- [ ] Make template public
- [ ] Real-time updates
- [ ] Error handling
- [ ] Cross-device access

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for errors
4. Verify environment variables
5. Test database connection

**Ready to proceed with the integration!** 🚀 