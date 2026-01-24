# Production Migration Guide: Tags Table

## Overview
This migration adds a `tags` table and `post_tags` association table to enable tag persistence across all users.

## Migration Details
- **Migration File**: `backend/alembic/versions/add_tags_table_and_association.py`
- **Creates**: 
  - `tags` table (stores all unique tags)
  - `post_tags` table (links posts to tags)
- **Backward Compatible**: Existing posts with tags in JSON column will continue to work

## Automatic Migration (Recommended)

If your Render service is configured with:
```bash
Start Command: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Then migrations run automatically on each deployment. Just push your code and monitor the logs.

## Manual Migration (If Needed)

### Option A: Using Render Shell

1. Go to Render Dashboard → Your Backend Service
2. Click on "Shell" tab (if available)
3. Run:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Option B: Using Local Connection

If you have direct database access:

1. Set your production `DATABASE_URL` locally (temporarily):
   ```bash
   export DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

2. Run migration:
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Important**: Remove the `DATABASE_URL` from your local environment after migration

### Option C: Using psql Directly

Connect to your production database and run:

```sql
-- Create tags table
CREATE TABLE tags (
    name VARCHAR NOT NULL PRIMARY KEY
);

-- Create post_tags association table
CREATE TABLE post_tags (
    post_id UUID NOT NULL,
    tag_name VARCHAR NOT NULL,
    PRIMARY KEY (post_id, tag_name),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_name) REFERENCES tags(name) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX ix_post_tags_tag_name ON post_tags(tag_name);
```

## Verification

After migration, verify it worked:

1. **Check Render Logs**:
   - Look for: `INFO [alembic.runtime.migration] Running upgrade ...`
   - No errors should appear

2. **Test the API**:
   ```bash
   # Get all tags (should return empty array initially)
   curl https://your-backend.onrender.com/api/posts/tags/all
   
   # Create a post with a new tag
   # Then check tags again - should include the new tag
   ```

3. **Check Database** (if you have access):
   ```sql
   -- Verify tables exist
   \dt tags
   \dt post_tags
   
   -- Check if tables are empty (expected initially)
   SELECT COUNT(*) FROM tags;
   SELECT COUNT(*) FROM post_tags;
   ```

## Rollback (If Needed)

If you need to rollback:

```bash
# In Render Shell or locally with DATABASE_URL set
cd backend
alembic downgrade -1
```

Or manually:
```sql
DROP INDEX IF EXISTS ix_post_tags_tag_name;
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS tags;
```

## Important Notes

1. **No Data Loss**: This migration only adds new tables. Existing posts and their tags in the JSON column remain unchanged.

2. **Backward Compatibility**: The code maintains both:
   - The old `tags` JSON column (for backward compatibility)
   - The new `tag_objects` relationship (for persistence)

3. **Automatic Tag Creation**: When users create/update posts with tags, the system will:
   - Create tags in the `tags` table if they don't exist
   - Link posts to tags via `post_tags`
   - Keep the JSON column in sync

4. **Zero Downtime**: This migration is safe to run on a live database. It only adds new tables and doesn't modify existing data.

## Troubleshooting

### Migration Fails with "Table already exists"
- The migration may have partially run
- Check if tables exist: `SELECT * FROM information_schema.tables WHERE table_name IN ('tags', 'post_tags');`
- If they exist, mark migration as complete: `alembic stamp head`

### Migration Fails with "Revision not found"
- Check that the migration file is in the repository
- Verify the `down_revision` matches the current database state
- Check current revision: `alembic current`

### Connection Errors
- Verify `DATABASE_URL` is correct
- Check database is accessible from Render
- Ensure database service is running
