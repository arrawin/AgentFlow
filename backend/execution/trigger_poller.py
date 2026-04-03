"""
Trigger poller — Celery beat task that runs every 30s.
Checks folder_watch, file_watch, and email triggers.
Fires run_task when conditions are met.
All triggered runs go through the sandbox (agent_runner container).
"""
import os
import fnmatch
import imaplib
import email
from datetime import datetime, timezone
from execution.celery_app import celery_app
from db.database import SessionLocal
from db.models import Schedule, Task, Workflow, TaskRun
from services.encryption_service import EncryptionService
from tools.utils import UPLOAD_DIR


@celery_app.task
def poll_triggers():
    """Main poller — runs every 30s via Celery beat."""
    db = SessionLocal()
    try:
        # Clean up stale runs stuck in "in_progress" for more than 10 minutes
        from datetime import timedelta
        from db.models import TaskRun
        stale_cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
        stale = db.query(TaskRun).filter(
            TaskRun.status == "in_progress",
            TaskRun.started_at < stale_cutoff
        ).all()
        for run in stale:
            run.status = "failed"
            run.ended_at = datetime.now(timezone.utc)
            print(f"[trigger_poller] Marked stale run {run.id} as failed")
        if stale:
            db.commit()

        schedules = db.query(Schedule).filter(
            Schedule.enabled == True,
            Schedule.trigger_type.in_(["folder_watch", "file_watch", "email"])
        ).all()

        for sc in schedules:
            try:
                if sc.trigger_type in ("folder_watch", "file_watch"):
                    _check_file_trigger(sc, db)
                elif sc.trigger_type == "email":
                    _check_email_trigger(sc, db)
            except Exception as e:
                print(f"[trigger_poller] Error checking schedule {sc.id}: {e}")
    finally:
        db.close()


def _fire_tasks(schedule, db, trigger_context: str = ""):
    """Fire all tasks assigned to this schedule."""
    from execution.task_executor import run_task
    for task_id in (schedule.task_ids or []):
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            continue
        workflow = db.query(Workflow).filter(Workflow.id == task.workflow_id).first()
        if not workflow:
            continue

        task_run = TaskRun(
            task_id=task_id,
            status="in_progress",
            triggered_by=f"trigger:{schedule.trigger_type}",
            workflow_snapshot=workflow.graph_json,
            started_at=datetime.now(timezone.utc),
        )
        db.add(task_run)
        db.commit()
        db.refresh(task_run)

        print(f"[trigger_poller] Firing task {task_id} (run_id={task_run.id}) — {trigger_context}")
        run_task.delay(task_id, existing_run_id=task_run.id, triggered_by=f"trigger:{schedule.trigger_type}")


def _check_file_trigger(schedule, db):
    """
    folder_watch — fires when NEW files matching a pattern appear in a directory.
    file_watch   — fires when a SPECIFIC file's content changes (hash-based).
    """
    import hashlib

    watch_path = schedule.watch_path or UPLOAD_DIR
    pattern = schedule.file_pattern or "*"

    if not os.path.exists(watch_path):
        return

    if schedule.trigger_type == "file_watch":
        # watch_path must point to a specific file, not a directory
        if not os.path.isfile(watch_path):
            print(f"[trigger_poller] file_watch: {watch_path} is not a file")
            return

        with open(watch_path, "rb") as f:
            current_hash = hashlib.md5(f.read()).hexdigest()

        if schedule.last_file_hash is None:
            # First time seeing this file — store hash, don't fire yet
            schedule.last_file_hash = current_hash
            db.commit()
            return

        if current_hash != schedule.last_file_hash:
            print(f"[trigger_poller] file_watch: {watch_path} changed (hash mismatch)")
            schedule.last_file_hash = current_hash
            db.commit()
            _fire_tasks(schedule, db, trigger_context=f"file changed: {os.path.basename(watch_path)}")

    else:
        # folder_watch — detect new files matching pattern
        current_files = set()
        for f in os.listdir(watch_path):
            if f.startswith("_run_") or f.startswith("_agent_"):
                continue
            if fnmatch.fnmatch(f, pattern):
                current_files.add(f)

        last_seen = set(schedule.last_seen_files or [])
        new_files = current_files - last_seen

        if new_files:
            print(f"[trigger_poller] folder_watch: new files in {watch_path}: {new_files}")
            schedule.last_seen_files = list(current_files)
            db.commit()
            _fire_tasks(schedule, db, trigger_context=f"new files: {', '.join(new_files)}")


def _check_email_trigger(schedule, db):
    """Check IMAP inbox for matching emails."""
    if not all([schedule.imap_host, schedule.imap_user, schedule.imap_password_encrypted]):
        return

    enc = EncryptionService()
    try:
        password = enc.decrypt(schedule.imap_password_encrypted)
    except Exception:
        print(f"[trigger_poller] Failed to decrypt IMAP password for schedule {schedule.id}")
        return

    try:
        port = schedule.imap_port or 993
        mail = imaplib.IMAP4_SSL(schedule.imap_host, port)
        mail.login(schedule.imap_user, password)
        mail.select("INBOX")

        # Build search criteria
        criteria = ["UNSEEN"]
        if schedule.subject_filter:
            criteria += ["SUBJECT", schedule.subject_filter]
        if schedule.sender_filter:
            criteria += ["FROM", schedule.sender_filter]

        search_str = " ".join(f'"{c}"' if " " in c else c for c in criteria)
        _, message_ids = mail.search(None, search_str)

        ids = message_ids[0].split()
        if not ids:
            mail.logout()
            return

        print(f"[trigger_poller] {len(ids)} matching email(s) found for schedule {schedule.id}")

        for msg_id in ids:
            _, msg_data = mail.fetch(msg_id, "(RFC822)")
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            # Extract body
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="replace")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="replace")

            # Write email to uploads/emails — separate from inbox to avoid triggering folder_watch
            subject = msg.get("Subject", "email")
            safe_subject = "".join(c if c.isalnum() else "_" for c in subject)[:40]
            filename = f"email_{safe_subject}_{int(datetime.now(timezone.utc).timestamp())}.txt"
            email_dir = os.path.join(UPLOAD_DIR, "emails")
            os.makedirs(email_dir, exist_ok=True)
            filepath = os.path.join(email_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"From: {msg.get('From', '')}\n")
                f.write(f"Subject: {subject}\n")
                f.write(f"Date: {msg.get('Date', '')}\n\n")
                f.write(body)

            # Mark as read
            mail.store(msg_id, "+FLAGS", "\\Seen")

            _fire_tasks(schedule, db, trigger_context=f"email: {subject} | file: emails/{filename}")

        mail.logout()

    except Exception as e:
        print(f"[trigger_poller] IMAP error for schedule {schedule.id}: {e}")
