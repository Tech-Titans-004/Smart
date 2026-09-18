
        const API_BASE = '/api';
        
        let user = JSON.parse(localStorage.getItem('user') || 'null');

        function updateNav() {
            if (user) {
                document.getElementById('navbar').classList.remove('hidden');
                document.getElementById('nav-role').innerText = user.role.toUpperCase();
                // Show AI tab for both patients and doctors now!
                document.getElementById('nav-ai').classList.remove('hidden');
            } else {
                document.getElementById('navbar').classList.add('hidden');
            }
        }

        function init() {
            updateNav();
            if (user) {
                showPage('dashboard');
            } else {
                showPage('login');
            }
        }

        async function login(e) {
            e.preventDefault();
            const email = document.getElementById('login_email').value;
            const pwd = document.getElementById('login_pwd').value;
            
            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pwd })
                });
                const data = await response.json();
                
                if (response.ok) {
                    user = data;
                    localStorage.setItem('user', JSON.stringify(user));
                    init();
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (err) {
                alert('Error during login');
            }
        }

        async function loginWithGoogle(e) {
            e.preventDefault();
            const email = document.getElementById('goog_email').value;
            const name = document.getElementById('goog_name').value;
            const role = document.getElementById('goog_role').value;
            
            try {
                const response = await fetch(`${API_BASE}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, name: name, role: role })
                });
                const data = await response.json();
                
                if (response.ok) {
                    user = data;
                    localStorage.setItem('user', JSON.stringify(user));
                    init();
                } else {
                    alert(data.message || 'Google Login failed');
                }
            } catch (err) {
                alert('Error during Google login');
            }
        }

        async function register(e) {
            e.preventDefault();
            const payload = {
                name: document.getElementById('reg_name').value,
                email: document.getElementById('reg_email').value,
                password: document.getElementById('reg_pwd').value,
                role: document.getElementById('reg_role').value
            };
            
            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                
                if (response.ok) {
                    alert('Registration successful! You can now log in.');
                    showPage('login');
                } else {
                    alert(data.message || 'Registration failed');
                }
            } catch (err) {
                alert('Error during registration');
            }
        }

        function logout() {
            user = null;
            localStorage.removeItem('user');
            init();
        }

        let currentChatUserId = null;
        let chatInterval = null;

        function showPage(page) {
            const content = document.getElementById('main-content');
            
            // Clear any active chat interval
            if (chatInterval) {
                clearInterval(chatInterval);
                chatInterval = null;
            }
            
            if (page === 'login') {
                content.innerHTML = `
                    <div class="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                        <div class="text-center mb-6">
                            <h2 class="text-2xl font-bold text-blue-800 tracking-tight">National Health Portal</h2>
                            <p class="mt-2 text-sm text-gray-500 font-medium">Secure Digital Patient Care</p>
                        </div>
                        
                        <div class="flex border-b border-gray-200 mb-6">
                            <button class="w-1/2 py-2 font-bold text-blue-600 border-b-2 border-blue-600">Sign In</button>
                            <button onclick="showPage('register')" class="w-1/2 py-2 font-bold text-gray-500 hover:text-gray-700">Sign Up</button>
                        </div>
                        
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h4 class="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Hackathon Judge Testing IDs</h4>
                            <div class="text-sm text-blue-900 grid grid-cols-2 gap-2">
                                <div><span class="font-semibold">Patient:</span> patient@test.com</div>
                                <div><span class="font-semibold">Password:</span> judge123</div>
                                <div class="col-span-2 border-t border-blue-200 my-1"></div>
                                <div><span class="font-semibold">Doctor:</span> doctor@test.com</div>
                                <div><span class="font-semibold">Password:</span> judge123</div>
                            </div>
                        </div>

                        <form onsubmit="login(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" id="login_email" class="mt-1 p-2.5 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Password</label>
                                <input type="password" id="login_pwd" class="mt-1 p-2.5 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <button type="submit" class="w-full py-2.5 px-4 mt-4 text-white font-medium bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md">Sign In</button>
                        </form>

                        <div class="relative my-6">
                            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div>
                            <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">Or</span></div>
                        </div>
                        
                        <button onclick="showPage('google_mock')" class="w-full py-2.5 px-4 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center justify-center">
                            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            Continue with Google
                        </button>
                    </div>
                `;
            }
            else if (page === 'google_mock') {
                content.innerHTML = `
                    <div class="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                        <div class="text-center mb-6">
                            <svg class="w-10 h-10 mx-auto mb-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            <h2 class="text-2xl font-bold text-gray-800 tracking-tight">Complete Google Login</h2>
                            <p class="mt-1 text-sm text-gray-500">Choose your username and role to proceed.</p>
                        </div>
                        <form onsubmit="loginWithGoogle(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Google Email</label>
                                <input type="email" id="goog_email" placeholder="example@gmail.com" class="mt-1 p-2.5 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Set Username / Full Name</label>
                                <input type="text" id="goog_name" class="mt-1 p-2.5 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Account Role</label>
                                <select id="goog_role" class="mt-1 p-2.5 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                                    <option value="patient">Patient</option>
                                    <option value="doctor">Medical Professional (Doctor)</option>
                                </select>
                            </div>
                            <button type="submit" class="w-full py-2.5 px-4 mt-4 text-white font-medium bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md">Continue</button>
                            <button type="button" onclick="showPage('login')" class="w-full py-2.5 px-4 mt-2 text-gray-600 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                        </form>
                    </div>
                `;
            }
            else if (page === 'register') {
                content.innerHTML = `
                    <div class="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                        <div class="text-center mb-6">
                            <h2 class="text-2xl font-bold text-blue-800 tracking-tight">Portal Registration</h2>
                            <p class="mt-1 text-sm text-gray-500">Create your secure digital health account</p>
                        </div>
                        
                        <div class="flex border-b border-gray-200 mb-6">
                            <button onclick="showPage('login')" class="w-1/2 py-2 font-bold text-gray-500 hover:text-gray-700">Sign In</button>
                            <button class="w-1/2 py-2 font-bold text-blue-600 border-b-2 border-blue-600">Sign Up</button>
                        </div>
                        
                        <form onsubmit="register(event)" class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" id="reg_name" class="mt-1 p-2 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" id="reg_email" class="mt-1 p-2 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Password</label>
                                <input type="password" id="reg_pwd" class="mt-1 p-2 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Account Role</label>
                                <select id="reg_role" class="mt-1 p-2 w-full border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required>
                                    <option value="patient">Patient</option>
                                    <option value="doctor">Medical Professional (Doctor)</option>
                                </select>
                            </div>
                            <button type="submit" class="w-full py-2 px-4 text-white font-medium bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md mt-4">Create Account</button>
                        </form>
                    </div>
                `;
            }
            else if (page === 'dashboard') {
                const profilePic = user.profile_pic_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=0D8ABC&color=fff&size=128';
                content.innerHTML = `
                    <div class="max-w-7xl w-full">
                        <div class="mb-6 flex justify-between items-end border-b pb-4">
                            <div class="flex items-center gap-4">
                                <img src="${profilePic}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-200">
                                <div>
                                    <h2 class="text-3xl font-bold text-gray-800">Welcome, ${user.name}</h2>
                                    <p class="text-sm text-gray-500 uppercase tracking-wide mt-1">${user.role === 'doctor' ? 'Medical Professional Dashboard' : 'Patient Care Dashboard'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
                                <h3 class="text-xl font-medium text-gray-800 mb-2">Your Secure Digital Hub</h3>
                                <p class="text-gray-600 leading-relaxed mb-4">You are authenticated via the National Health Portal. From here, you can manage your profile, medical records, and referrals securely.</p>
                                <button onclick="showPage('profile')" class="text-blue-600 font-medium hover:underline">Update Profile &rarr;</button>
                            </div>
                            
                            <div class="bg-blue-600 shadow-md border border-blue-700 rounded-xl p-8 text-white flex flex-col justify-center items-start">
                                <div class="flex items-center mb-3">
                                    <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                    <h3 class="text-2xl font-bold">Live Interaction</h3>
                                </div>
                                <p class="text-blue-100 leading-relaxed mb-6">Connect instantly. ${user.role === 'doctor' ? 'Message your patients securely to provide guidance and follow-ups.' : 'Message verified doctors securely to ask for medical guidance.'}</p>
                                <button onclick="showPage('chat')" class="bg-white text-blue-700 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition shadow-sm w-full md:w-auto">
                                    Open Chat Module
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            else if (page === 'ai') {
                content.innerHTML = `
                    <div class="max-w-3xl w-full">
                        <div class="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
                            <h2 class="text-2xl font-bold mb-4 flex items-center text-blue-800"><svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> AI Healthcare Assistant</h2>
                            <p class="text-gray-600 mb-6">Describe your symptoms below, and our AI will provide guidance and recommend a specialist.</p>
                            <textarea id="ai-symptoms" class="w-full p-4 border rounded-lg focus:outline-none focus:border-blue-500 min-h-[150px]" placeholder="E.g., I have been experiencing a mild headache and fever for the past 2 days..."></textarea>
                            <button onclick="analyzeSymptoms()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 w-full">Analyze Symptoms</button>
                            <div id="ai-response" class="mt-6 hidden bg-gray-50 border p-6 rounded-lg"></div>
                        </div>
                    </div>
                `;
            }
            else if (page === 'appointments') {
                content.innerHTML = `<div class="max-w-4xl w-full bg-white shadow-sm border rounded-xl p-8" id="app-content">Loading...</div>`;
                loadAppointments();
            }
            else if (page === 'prescriptions') {
                content.innerHTML = `<div class="max-w-4xl w-full bg-white shadow-sm border rounded-xl p-8" id="rx-content">Loading...</div>`;
                loadPrescriptions();
            }
            else if (page === 'referrals') {
                content.innerHTML = `<div class="max-w-4xl w-full bg-white shadow-sm border rounded-xl p-8" id="ref-content">Loading...</div>`;
                loadReferrals();
            }
            else if (page === 'chat') {
                content.innerHTML = `
                    <div class="max-w-7xl w-full h-[80vh] flex bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                        <!-- Sidebar -->
                        <div class="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                            <div class="p-4 border-b border-gray-200 bg-white">
                                <h3 class="text-lg font-bold text-gray-800">${user.role === 'patient' ? 'Doctors' : 'Patients'} Directory</h3>
                            </div>
                            <div class="flex-grow overflow-y-auto" id="chat-users-list">
                                <div class="p-4 text-center text-gray-500">Loading directory...</div>
                            </div>
                        </div>
                        <!-- Chat Window -->
                        <div class="w-2/3 flex flex-col bg-white">
                            <div class="p-4 border-b border-gray-200 bg-blue-50 flex items-center">
                                <h3 class="text-lg font-bold text-gray-800" id="chat-target-name">Select someone to chat</h3>
                            </div>
                            <div class="flex-grow overflow-y-auto p-4 space-y-4" id="chat-messages">
                                <div class="text-center text-gray-500 mt-10">Your messages will appear here.</div>
                            </div>
                            <div class="p-4 border-t border-gray-200 bg-gray-50">
                                <form onsubmit="sendChatMessage(event)" class="flex gap-2">
                                    <label class="cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 flex items-center" title="Upload Document/Photo">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                        <input type="file" id="chat-file-input" class="hidden" onchange="uploadChatFile(event)" disabled>
                                    </label>
                                    <input type="text" id="chat-input" class="flex-grow p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Type a message..." disabled>
                                    <button type="submit" id="chat-send-btn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50" disabled>Send</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `;
                loadChatUsers();
            }
            else if (page === 'profile') {
                content.innerHTML = `
                    <div class="max-w-3xl w-full">
                        <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Professional Profile</h2>
                        <div class="bg-white shadow-sm border border-gray-200 rounded-xl p-8" id="profile-container">
                            <div class="flex justify-center"><p class="text-gray-500 font-medium animate-pulse">Loading secure profile...</p></div>
                        </div>
                    </div>
                `;
                loadProfile();
            }
        }

        // --- Chat Functions ---
        async function loadChatUsers() {
            try {
                const response = await fetch(`${API_BASE}/chat/users`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const usersList = await response.json();
                
                const listEl = document.getElementById('chat-users-list');
                if (usersList.length === 0) {
                    listEl.innerHTML = '<div class="p-4 text-center text-gray-500">No users found.</div>';
                    return;
                }
                
                listEl.innerHTML = usersList.map(u => `
                    <div class="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition" onclick="openChat(${u.id}, '${u.name}')">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">${u.name.charAt(0)}</div>
                        <div>
                            <div class="font-medium text-gray-800">${u.name}</div>
                            <div class="text-xs text-gray-500">${u.email}</div>
                        </div>
                    </div>
                `).join('');
            } catch (err) {
                console.error(err);
            }
        }

        async function openChat(userId, userName) {
            currentChatUserId = userId;
            document.getElementById('chat-target-name').innerText = `Chatting with ${userName}`;
            document.getElementById('chat-input').disabled = false;
            document.getElementById('chat-send-btn').disabled = false;
            document.getElementById('chat-file-input').disabled = false;
            
            await fetchMessages();
            
            if (chatInterval) clearInterval(chatInterval);
            chatInterval = setInterval(fetchMessages, 3000); // Polling for new messages
        }

        async function fetchMessages() {
            if (!currentChatUserId) return;
            
            try {
                const response = await fetch(`${API_BASE}/chat/${currentChatUserId}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const messages = await response.json();
                
                const msgEl = document.getElementById('chat-messages');
                
                if (messages.length === 0) {
                    msgEl.innerHTML = '<div class="text-center text-gray-500 mt-10">No messages yet. Say hi!</div>';
                    return;
                }
                
                msgEl.innerHTML = messages.map(m => {
                    const isMe = m.sender_id === user.id;
                    let attachmentHTML = '';
                    if (m.file_url) {
                        const isImage = m.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        if (isImage) {
                            attachmentHTML = `<img src="${m.file_url}" class="max-w-xs mt-2 rounded-lg cursor-pointer hover:opacity-90" onclick="window.open('${m.file_url}', '_blank')">`;
                        } else {
                            attachmentHTML = `<a href="${m.file_url}" target="_blank" class="flex items-center mt-2 ${isMe ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'} underline"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>View Document</a>`;
                        }
                    }
                    return `
                        <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                            <div class="max-w-[75%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}">
                                ${m.content ? m.content : ''}
                                ${attachmentHTML}
                            </div>
                        </div>
                    `;
                }).join('');
                
                // Scroll to bottom
                msgEl.scrollTop = msgEl.scrollHeight;
            } catch (err) {
                console.error(err);
            }
        }

        async function sendChatMessage(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const content = input.value.trim();
            if (!content || !currentChatUserId) return;
            
            try {
                const response = await fetch(`${API_BASE}/chat/${currentChatUserId}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({ content: content })
                });
                
                if (response.ok) {
                    input.value = '';
                    fetchMessages();
                } else {
                    alert('Failed to send message');
                }
            } catch (err) {
                console.error(err);
                alert('Error sending message');
            }
        }

        async function uploadChatFile(e) {
            const file = e.target.files[0];
            if (!file || !currentChatUserId) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                // 1. Upload the file
                const uploadRes = await fetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${user.token}` },
                    body: formData
                });
                const uploadData = await uploadRes.json();
                
                if (uploadRes.ok) {
                    // 2. Send the message with the file_url
                    await fetch(`${API_BASE}/chat/${currentChatUserId}`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token}`
                        },
                        body: JSON.stringify({ content: '', file_url: uploadData.file_url })
                    });
                    
                    fetchMessages();
                } else {
                    alert(uploadData.message || 'File upload failed');
                }
            } catch (err) {
                console.error(err);
                alert('Error uploading file');
            }
            e.target.value = ''; // Reset input
        }

        async function loadProfile() {
            try {
                const response = await fetch(`${API_BASE}/user/profile`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const data = await response.json();
                
                const profile = data.profile || {};
                const profilePic = data.profile_pic_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name) + '&background=0D8ABC&color=fff&size=128';
                
                let html = `
                    <div class="flex flex-col items-center mb-6">
                        <img src="${profilePic}" id="profile-pic-preview" class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4">
                        <label class="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded font-medium hover:bg-blue-200 transition text-sm">
                            Change Photo
                            <input type="file" class="hidden" accept="image/*" onchange="uploadProfilePic(event)">
                        </label>
                    </div>
                    <form onsubmit="saveProfile(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium">Name</label>
                            <input type="text" id="prof_name" value="${data.name || ''}" class="mt-1 p-2 w-full border rounded" required>
                        </div>
                `;

                if (data.role === 'patient') {
                    html += `
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium">Age</label>
                                <input type="number" id="prof_age" value="${profile.age || ''}" class="mt-1 p-2 w-full border rounded">
                            </div>
                            <div>
                                <label class="block text-sm font-medium">Gender</label>
                                <input type="text" id="prof_gender" value="${profile.gender || ''}" class="mt-1 p-2 w-full border rounded">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Location</label>
                            <input type="text" id="prof_location" value="${profile.location || ''}" class="mt-1 p-2 w-full border rounded">
                        </div>
                    `;
                } else if (data.role === 'doctor') {
                    html += `
                        <div>
                            <label class="block text-sm font-medium">Specialization</label>
                            <input type="text" id="prof_spec" value="${profile.specialization || ''}" class="mt-1 p-2 w-full border rounded">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Hospital/Clinic</label>
                            <input type="text" id="prof_hosp" value="${profile.hospital_clinic || ''}" class="mt-1 p-2 w-full border rounded">
                        </div>
                    `;
                }

                html += `
                        <button type="submit" class="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700">Save Profile</button>
                    </form>
                `;
                document.getElementById('profile-container').innerHTML = html;
            } catch (err) {
                console.error(err);
                document.getElementById('profile-container').innerHTML = `<p class="text-red-500">Error loading profile</p>`;
            }
        }

        async function uploadProfilePic(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                // Upload image
                const uploadRes = await fetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${user.token}` },
                    body: formData
                });
                const uploadData = await uploadRes.json();
                
                if (uploadRes.ok) {
                    // Update profile with new URL
                    document.getElementById('profile-pic-preview').src = uploadData.file_url;
                    await fetch(`${API_BASE}/user/profile`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token}`
                        },
                        body: JSON.stringify({ profile_pic_url: uploadData.file_url })
                    });
                    
                    user.profile_pic_url = uploadData.file_url;
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    alert('Profile picture updated!');
                } else {
                    alert('Failed to upload picture');
                }
            } catch (err) {
                console.error(err);
                alert('Error uploading picture');
            }
        }

        async function saveProfile(e) {
            e.preventDefault();
            
            const payload = {
                name: document.getElementById('prof_name').value
            };
            
            if (user.role === 'patient') {
                payload.age = document.getElementById('prof_age').value;
                payload.gender = document.getElementById('prof_gender').value;
                payload.location = document.getElementById('prof_location').value;
            } else if (user.role === 'doctor') {
                payload.specialization = document.getElementById('prof_spec').value;
                payload.hospital_clinic = document.getElementById('prof_hosp').value;
            }

            try {
                const response = await fetch(`${API_BASE}/user/profile`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    alert('Profile updated successfully!');
                    user.name = payload.name;
                    localStorage.setItem('user', JSON.stringify(user));
                } else {
                    alert('Error updating profile');
                }
            } catch (err) {
                console.error(err);
                alert('Error updating profile');
            }
        }

        async function analyzeSymptoms() {
            const sym = document.getElementById('ai-symptoms').value;
            if(!sym) return;
            const btn = event.target;
            btn.innerText = 'Analyzing...';
            btn.disabled = true;
            try {
                const res = await fetch(`${API_BASE}/ai/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({ symptoms: sym })
                });
                const data = await res.json();
                if(res.ok) {
                    const el = document.getElementById('ai-response');
                    el.classList.remove('hidden');
                    let color = data.urgency_level === 'urgent' ? 'text-red-600' : 'text-blue-600';
                    el.innerHTML = `
                        <h4 class="font-bold ${color} mb-2">Urgency: ${data.urgency_level.toUpperCase()}</h4>
                        <p class="text-gray-800 mb-2">${data.ai_response}</p>
                        <p class="text-sm text-gray-500 font-semibold">Suggested Department: ${data.suggested_department}</p>
                    `;
                }
            } catch(e) { console.error(e); }
            btn.innerText = 'Analyze Symptoms';
            btn.disabled = false;
        }

        async function loadAppointments() {
            try {
                const res = await fetch(`${API_BASE}/appointments`, { headers: { 'Authorization': `Bearer ${user.token}` }});
                const data = await res.json();
                let html = '<h2 class="text-2xl font-bold mb-4">Appointments</h2>';
                
                if (user.role === 'patient') {
                    html += `
                        <div class="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                            <h3 class="font-bold mb-2">Request Appointment</h3>
                            <select id="app_doc_id" class="p-2 border rounded mb-2 w-full" required><option value="">Select Doctor...</option></select>
                            <input type="date" id="app_date" class="p-2 border rounded mb-2 w-full">
                            <input type="time" id="app_time" class="p-2 border rounded mb-2 w-full">
                            <button onclick="reqAppointment()" class="bg-blue-600 text-white px-4 py-2 rounded">Submit Request</button>
                        </div>
                    `;
                    setTimeout(populateUserDropdowns, 100);
                }

                if(data.length === 0) {
                    html += '<p>No appointments found.</p>';
                } else {
                    html += '<ul class="space-y-3">';
                    data.forEach(a => {
                        const person = user.role === 'patient' ? `Dr. ${a.doctor_name}` : `Patient: ${a.patient_name}`;
                        html += `
                            <li class="p-4 border rounded shadow-sm flex justify-between items-center">
                                <div>
                                    <div class="font-bold text-lg">${person}</div>
                                    <div class="text-gray-600">${a.date} at ${a.time}</div>
                                    <div class="text-sm font-semibold mt-1">Status: <span class="text-blue-600 uppercase">${a.status}</span></div>
                                </div>
                                ${user.role === 'doctor' && a.status === 'pending' ? `
                                    <div class="space-x-2">
                                        <button onclick="updateApp(${a.id}, 'approved')" class="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                                        <button onclick="updateApp(${a.id}, 'rejected')" class="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                                    </div>
                                ` : ''}
                            </li>
                        `;
                    });
                    html += '</ul>';
                }
                document.getElementById('app-content').innerHTML = html;
            } catch(e) { console.error(e); }
        }

        async function reqAppointment() {
            try {
                await fetch(`${API_BASE}/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({
                        doctor_id: document.getElementById('app_doc_id').value,
                        date: document.getElementById('app_date').value,
                        time: document.getElementById('app_time').value
                    })
                });
                loadAppointments();
            } catch(e) { console.error(e); }
        }

        async function updateApp(id, status) {
            try {
                await fetch(`${API_BASE}/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({ appointment_id: id, status: status })
                });
                loadAppointments();
            } catch(e) { console.error(e); }
        }

        async function loadPrescriptions() {
            try {
                const res = await fetch(`${API_BASE}/prescriptions`, { headers: { 'Authorization': `Bearer ${user.token}` }});
                const data = await res.json();
                let html = '<h2 class="text-2xl font-bold mb-4">Prescriptions</h2>';
                
                if (user.role === 'doctor') {
                    html += `
                        <div class="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                            <h3 class="font-bold mb-2">Write Prescription</h3>
                            <select id="rx_pat_id" class="p-2 border rounded mb-2 w-full" required><option value="">Select Patient...</option></select>
                            <input type="text" id="rx_med" placeholder="Medicine Name" class="p-2 border rounded mb-2 w-full">
                            <input type="text" id="rx_dose" placeholder="Dosage (e.g. 500mg)" class="p-2 border rounded mb-2 w-1/2">
                            <input type="text" id="rx_time" placeholder="Frequency (e.g. 2 times/day)" class="p-2 border rounded mb-2 w-1/2">
                            <input type="text" id="rx_dur" placeholder="Duration (e.g. 5 days)" class="p-2 border rounded mb-2 w-full">
                            <button onclick="writeRx()" class="bg-blue-600 text-white px-4 py-2 rounded">Add Prescription</button>
                        </div>
                    `;
                    setTimeout(populateUserDropdowns, 100);
                }

                if(data.length === 0) {
                    html += '<p>No prescriptions found.</p>';
                } else {
                    html += '<ul class="space-y-3">';
                    data.forEach(p => {
                        const person = user.role === 'patient' ? `Dr. ${p.doctor_name}` : p.doctor_name; // I mocked it as patient_name + ' (Patient)' in backend
                        html += `
                            <li class="p-4 border border-blue-200 bg-blue-50 rounded shadow-sm">
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="font-bold text-xl text-blue-800">${p.medicine_name} - ${p.dosage}</h3>
                                    <span class="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">${person}</span>
                                </div>
                                <p class="text-gray-700"><strong>Frequency:</strong> ${p.timing_frequency}</p>
                                <p class="text-gray-700"><strong>Duration:</strong> ${p.duration}</p>
                            </li>
                        `;
                    });
                    html += '</ul>';
                }
                document.getElementById('rx-content').innerHTML = html;
            } catch(e) { console.error(e); }
        }

        async function writeRx() {
            try {
                await fetch(`${API_BASE}/prescriptions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({
                        patient_id: document.getElementById('rx_pat_id').value,
                        medicine_name: document.getElementById('rx_med').value,
                        dosage: document.getElementById('rx_dose').value,
                        timing_frequency: document.getElementById('rx_time').value,
                        duration: document.getElementById('rx_dur').value
                    })
                });
                alert('Prescription saved!');
                document.getElementById('rx_med').value = '';
                loadPrescriptions();
            } catch(e) { console.error(e); }
        }

        async function loadReferrals() {
            try {
                const res = await fetch(`${API_BASE}/referrals`, { headers: { 'Authorization': `Bearer ${user.token}` }});
                const data = await res.json();
                let html = '<h2 class="text-2xl font-bold mb-4">Referrals</h2>';
                
                if (user.role === 'doctor') {
                    html += `
                        <div class="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                            <h3 class="font-bold mb-2">Refer Patient</h3>
                            <select id="ref_pat_id" class="p-2 border rounded mb-2 w-full" required><option value="">Select Patient...</option></select>
                            <input type="text" id="ref_dept" placeholder="Department (e.g. Cardiology)" class="p-2 border rounded mb-2 w-full">
                            <textarea id="ref_reason" placeholder="Reason for referral..." class="p-2 border rounded mb-2 w-full"></textarea>
                            <button onclick="writeRef()" class="bg-blue-600 text-white px-4 py-2 rounded">Submit Referral</button>
                        </div>
                    `;
                    setTimeout(populateUserDropdowns, 100);
                }

                if(data.length === 0) {
                    html += '<p>No referrals found.</p>';
                } else {
                    html += '<ul class="space-y-3">';
                    data.forEach(r => {
                        const person = user.role === 'patient' ? `From Dr. ${r.doctor_name}` : `For ${r.doctor_name}`;
                        html += `
                            <li class="p-4 border border-green-200 bg-green-50 rounded shadow-sm">
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="font-bold text-xl text-green-800">Referral: ${r.department}</h3>
                                    <span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">${person}</span>
                                </div>
                                <p class="text-gray-700"><strong>Reason:</strong> ${r.reason}</p>
                                <p class="text-xs text-gray-500 mt-2">Ref ID: ${r.referral_uid}</p>
                            </li>
                        `;
                    });
                    html += '</ul>';
                }
                document.getElementById('ref-content').innerHTML = html;
            } catch(e) { console.error(e); }
        }

        async function writeRef() {
            try {
                await fetch(`${API_BASE}/referrals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({
                        patient_id: document.getElementById('ref_pat_id').value,
                        department: document.getElementById('ref_dept').value,
                        reason: document.getElementById('ref_reason').value
                    })
                });
                alert('Referral created!');
                document.getElementById('ref_dept').value = '';
                document.getElementById('ref_reason').value = '';
                loadReferrals();
            } catch(e) { console.error(e); }
        }

        async function populateUserDropdowns() {
            try {
                const res = await fetch(`${API_BASE}/chat/users`, { headers: { 'Authorization': `Bearer ${user.token}` }});
                const users = await res.json();
                const selects = ['app_doc_id', 'rx_pat_id', 'ref_pat_id'];
                selects.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) {
                        users.forEach(u => {
                            let opt = document.createElement('option');
                            opt.value = u.id; // user_id
                            opt.textContent = \`\${u.name} (\${u.email})\`;
                            el.appendChild(opt);
                        });
                    }
                });
            } catch(e) { console.error(e); }
        }

        // Initialize app
        init();
    