import sqlite3
import os

DB_PATH = "careconnect.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        # Check if the old schema with national_id exists, if so delete the DB to reset
        if os.path.exists(DB_PATH):
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Check for missing profile_pic_url
            cursor.execute("PRAGMA table_info(users)")
            user_cols = [info[1] for info in cursor.fetchall()]
            if 'profile_pic_url' not in user_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN profile_pic_url TEXT")
                conn.commit()
                
            # Check for appointments
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'")
            has_appointments = cursor.fetchone() is not None
            conn.close()
            if not has_appointments:
                os.remove(DB_PATH)
                print("Old database schema detected. Resetting database for appointments table.")
    except Exception as e:
        print(f"Error checking DB schema: {e}")

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
            profile_pic_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 1.5 messages (Chat System)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT,
            file_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES users(id),
            FOREIGN KEY(receiver_id) REFERENCES users(id)
        )
    ''')

    # 2. patients
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            age INTEGER,
            gender TEXT,
            location TEXT,
            basic_medical_info TEXT,
            allergies TEXT,
            current_medicines TEXT,
            emergency_contact TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 3. doctors
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            qualification TEXT,
            specialization TEXT,
            hospital_clinic TEXT,
            contact_information TEXT,
            is_verified BOOLEAN DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 4. facilities
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS facilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            departments TEXT,
            location TEXT NOT NULL,
            contact_info TEXT,
            is_demo BOOLEAN DEFAULT 1
        )
    ''')

    # 5. referrals
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referral_uid TEXT UNIQUE NOT NULL,
            patient_id INTEGER NOT NULL,
            referred_by_doctor_id INTEGER NOT NULL,
            receiving_facility_id INTEGER,
            reason TEXT NOT NULL,
            relevant_info TEXT,
            department TEXT,
            priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
            status TEXT DEFAULT 'Created' CHECK(status IN ('Created', 'Sent', 'Accepted', 'Appointment/Visit', 'Completed', 'Cancelled')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(referred_by_doctor_id) REFERENCES doctors(id),
            FOREIGN KEY(receiving_facility_id) REFERENCES facilities(id)
        )
    ''')

    # 6. medicines
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            added_by_doctor_id INTEGER NOT NULL,
            medicine_name TEXT NOT NULL,
            dosage TEXT NOT NULL,
            timing_frequency TEXT NOT NULL,
            duration TEXT NOT NULL,
            notes TEXT,
            warnings TEXT,
            photo_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(added_by_doctor_id) REFERENCES doctors(id)
        )
    ''')

    # 7. medical_documents
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medical_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            uploaded_by_doctor_id INTEGER,
            document_type TEXT NOT NULL,
            file_url TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(uploaded_by_doctor_id) REFERENCES doctors(id)
        )
    ''')

    # 8. guidance_sessions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS guidance_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            symptoms TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            suggested_department TEXT,
            urgency_level TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    ''')

    # 9. notifications
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 9.5 appointments
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(doctor_id) REFERENCES doctors(id)
        )
    ''')

    # 10. audit_logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # Insert default testing accounts for Judges
    from werkzeug.security import generate_password_hash
    test_password = generate_password_hash("judge123")
    
    # Check if patient exists
    cursor.execute("SELECT id FROM users WHERE email = 'patient@test.com'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)", 
                       ('patient@test.com', test_password, 'Test Patient', 'patient'))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO patients (user_id) VALUES (?)", (user_id,))
        
    # Check if doctor exists
    cursor.execute("SELECT id FROM users WHERE email = 'doctor@test.com'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)", 
                       ('doctor@test.com', test_password, 'Dr. Test Doctor', 'doctor'))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO doctors (user_id, is_verified) VALUES (?, ?)", (user_id, 1))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
