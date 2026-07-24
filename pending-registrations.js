// ============================================
// PENDING REGISTRATIONS MANAGEMENT
// ============================================

const PENDING_REGISTRATIONS_KEY = 'dnyansindhu_pending_registrations';

// Get pending registrations from localStorage
function getPendingRegistrations() {
    const pending = localStorage.getItem(PENDING_REGISTRATIONS_KEY);
    return pending ? JSON.parse(pending) : [];
}

// Get count of pending registrations
function getPendingCount() {
    const pending = getPendingRegistrations();
    return pending.filter(r => r.status === 'pending').length;
}

// Save pending registrations
function savePendingRegistrations(registrations) {
    localStorage.setItem(PENDING_REGISTRATIONS_KEY, JSON.stringify(registrations));
}

// Generate unique student/teacher ID
function generateFinalId(type) {
    const prefix = type === 'student' ? 'STU' : 'TCH';
    const year = new Date().getFullYear();
    
    // Get existing IDs
    const existing = type === 'student'
        ? JSON.parse(localStorage.getItem('gs_students') || '[]')
        : JSON.parse(localStorage.getItem('gs_teachers') || '[]');
    
    // Find the highest number
    let maxNum = 0;
    existing.forEach(item => {
        const match = item.id.match(new RegExp(`${prefix}${year}(\\d+)`));
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    });
    
    // Generate new ID
    const newNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${year}${newNum}`;
}

// Generate username from name
function generateUsername(name) {
    // Convert to lowercase, remove special chars, replace spaces with dots
    return name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '.');
}

// Check if username already exists
function isUsernameExists(username, type) {
    const key = type === 'student' ? 'gs_students' : 'gs_teachers';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    return existing.some(item => item.username === username);
}

// Generate unique username
function generateUniqueUsername(name, type) {
    let username = generateUsername(name);
    let counter = 1;
    
    while (isUsernameExists(username, type)) {
        username = generateUsername(name) + counter;
        counter++;
    }
    
    return username;
}

// Approve student registration
async function approveStudentRegistration(registrationId) {
    const pending = getPendingRegistrations();
    const registration = pending.find(r => r.id === registrationId);
    
    if (!registration || registration.type !== 'student') {
        return { success: false, error: 'Registration not found' };
    }
    
    // Generate credentials
    const studentId = generateFinalId('student');
    const username = generateUniqueUsername(registration.data.name, 'student');
    const password = 'Dnya@2026';
    
    // Create student object
    const student = {
        id: studentId,
        username,
        password,
        name: registration.data.name,
        fatherName: registration.data.fatherName,
        class: registration.data.class,
        stream: registration.data.stream || '',
        medium: registration.data.medium,
        phone: registration.data.phone,
        parentPhone: registration.data.parentPhone,
        parentName: registration.data.parentName,
        address: registration.data.address,
        admDate: registration.data.admissionDate,
        feeAmount: 0,
        feePaid: 0,
        feeStatus: 'pending',
        whatsappOptOut: false,
        registrationSource: 'self',
        approvalDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    // Add to students
    const students = JSON.parse(localStorage.getItem('gs_students') || '[]');
    students.push(student);
    localStorage.setItem('gs_students', JSON.stringify(students));
    
    // Update registration status
    registration.status = 'approved';
    registration.approvedAt = new Date().toISOString();
    registration.approvedBy = currentSession.name;
    registration.credentials = { studentId, username, password };
    savePendingRegistrations(pending);
    
    // Send WhatsApp notification with credentials
    await sendApprovalNotification(registration, student);
    
    // Sync to Google Sheets if configured
    await syncToGoogleSheets('Students', students);
    
    return { success: true, student, credentials: { username, password } };
}

// Approve teacher registration
async function approveTeacherRegistration(registrationId) {
    const pending = getPendingRegistrations();
    const registration = pending.find(r => r.id === registrationId);
    
    if (!registration || registration.type !== 'teacher') {
        return { success: false, error: 'Registration not found' };
    }
    
    // Generate credentials
    const teacherId = generateFinalId('teacher');
    const username = generateUniqueUsername(registration.data.name, 'teacher');
    const password = 'Teach@2026';
    
    // Create teacher object
    const teacher = {
        id: teacherId,
        username,
        password,
        name: registration.data.name,
        phone: registration.data.phone,
        subject: registration.data.subject,
        qualification: registration.data.qualification || '',
        experience: registration.data.experience || 0,
        assignedClasses: registration.data.assignedClasses || [],
        address: registration.data.address || '',
        registrationSource: 'self',
        approvalDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    // Add to teachers
    const teachers = JSON.parse(localStorage.getItem('gs_teachers') || '[]');
    teachers.push(teacher);
    localStorage.setItem('gs_teachers', JSON.stringify(teachers));
    
    // Update registration status
    registration.status = 'approved';
    registration.approvedAt = new Date().toISOString();
    registration.approvedBy = currentSession.name;
    registration.credentials = { teacherId, username, password };
    savePendingRegistrations(pending);
    
    // Send WhatsApp notification with credentials
    await sendApprovalNotification(registration, teacher);
    
    // Sync to Google Sheets if configured
    await syncToGoogleSheets('Teachers', teachers);
    
    return { success: true, teacher, credentials: { username, password } };
}

// Reject registration
function rejectRegistration(registrationId, reason) {
    const pending = getPendingRegistrations();
    const registration = pending.find(r => r.id === registrationId);
    
    if (!registration) {
        return { success: false, error: 'Registration not found' };
    }
    
    registration.status = 'rejected';
    registration.rejectedAt = new Date().toISOString();
    registration.rejectedBy = currentSession.name;
    registration.rejectionReason = reason;
    savePendingRegistrations(pending);
    
    return { success: true };
}

// Send approval notification via WhatsApp
async function sendApprovalNotification(registration, user) {
    const config = getWhatsAppConfig();
    
    if (!config.enabled || !config.webhookUrl) {
        console.log('WhatsApp notifications disabled - credentials not sent');
        return { success: false, error: 'WhatsApp not configured' };
    }
    
    const isStudent = registration.type === 'student';
    const phone = isStudent ? registration.data.parentPhone : registration.data.phone;
    const normalizedPhone = normalizeWhatsAppPhone(phone);
    
    if (!normalizedPhone) {
        console.log('Invalid phone number - credentials not sent');
        return { success: false, error: 'Invalid phone number' };
    }
    
    const credentials = registration.credentials;
    const message = isStudent
        ? `Welcome to Dnyansindhu Classes, ${registration.data.name}!\n\n` +
          `Your registration has been approved.\n\n` +
          `Login Details:\n` +
          `Student ID: ${credentials.studentId}\n` +
          `Username: ${credentials.username}\n` +
          `Password: ${credentials.password}\n\n` +
          `Login at: https://dnyansindhu.in/app.html\n\n` +
          `Please change your password after first login.\n\n` +
          `ज्ञानसिंधू क्लासेस, नेरळ`
        : `Welcome to Dnyansindhu Classes, ${registration.data.name}!\n\n` +
          `Your teacher registration has been approved.\n\n` +
          `Login Details:\n` +
          `Teacher ID: ${credentials.teacherId}\n` +
          `Username: ${credentials.username}\n` +
          `Password: ${credentials.password}\n\n` +
          `Login at: https://dnyansindhu.in/app.html\n\n` +
          `Please change your password after first login.\n\n` +
          `ज्ञानसिंधू क्लासेस, नेरळ`;
    
    // For now, just use WhatsApp web link (template would need approval)
    console.log('Approval notification:', {
        phone: normalizedPhone,
        message
    });
    
    // TODO: Implement actual WhatsApp API call when credentials template is approved
    // For now, admin should manually send credentials via WhatsApp
    
    return { success: true, message: 'Notification logged - send credentials manually via WhatsApp' };
}

