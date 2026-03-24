#!/usr/bin/env python3
"""
Database migration helper script
Wrapper around Alembic commands for easier usage
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def print_help():
    print("""
Database Migration Commands:

  python migrate.py init
      Create initial migration (first time setup)
      
  python migrate.py create "description"
      Create a new migration with auto-detected changes
      Example: python migrate.py create "add user table"
      
  python migrate.py upgrade
      Apply all pending migrations to database
      
  python migrate.py downgrade
      Rollback the last migration
      
  python migrate.py current
      Show current migration version
      
  python migrate.py history
      Show migration history
      
  python migrate.py stamp head
      Mark database as up-to-date without running migrations

Examples:
  # First time setup
  python migrate.py init
  python migrate.py upgrade
  
  # After changing models
  python migrate.py create "added skills field to agent"
  python migrate.py upgrade
  
  # Rollback last change
  python migrate.py downgrade
""")

def run_alembic(args):
    """Run alembic command"""
    from alembic.config import Config
    from alembic import command
    
    # Load alembic config
    alembic_cfg = Config("alembic.ini")
    
    cmd = args[0] if args else "help"
    
    if cmd == "init":
        print("Creating initial migration...")
        command.revision(alembic_cfg, message="initial migration", autogenerate=True)
        print("✓ Initial migration created in db/migrations/versions/")
        print("  Run 'python migrate.py upgrade' to apply it")
        
    elif cmd == "create":
        if len(args) < 2:
            print("Error: Please provide a migration message")
            print("Example: python migrate.py create 'add user table'")
            sys.exit(1)
        message = args[1]
        print(f"Creating migration: {message}")
        command.revision(alembic_cfg, message=message, autogenerate=True)
        print("✓ Migration created in db/migrations/versions/")
        print("  Run 'python migrate.py upgrade' to apply it")
        
    elif cmd == "upgrade":
        print("Applying migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✓ Database is up to date")
        
    elif cmd == "downgrade":
        print("Rolling back last migration...")
        command.downgrade(alembic_cfg, "-1")
        print("✓ Rolled back successfully")
        
    elif cmd == "current":
        command.current(alembic_cfg)
        
    elif cmd == "history":
        command.history(alembic_cfg)
        
    elif cmd == "stamp":
        if len(args) < 2:
            print("Error: Please provide revision (usually 'head')")
            sys.exit(1)
        command.stamp(alembic_cfg, args[1])
        print(f"✓ Database stamped as {args[1]}")
        
    else:
        print_help()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_help()
        sys.exit(0)
    
    run_alembic(sys.argv[1:])
