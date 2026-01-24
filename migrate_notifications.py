"""
Database Migration Script
Adds notifications table for alert functionality
"""

import sqlite3
import os

# Path to database
db_path = 'hunt_planur.db'

if not os.path.exists(db_path):
    print(f"Database file {db_path} not found. No migration needed.")
    print("The notifications table will be created automatically when you start the app.")
    exit(0)

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if notifications table already exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("Table 'notifications' already exists. No migration needed.")
    else:
        # Create the notifications table
        cursor.execute("""
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                sender_participant_id INTEGER NOT NULL,
                message VARCHAR(500) NOT NULL,
                sender_latitude FLOAT,
                sender_longitude FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions (id),
                FOREIGN KEY (sender_participant_id) REFERENCES session_participants (id)
            )
        """)
        conn.commit()
        print("Successfully created 'notifications' table.")
    
    conn.close()
    print("Migration completed successfully!")
    
except Exception as e:
    print(f"Migration failed: {e}")
    print("\nAlternative: Delete hunt_planur.db and restart the app to recreate the database.")
