"""
Database Migration Script - User Positions Table
Creates user_positions table and removes last_latitude/longitude from users and session_participants
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
        
        print("Starting migration: Creating user_positions table...")
        
        # Check if user_positions table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_positions'")
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("Creating user_positions table...")
            cursor.execute("""
                CREATE TABLE user_positions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    accuracy REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            print("✓ Created user_positions table")
            
            # Create index on timestamp for faster queries
            cursor.execute("CREATE INDEX idx_user_positions_timestamp ON user_positions(timestamp)")
            print("✓ Created index on timestamp")
            
            # Create index on user_id for faster queries
            cursor.execute("CREATE INDEX idx_user_positions_user_id ON user_positions(user_id)")
            print("✓ Created index on user_id")
        else:
            print("✓ user_positions table already exists")
        
        # Check if old columns exist in users table
        cursor.execute("PRAGMA table_info(users)")
        users_columns = [column[1] for column in cursor.fetchall()]
        
        # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
        if 'last_latitude' in users_columns or 'last_longitude' in users_columns:
            print("\nRemoving last_latitude and last_longitude from users table...")
            
            # Get current users table schema
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
            create_table_sql = cursor.fetchone()[0]
            
            # Create new table without last_latitude and last_longitude
            cursor.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255),
                    google_id VARCHAR(255) UNIQUE,
                    profile_picture VARCHAR(500),
                    auth_provider VARCHAR(20) DEFAULT 'local',
                    created_at DATETIME,
                    last_login DATETIME
                )
            """)
            
            # Copy data from old table to new table
            cursor.execute("""
                INSERT INTO users_new (id, username, email, password_hash, google_id, 
                                      profile_picture, auth_provider, created_at, last_login)
                SELECT id, username, email, password_hash, google_id, 
                       profile_picture, auth_provider, created_at, last_login
                FROM users
            """)
            
            # Drop old table and rename new table
            cursor.execute("DROP TABLE users")
            cursor.execute("ALTER TABLE users_new RENAME TO users")
            
            print("✓ Removed last_latitude and last_longitude from users table")
        else:
            print("✓ users table already clean (no last_latitude/longitude columns)")
        
        # Check if old columns exist in session_participants table
        cursor.execute("PRAGMA table_info(session_participants)")
        participants_columns = [column[1] for column in cursor.fetchall()]
        
        if 'last_latitude' in participants_columns or 'last_longitude' in participants_columns:
            print("\nRemoving last_latitude and last_longitude from session_participants table...")
            
            # Create new table without last_latitude and last_longitude
            cursor.execute("""
                CREATE TABLE session_participants_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER NOT NULL,
                    user_id INTEGER,
                    guest_name VARCHAR(50),
                    joined_at DATETIME,
                    is_active BOOLEAN,
                    FOREIGN KEY (session_id) REFERENCES sessions (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            
            # Copy data from old table to new table
            cursor.execute("""
                INSERT INTO session_participants_new (id, session_id, user_id, guest_name, 
                                                      joined_at, is_active)
                SELECT id, session_id, user_id, guest_name, joined_at, is_active
                FROM session_participants
            """)
            
            # Drop old table and rename new table
            cursor.execute("DROP TABLE session_participants")
            cursor.execute("ALTER TABLE session_participants_new RENAME TO session_participants")
            
            print("✓ Removed last_latitude and last_longitude from session_participants table")
        else:
            print("✓ session_participants table already clean (no last_latitude/longitude columns)")
        
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
        
        print("\n--- User Positions Table Schema ---")
        cursor.execute("PRAGMA table_info(user_positions)")
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
    print("Hunt-Hunt-Planur - User Positions Migration")
    print("=" * 60)
    print()
    
    success = migrate()
    
    if success:
        print("\n✅ All migrations completed successfully!")
        print("You can now restart your application.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
