"""
Database Migration Script
Adds location_name column to sessions table
"""

import sqlite3
import os

# Path to database
db_path = 'hunt_planur.db'

if not os.path.exists(db_path):
    print(f"Database file {db_path} not found. No migration needed.")
    exit(0)

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(sessions)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'location_name' in columns:
        print("Column 'location_name' already exists. No migration needed.")
    else:
        # Add the new column
        cursor.execute("ALTER TABLE sessions ADD COLUMN location_name VARCHAR(200)")
        conn.commit()
        print("Successfully added 'location_name' column to sessions table.")
    
    conn.close()
    print("Migration completed successfully!")
    
except Exception as e:
    print(f"Migration failed: {e}")
    print("\nAlternative: Delete hunt_planur.db and restart the app to recreate the database.")
