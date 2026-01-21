"""
Script to inject fake post data for testing weekly summary functionality.
Run this from the backend directory: python inject_fake_data.py
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.user import User
from app.models.post import Post

# Preset tags
PRESET_TAGS = ['#gettingup', '#running', '#reading']

def inject_fake_data():
    db = SessionLocal()
    try:
        # Get or create user with specific email
        target_email = 'patrick.zeng12@gmail.com'
        test_user = db.query(User).filter(User.email == target_email).first()
        if not test_user:
            test_user = User(
                email=target_email,
                name='Patrick Zeng'
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Created user: {test_user.name} ({test_user.email})")
        else:
            print(f"Using existing user: {test_user.name} ({test_user.email})")
        
        # Generate posts for the last 4 weeks (28 days)
        today = datetime.utcnow()
        posts_created = 0
        num_weeks = 4
        total_days = num_weeks * 7
        
        # Sample post contents with variety
        post_contents = [
            "Just finished my morning run! Feeling energized.",
            "Started reading a new book today. It's really interesting.",
            "Got up early and went for a walk in the park.",
            "Completed my daily reading goal. Making progress!",
            "Morning run was tough but rewarding.",
            "Reading session was productive today.",
            "Early morning routine is getting easier.",
            "Finished another chapter of my book.",
            "Great run this morning, perfect weather.",
            "Reading time before bed is so relaxing.",
            "Morning jog through the neighborhood.",
            "Book club discussion was engaging.",
            "Up early and feeling motivated.",
            "Running in the rain was refreshing.",
            "Reading outside in the sunshine.",
            "Morning routine is becoming a habit.",
            "Long run today, feeling accomplished.",
            "New book recommendation from a friend.",
            "Early riser club member here!",
            "Running helps clear my mind.",
            "Reading helps me unwind.",
            "Morning exercise routine complete.",
            "Book review: really enjoying this one.",
            "Up before sunrise today.",
            "Running playlist is on point.",
            "Reading corner is my happy place.",
            "Morning meditation and run.",
            "Book progress: halfway through!",
            "Early bird gets the worm!",
            "Running shoes are getting worn out.",
            "Reading multiple books at once.",
            "Morning motivation is key.",
            "Running in different neighborhoods.",
            "Book recommendations welcome!",
            "Up early for the sunrise.",
            "Running with friends is fun.",
            "Reading before work starts the day right.",
            "Morning routine checklist complete.",
            "Running stats looking good.",
            "Book club meeting was great.",
            "Working on a new project today.",
            "Had a great conversation with a friend.",
            "Feeling productive this week.",
            "Trying out a new recipe.",
            "Enjoying the weekend weather.",
            "Planning for the upcoming week.",
            "Reflecting on the past few days.",
            "Making progress on personal goals.",
        ]
        
        # Generate posts for each day across multiple weeks
        for day_offset in range(total_days):
            post_date = today - timedelta(days=day_offset)
            
            # Vary posts per day - more posts on some days, fewer on others
            # Weekends might have fewer posts, weekdays more
            is_weekend = post_date.weekday() >= 5
            if is_weekend:
                num_posts = random.randint(1, 4)
            else:
                num_posts = random.randint(3, 8)
            
            for i in range(num_posts):
                # Random time within the day
                hour = random.randint(6, 22)
                minute = random.randint(0, 59)
                post_datetime = post_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # Random content
                content = random.choice(post_contents)
                
                # Assign tags based on day of week and randomness
                # This creates variety across weeks
                tags = []
                tag_probability = random.random()
                
                if tag_probability > 0.25:  # 75% chance of having tags
                    # Vary tag selection based on day offset to create patterns
                    day_pattern = day_offset % 7
                    
                    if day_pattern in [0, 1]:  # Early week - more #gettingup
                        if random.random() > 0.3:
                            tags.append('#gettingup')
                        if random.random() > 0.6:
                            tags.append(random.choice(['#running', '#reading']))
                    elif day_pattern in [2, 3]:  # Mid week - mix
                        num_tags = random.randint(1, 2)
                        tags = random.sample(PRESET_TAGS, num_tags)
                    elif day_pattern in [4, 5]:  # Late week - more #running
                        if random.random() > 0.3:
                            tags.append('#running')
                        if random.random() > 0.6:
                            tags.append(random.choice(['#gettingup', '#reading']))
                    else:  # Weekend - more #reading
                        if random.random() > 0.3:
                            tags.append('#reading')
                        if random.random() > 0.6:
                            tags.append(random.choice(['#gettingup', '#running']))
                    
                    # Remove duplicates
                    tags = list(set(tags))
                
                post = Post(
                    user_id=test_user.id,
                    content=content,
                    tags=tags,
                    created_at=post_datetime
                )
                db.add(post)
                posts_created += 1
        
        db.commit()
        print(f"Successfully created {posts_created} fake posts across {num_weeks} weeks")
        print(f"User ID: {test_user.id}")
        print(f"Email: {test_user.email}")
        print(f"You can now test the weekly summary at: /users/{test_user.id}")
        print(f"Posts span from {today - timedelta(days=total_days)} to {today}")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    inject_fake_data()