// Render pending registrations page
function renderPendingRegistrations() {
    document.getElementById('pageTitle').textContent = 'Pending Registrations';
    
    const pending = getPendingRegistrations().filter(r => r.status === 'pending');
    const students = pending.filter(r => r.type === 'student');
    const teachers = pending.filter(r => r.type === 'teacher');
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="glass-card p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold gold-accent">
                    <i class="fas fa-user-clock mr-2"></i>Pending Registrations (${pending.length})
                </h3>
                <a href="registration.html" target="_blank" class="btn-gold">
                    <i class="fas fa-external-link-alt mr-2"></i>Open Registration Page
                </a>
            </div>
            
            ${pending.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No pending registrations</p>
                    <p class="text-sm mt-2">Share registration.html link with students and teachers</p>
                </div>
            ` : `
                <!-- Student Registrations -->
                ${students.length > 0 ? `
                    <div class="mb-6">
                        <h4 class="text-lg font-bold mb-3">
                            <i class="fas fa-user-graduate mr-2 gold-accent"></i>
                            Student Registrations (${students.length})
                        </h4>
                        <div class="space-y-4">
                            ${students.map(reg => renderRegistrationCard(reg)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Teacher Registrations -->
                ${teachers.length > 0 ? `
                    <div>
                        <h4 class="text-lg font-bold mb-3">
                            <i class="fas fa-chalkboard-teacher mr-2 gold-accent"></i>
                            Teacher Registrations (${teachers.length})
                        </h4>
                        <div class="space-y-4">
                            ${teachers.map(reg => renderRegistrationCard(reg)).join('')}
                        </div>
                    </div>
                ` : ''}
            `}
        </div>
        
        <!-- History -->
        <div class="glass-card p-6">
            <h3 class="text-xl font-bold gold-accent mb-4">
                <i class="fas fa-history mr-2"></i>Registration History
            </h3>
            ${renderRegistrationHistory()}
        </div>
    `;
}

// Render registration card
function renderRegistrationCard(registration) {
    const isStudent = registration.type === 'student';
    const data = registration.data;
    const submittedAgo = getTimeAgo(registration.submittedAt);
    
    return `
        <div class="glass-card p-4 border-l-4 border-yellow-500">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h5 class="text-lg font-bold">${escapeHtml(data.name)}</h5>
                    <p class="text-sm text-gray-400">
                        <i class="fas fa-clock mr-1"></i>Submitted ${submittedAgo}
                    </p>
                </div>
                <span class="badge badge-pending">
                    <i class="fas fa-hourglass-half mr-1"></i>Pending
                </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                ${isStudent ? `
                    <div><strong>Father's Name:</strong> ${escapeHtml(data.fatherName)}</div>
                    <div><strong>Class:</strong> ${escapeHtml(data.class)} ${data.stream ? `(${escapeHtml(data.stream)})` : ''}</div>
                    <div><strong>Medium:</strong> ${escapeHtml(data.medium)}</div>
                    <div><strong>Student Phone:</strong> ${escapeHtml(data.phone)}</div>
                    <div><strong>Parent Phone:</strong> ${escapeHtml(data.parentPhone)}</div>
                    <div><strong>Parent Name:</strong> ${escapeHtml(data.parentName)}</div>
                ` : `
                    <div><strong>Phone:</strong> ${escapeHtml(data.phone)}</div>
                    <div><strong>Subject:</strong> ${escapeHtml(data.subject)}</div>
                    <div><strong>Qualification:</strong> ${escapeHtml(data.qualification || 'Not provided')}</div>
                    <div><strong>Experience:</strong> ${escapeHtml(data.experience || 0)} years</div>
                    <div><strong>Classes:</strong> ${data.assignedClasses.join(', ')}</div>
                `}
            </div>
            
            <div class="flex gap-2">
                <button onclick="viewRegistrationDetails('${registration.id}')" class="btn-gold flex-1">
                    <i class="fas fa-eye mr-2"></i>View Details
                </button>
                <button onclick="approveRegistration('${registration.id}')" class="btn-gold flex-1" style="background: #10b981;">
                    <i class="fas fa-check mr-2"></i>Approve
                </button>
                <button onclick="rejectRegistration('${registration.id}')" class="btn-gold flex-1" style="background: #ef4444;">
                    <i class="fas fa-times mr-2"></i>Reject
                </button>
            </div>
        </div>
    `;
}

// Render registration history
function renderRegistrationHistory() {
    const history = getPendingRegistrations()
        .filter(r => r.status !== 'pending')
        .sort((a, b) => new Date(b.approvedAt || b.rejectedAt) - new Date(a.approvedAt || a.rejectedAt))
        .slice(0, 10);
    
    if (history.length === 0) {
        return '<p class="text-gray-400 text-sm">No history yet</p>';
    }
    
    return `
        <table class="w-full text-sm">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>By</th>
                </tr>
            </thead>
            <tbody>
                ${history.map(reg => `
                    <tr>
                        <td>${escapeHtml(reg.data.name)}</td>
                        <td>${reg.type === 'student' ? 'Student' : 'Teacher'}</td>
                        <td>
                            ${reg.status === 'approved'
                                ? '<span class="badge badge-paid">Approved</span>'
                                : '<span class="badge-pending">Rejected</span>'}
                        </td>
                        <td>${new Date(reg.approvedAt || reg.rejectedAt).toLocaleDateString('en-IN')}</td>
                        <td>${escapeHtml(reg.approvedBy || reg.rejectedBy)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Get time ago string
function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// View registration details modal
function viewRegistrationDetails(registrationId) {
    const registration = getPendingRegistrations().find(r => r.id === registrationId);
    if (!registration) return;
    
    const isStudent = registration.type === 'student';
    const data = registration.data;
    
    const modal = createModal(
        'Registration Details',
        `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Type:</strong><br>
                        ${registration.type === 'student' ? 'Student' : 'Teacher'}
                    </div>
                    <div>
                        <strong>Submitted:</strong><br>
                        ${new Date(registration.submittedAt).toLocaleString('en-IN')}
                    </div>
                </div>
                
                <hr style="border-color: rgba(255,255,255,0.1);">
                
                <div>
                    <strong class="gold-accent">Full Name:</strong>
                    <p>${escapeHtml(data.name)}</p>
                </div>
                
                ${isStudent ? `
                    <div>
                        <strong class="gold-accent">Father's Name:</strong>
                        <p>${escapeHtml(data.fatherName)}</p>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <strong class="gold-accent">Class:</strong>
                            <p>${escapeHtml(data.class)}</p>
                        </div>
                        <div>
                            <strong class="gold-accent">Stream:</strong>
                            <p>${escapeHtml(data.stream || 'N/A')}</p>
                        </div>
                        <div>
                            <strong class="gold-accent">Medium:</strong>
                            <p>${escapeHtml(data.medium)}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <strong class="gold-accent">Student Phone:</strong>
                            <p>${escapeHtml(data.phone)}</p>
                        </div>
                        <div>
                            <strong class="gold-accent">Parent Phone:</strong>
                            <p>${escapeHtml(data.parentPhone)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <strong class="gold-accent">Parent Name:</strong>
                        <p>${escapeHtml(data.parentName)}</p>
                    </div>
                    
                    <div>
                        <strong class="gold-accent">Address:</strong>
                        <p>${escapeHtml(data.address)}</p>
                    </div>
                    
                    <div>
                        <strong class="gold-accent">Admission Date:</strong>
                        <p>${new Date(data.admissionDate).toLocaleDateString('en-IN')}</p>
                    </div>
                ` : `
                    <div>
                        <strong class="gold-accent">Phone:</strong>
                        <p>${escapeHtml(data.phone)}</p>
                    </div>
                    
                    <div>
                        <strong class="gold-accent">Subject:</strong>
                        <p>${escapeHtml(data.subject)}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <strong class="gold-accent">Qualification:</strong>
                            <p>${escapeHtml(data.qualification || 'Not provided')}</p>
                        </div>
                        <div>
                            <strong class="gold-accent">Experience:</strong>
                            <p>${escapeHtml(data.experience || 0)} years</p>
                        </div>
                    </div>
                    
                    <div>
                        <strong class="gold-accent">Assigned Classes:</strong>
                        <p>${data.assignedClasses.join(', ')}</p>
                    </div>
                    
                    ${data.address ? `
                        <div>
                            <strong class="gold-accent">Address:</strong>
                            <p>${escapeHtml(data.address)}</p>
                        </div>
                    ` : ''}
                `}
                
                <hr style="border-color: rgba(255,255,255,0.1);">
                
                <div class="flex gap-2">
                    <button onclick="closeModal(); approveRegistration('${registration.id}')" class="btn-gold flex-1" style="background: #10b981;">
                        <i class="fas fa-check mr-2"></i>Approve
                    </button>
                    <button onclick="closeModal(); rejectRegistration('${registration.id}')" class="btn-gold flex-1" style="background: #ef4444;">
                        <i class="fas fa-times mr-2"></i>Reject
                    </button>
                </div>
            </div>
        `
    );
    
    modal.classList.add('active');
}

// Approve registration button handler
async function approveRegistration(registrationId) {
    if (!confirm('Are you sure you want to approve this registration?')) return;
    
    const registration = getPendingRegistrations().find(r => r.id === registrationId);
    if (!registration) return;
    
    showLoading();
    
    const result = registration.type === 'student'
        ? await approveStudentRegistration(registrationId)
        : await approveTeacherRegistration(registrationId);
    
    hideLoading();
    
    if (result.success) {
        showToast(`Registration approved! Credentials: ${result.credentials.username} / ${result.credentials.password}`, 'success');
        renderPendingRegistrations();
    } else {
        showToast('Failed to approve: ' + result.error, 'error');
    }
}

// Reject registration button handler
function rejectRegistration(registrationId) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    const result = rejectRegistration(registrationId, reason || 'No reason provided');
    
    if (result.success) {
        showToast('Registration rejected', 'success');
        renderPendingRegistrations();
    } else {
        showToast('Failed to reject: ' + result.error, 'error');
    }
}
