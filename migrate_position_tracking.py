"""
Database Migration Script - Add Position Tracking
Adds last_latitude and last_longitude columns to users and session_participants tables
"""

import sqlite3
import os
import sys

# Set UTF-8 encoding for console output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def migrate():
    db_path = 'hunt_planur.db'
    
    if not os.path.exists(db_path):
        print(f"Database file '{db_path}' not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Starting migration: Adding position tracking columns...")
        
        # Check if columns already exist in users table
        cursor.execute("PRAGMA table_info(users)")
        users_columns = [column[1] for column in cursor.fetchall()]
        
        # Add columns to users table if they don't exist
        if 'last_latitude' not in users_columns:
            print("Adding last_latitude column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN last_latitude REAL")
            print("✓ Added last_latitude to users")
        else:
            print("✓ last_latitude already exists in users table")
        
        if 'last_longitude' not in users_columns:
            print("Adding last_longitude column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN last_longitude REAL")
            print("✓ Added last_longitude to users")
        else:
            print("✓ last_longitude already exists in users table")
        
        # Check if columns already exist in session_participants table
        cursor.execute("PRAGMA table_info(session_participants)")
        participants_columns = [column[1] for column in cursor.fetchall()]
        
        # Add columns to session_participants table if they don't exist
        if 'last_latitude' not in participants_columns:
            print("Adding last_latitude column to session_participants table...")
            cursor.execute("ALTER TABLE session_participants ADD COLUMN last_latitude REAL")
            print("✓ Added last_latitude to session_participants")
        else:
            print("✓ last_latitude already exists in session_participants table")
        
        if 'last_longitude' not in participants_columns:
            print("Adding last_longitude column to session_participants table...")
            cursor.execute("ALTER TABLE session_participants ADD COLUMN last_longitude REAL")
            print("✓ Added last_longitude to session_participants")
        else:
            print("✓ last_longitude already exists in session_participants table")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Display table schemas
        print("\n--- Users Table Schema ---")
        cursor.execute("PRAGMA table_info(users)")
        for column in cursor.fetchall():
            print(f"  {column[1]}: {column[2]}")
        
        print("\n--- Session Participants Table Schema ---")
        cursor.execute("PRAGMA table_info(session_participants)")
        for column in cursor.fetchall():
            print(f"  {column[1]}: {column[2]}")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Hunt-Hunt-Planur - Position Tracking Migration")
    print("=" * 60)
    print()
    
    success = migrate()
    
    if success:
        print("\n✅ All migrations completed successfully!")
        print("You can now restart your application.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
