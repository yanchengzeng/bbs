"""
Data migration script to populate preset tags into the tags table.
Run this after running the database migration: alembic upgrade head

Usage:
    python migrate_preset_tags.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.tag import Tag

# Preset tags that should be in the database
PRESET_TAGS = ['#gettingup', '#running', '#reading']


def migrate_preset_tags():
    """Populate the tags table with preset tags if they don't exist"""
    db = SessionLocal()
    try:
        tags_created = 0
        tags_existing = 0
        
        for tag_name in PRESET_TAGS:
            # Check if tag already exists
            existing_tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if existing_tag:
                print(f"Tag '{tag_name}' already exists, skipping...")
                tags_existing += 1
            else:
                # Create new tag
                new_tag = Tag(name=tag_name)
                db.add(new_tag)
                tags_created += 1
                print(f"Created tag: {tag_name}")
        
        db.commit()
        print(f"\nMigration complete!")
        print(f"  - Created {tags_created} new tags")
        print(f"  - Skipped {tags_existing} existing tags")
        print(f"  - Total tags in database: {tags_created + tags_existing}")
        
    except Exception as e:
        db.rollback()
        print(f"Error migrating preset tags: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_preset_tags()
