from flask import Flask, render_template, request, jsonify
import jwt
import datetime
from database import init_db, get_db_connection
import os
import sys

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

app.config['SECRET_KEY'] = 'super_secret_hackathon_key_2026'

init_db()

def generate_token(user_id, role, email):
    payload = {
        'id': user_id,
        'role': role,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            current_user = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

@app.route('/')
def index():
    return render_template('index.html')

from werkzeug.utils import secure_filename
from flask import send_from_directory
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        return jsonify({'file_url': f'/uploads/{filename}'})

@app.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(UPLOAD_FOLDER, name)

from werkzeug.security import generate_password_hash, check_password_hash

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role')

    if not all([email, password, name, role]):
        return jsonify({'message': 'All fields are required'}), 400

    if role not in ['patient', 'doctor']:
        return jsonify({'message': 'Invalid role'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'message': 'Email already registered'}), 400

    password_hash = generate_password_hash(password)
    
    try:
        cursor.execute("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)", 
                       (email, password_hash, name, role))
        user_id = cursor.lastrowid
        
        if role == 'patient':
            cursor.execute("INSERT INTO patients (user_id) VALUES (?)", (user_id,))
        elif role == 'doctor':
            cursor.execute("INSERT INTO doctors (user_id, is_verified) VALUES (?, ?)", (user_id, 0))
            
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'message': 'Database error'}), 500
        
    conn.close()
    return jsonify({'message': 'Registration successful. Please log in.'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({'message': 'Email and password required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    token = generate_token(user['id'], user['role'], user['email'])
    
    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role'],
        'profile_pic_url': user['profile_pic_url'],
        'token': token
    })


@app.route('/api/auth/google', methods=['POST'])
def google_login():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    role = data.get('role')

    if not all([email, name, role]):
        return jsonify({'message': 'Email, name, and role are required for Google Login'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if not user:
        dummy_password = generate_password_hash("google_oauth_dummy")
        
        try:
            cursor.execute("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)", 
                           (email, dummy_password, name, role))
            user_id = cursor.lastrowid
            
            if role == 'patient':
                cursor.execute("INSERT INTO patients (user_id) VALUES (?)", (user_id,))
            elif role == 'doctor':
                cursor.execute("INSERT INTO doctors (user_id, is_verified) VALUES (?, ?)", (user_id, 0))
                
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            
        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({'message': 'Database error during Google login'}), 500
            
    conn.close()
    
    token = generate_token(user['id'], user['role'], user['email'])
    
    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role'],
        'profile_pic_url': user['profile_pic_url'],
        'token': token
    })





# --- CHAT APIs ---
@app.route('/api/chat/users', methods=['GET'])
@token_required
def get_chat_users(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if current_user['role'] == 'patient':
        # Patients can chat with verified doctors
        cursor.execute("SELECT id, name, email, role FROM users WHERE role = 'doctor'")
    else:
        # Doctors can chat with any patient
        cursor.execute("SELECT id, name, email, role FROM users WHERE role = 'patient'")
        
    users = cursor.fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route('/api/chat/<int:target_user_id>', methods=['GET'])
@token_required
def get_chat_messages(current_user, target_user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    ''', (current_user['id'], target_user_id, target_user_id, current_user['id']))
    
    messages = cursor.fetchall()
    conn.close()
    return jsonify([dict(m) for m in messages])

@app.route('/api/chat/<int:target_user_id>', methods=['POST'])
@token_required
def send_chat_message(current_user, target_user_id):
    data = request.json
    content = data.get('content', '')
    file_url = data.get('file_url', None)
    
    if not content and not file_url:
        return jsonify({'message': 'Message content or file is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO messages (sender_id, receiver_id, content, file_url) VALUES (?, ?, ?, ?)",
                   (current_user['id'], target_user_id, content, file_url))
    msg_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute("SELECT * FROM messages WHERE id = ?", (msg_id,))
    msg = cursor.fetchone()
    conn.close()
    
    return jsonify(dict(msg))


@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, email, name, role, profile_pic_url FROM users WHERE id = ?", (current_user['id'],))
    user = cursor.fetchone()
    
    profile_data = {}
    if current_user['role'] == 'patient':
        cursor.execute("SELECT * FROM patients WHERE user_id = ?", (current_user['id'],))
        profile = cursor.fetchone()
        if profile:
            profile_data = dict(profile)
    elif current_user['role'] == 'doctor':
        cursor.execute("SELECT * FROM doctors WHERE user_id = ?", (current_user['id'],))
        profile = cursor.fetchone()
        if profile:
            profile_data = dict(profile)
            
    conn.close()
    
    user_data = dict(user)
    user_data['profile'] = profile_data
    return jsonify(user_data)

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if 'name' in data:
        cursor.execute("UPDATE users SET name = ? WHERE id = ?", (data['name'], current_user['id']))
        
    if 'profile_pic_url' in data:
        cursor.execute("UPDATE users SET profile_pic_url = ? WHERE id = ?", (data['profile_pic_url'], current_user['id']))
        
    if current_user['role'] == 'patient':
        cursor.execute('''
            UPDATE patients 
            SET age = ?, gender = ?, location = ?, basic_medical_info = ?, allergies = ?, current_medicines = ?, emergency_contact = ?
            WHERE user_id = ?
        ''', (data.get('age'), data.get('gender'), data.get('location'), data.get('basic_medical_info'), 
              data.get('allergies'), data.get('current_medicines'), data.get('emergency_contact'), current_user['id']))
    elif current_user['role'] == 'doctor':
        cursor.execute('''
            UPDATE doctors 
            SET qualification = ?, specialization = ?, hospital_clinic = ?, contact_information = ?
            WHERE user_id = ?
        ''', (data.get('qualification'), data.get('specialization'), data.get('hospital_clinic'), 
              data.get('contact_information'), current_user['id']))
              
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Profile updated successfully'})

# --- APPOINTMENTS API ---
@app.route('/api/appointments', methods=['GET', 'POST'])
@token_required
def handle_appointments(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        if current_user['role'] == 'patient':
            cursor.execute("SELECT id FROM patients WHERE user_id = ?", (current_user['id'],))
            patient = cursor.fetchone()
            # data['doctor_id'] is actually the target doctor's user_id from the dropdown
            cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (data['doctor_id'],))
            target_doctor = cursor.fetchone()
            if patient and target_doctor:
                cursor.execute("INSERT INTO appointments (patient_id, doctor_id, date, time) VALUES (?, ?, ?, ?)",
                               (patient['id'], target_doctor['id'], data['date'], data['time']))
                conn.commit()
                conn.close()
                return jsonify({'message': 'Appointment requested'})
        elif current_user['role'] == 'doctor' and 'status' in data:
            cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (data['status'], data['appointment_id']))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Appointment status updated'})
            
    # GET
    appointments = []
    if current_user['role'] == 'patient':
        cursor.execute("SELECT id FROM patients WHERE user_id = ?", (current_user['id'],))
        patient = cursor.fetchone()
        if patient:
            cursor.execute('''
                SELECT a.*, u.name as doctor_name 
                FROM appointments a 
                JOIN doctors d ON a.doctor_id = d.id 
                JOIN users u ON d.user_id = u.id 
                WHERE a.patient_id = ?
            ''', (patient['id'],))
            appointments = [dict(row) for row in cursor.fetchall()]
    elif current_user['role'] == 'doctor':
        cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (current_user['id'],))
        doctor = cursor.fetchone()
        if doctor:
            cursor.execute('''
                SELECT a.*, u.name as patient_name 
                FROM appointments a 
                JOIN patients p ON a.patient_id = p.id 
                JOIN users u ON p.user_id = u.id 
                WHERE a.doctor_id = ?
            ''', (doctor['id'],))
            appointments = [dict(row) for row in cursor.fetchall()]
            
    conn.close()
    return jsonify(appointments)

# --- PRESCRIPTIONS API ---
@app.route('/api/prescriptions', methods=['GET', 'POST'])
@token_required
def handle_prescriptions(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'POST' and current_user['role'] == 'doctor':
        data = request.json
        cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (current_user['id'],))
        doctor = cursor.fetchone()
        # data['patient_id'] is the target patient's user_id from the dropdown
        cursor.execute("SELECT id FROM patients WHERE user_id = ?", (data['patient_id'],))
        target_patient = cursor.fetchone()
        if doctor and target_patient:
            cursor.execute('''
                INSERT INTO medicines (patient_id, added_by_doctor_id, medicine_name, dosage, timing_frequency, duration, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (target_patient['id'], doctor['id'], data['medicine_name'], data['dosage'], data['timing_frequency'], data['duration'], data.get('notes', '')))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Prescription added'})
            
            # GET
    prescriptions = []
    if current_user['role'] == 'patient':
        cursor.execute("SELECT id FROM patients WHERE user_id = ?", (current_user['id'],))
        patient = cursor.fetchone()
        if patient:
            cursor.execute('''
                SELECT m.*, u.name as doctor_name 
                FROM medicines m 
                JOIN doctors d ON m.added_by_doctor_id = d.id 
                JOIN users u ON d.user_id = u.id 
                WHERE m.patient_id = ?
            ''', (patient['id'],))
            prescriptions = [dict(row) for row in cursor.fetchall()]
    elif current_user['role'] == 'doctor':
        cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (current_user['id'],))
        doctor = cursor.fetchone()
        if doctor:
            cursor.execute('''
                SELECT m.*, u.name as patient_name 
                FROM medicines m 
                JOIN patients p ON m.patient_id = p.id 
                JOIN users u ON p.user_id = u.id 
                WHERE m.added_by_doctor_id = ?
            ''', (doctor['id'],))
            # Since the frontend for doctor might not expect patient_name, I'll alias it as doctor_name just so the UI renders it cleanly as "Patient: Name"
            # Or better, just return patient_name and adjust the UI if needed
            rows = []
            for row in cursor.fetchall():
                d = dict(row)
                d['doctor_name'] = d['patient_name'] + ' (Patient)'
                rows.append(d)
            prescriptions = rows
            
    conn.close()
    return jsonify(prescriptions)

@app.route('/api/prescriptions/<int:prescription_id>', methods=['DELETE'])
@token_required
def delete_prescription(current_user, prescription_id):
    if current_user['role'] != 'doctor':
        return jsonify({'message': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (current_user['id'],))
    doctor = cursor.fetchone()
    
    if doctor:
        cursor.execute("DELETE FROM medicines WHERE id = ? AND added_by_doctor_id = ?", (prescription_id, doctor['id']))
        conn.commit()
        
    conn.close()
    return jsonify({'message': 'Medicine deleted successfully'})

# --- REFERRALS API ---
@app.route('/api/referrals', methods=['GET', 'POST'])
@token_required
def handle_referrals(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'POST' and current_user['role'] == 'doctor':
        data = request.json
        import uuid
        referral_uid = str(uuid.uuid4())[:8]
        cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (current_user['id'],))
        doctor = cursor.fetchone()
        # data['patient_id'] is the target patient's user_id from the dropdown
        cursor.execute("SELECT id FROM patients WHERE user_id = ?", (data['patient_id'],))
        target_patient = cursor.fetchone()
        
        if doctor and target_patient:
            cursor.execute('''
                INSERT INTO referrals (referral_uid, patient_id, referred_by_doctor_id, reason, department, priority)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (referral_uid, target_patient['id'], doctor['id'], data['reason'], data['department'], data.get('priority', 'medium')))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Patient referred successfully'})
            
    # GET
    referrals = []
    if current_user['role'] == 'patient':
        cursor.execute("SELECT id FROM patients WHERE user_id = ?", (current_user['id'],))
        patient = cursor.fetchone()
        if patient:
            cursor.execute('''
                SELECT r.*, u.name as doctor_name 
                FROM referrals r 
                JOIN doctors d ON r.referred_by_doctor_id = d.id 
                JOIN users u ON d.user_id = u.id 
                WHERE r.patient_id = ?
            ''', (patient['id'],))
            referrals = [dict(row) for row in cursor.fetchall()]
    elif current_user['role'] == 'doctor':
        cursor.execute("SELECT id FROM doctors WHERE user_id = ?", (current_user['id'],))
        doctor = cursor.fetchone()
        if doctor:
            cursor.execute('''
                SELECT r.*, u.name as patient_name 
                FROM referrals r 
                JOIN patients p ON r.patient_id = p.id 
                JOIN users u ON p.user_id = u.id 
                WHERE r.referred_by_doctor_id = ?
            ''', (doctor['id'],))
            rows = []
            for row in cursor.fetchall():
                d = dict(row)
                d['doctor_name'] = d['patient_name'] + ' (Patient)'
                rows.append(d)
            referrals = rows
            
    conn.close()
    return jsonify(referrals)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
