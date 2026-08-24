// Reports Fix - Add this to app.html before </body>
// Includes: Pie charts, proper PDF generation, improved UI

// Add these libraries in <head>:
// <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

let currentReportData = null;
let attendanceChartInstance = null;
let subjectChartInstance = null;
let classChartInstance = null;

// Replace renderAdminReports function
function renderAdminReports() {
    document.getElementById('pageTitle').textContent = 'Student Progress Reports';
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="glass-card p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 gold-accent">Generate Student Reports</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="glass-card p-4">
                    <h4 class="font-bold mb-3"><i class="fas fa-calendar-alt gold-accent mr-2"></i>Monthly Report</h4>
                    <div class="space-y-3">
                        <select id="monthlyStudent" class="w-full"><option value="">Select Student</option></select>
                        <input type="month" id="monthlyMonth" class="w-full">
                        <button onclick="generateMonthlyReport()" class="btn-gold w-full">
                            <i class="fas fa-file-pdf mr-2"></i>Generate Report
                        </button>
                    </div>
                </div>
                
                <div class="glass-card p-4">
                    <h4 class="font-bold mb-3"><i class="fas fa-calendar gold-accent mr-2"></i>Yearly Report</h4>
                    <div class="space-y-3">
                        <select id="yearlyStudent" class="w-full"><option value="">Select Student</option></select>
                        <select id="yearlyYear" class="w-full">
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026" selected>2026</option>
                            <option value="2027">2027</option>
                        </select>
                        <button onclick="generateYearlyReport()" class="btn-gold w-full">
                            <i class="fas fa-file-pdf mr-2"></i>Generate Report
                        </button>
                    </div>
                </div>
                
                <div class="glass-card p-4">
                    <h4 class="font-bold mb-3"><i class="fas fa-users gold-accent mr-2"></i>Class Report</h4>
                    <div class="space-y-3">
                        <select id="classReport" class="w-full">
                            <option value="">Select Class</option>
                            <option value="8">Class 8</option>
                            <option value="9">Class 9</option>
                            <option value="10">Class 10</option>
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                        </select>
                        <input type="month" id="classReportMonth" class="w-full">
                        <button onclick="generateClassReport()" class="btn-gold w-full">
                            <i class="fas fa-file-pdf mr-2"></i>Generate Report
                        </button>
                    </div>
                </div>
                
                <div class="glass-card p-4">
                    <h4 class="font-bold mb-3"><i class="fas fa-paper-plane gold-accent mr-2"></i>Send via WhatsApp</h4>
                    <div class="space-y-3">
                        <select id="whatsappStudent" class="w-full"><option value="">Select Student</option></select>
                        <select id="whatsappReportType" class="w-full">
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <button onclick="sendReportViaWhatsApp()" class="btn-gold w-full">
                            <i class="fab fa-whatsapp mr-2"></i>Send Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="reportPreview" class="glass-card p-6 hidden">
            <div class="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 class="text-xl font-bold gold-accent">Report Preview</h3>
                <div class="flex flex-wrap gap-2">
                    <button onclick="downloadReportPDF()" class="btn-gold">
                        <i class="fas fa-download mr-2"></i>Download PDF
                    </button>
                    <button onclick="printReport()" class="btn-gold">
                        <i class="fas fa-print mr-2"></i>Print
                    </button>
                    <button onclick="closeReportPreview()" class="btn-gold">
                        <i class="fas fa-times mr-2"></i>Close
                    </button>
                </div>
            </div>
            <div id="reportContent" class="bg-white text-black p-8 rounded"></div>
        </div>
    `;
    
    const students = JSON.parse(localStorage.getItem('gs_students') || '[]');
    const options = students.map(s => `<option value="${s.id}">${s.name} (${s.class})</option>`).join('');
    
    document.getElementById('monthlyStudent').innerHTML += options;
    document.getElementById('yearlyStudent').innerHTML += options;
    document.getElementById('whatsappStudent').innerHTML += options;
    
    const now = new Date();
    document.getElementById('monthlyMonth').value = now.toISOString().slice(0, 7);
    document.getElementById('classReportMonth').value = now.toISOString().slice(0, 7);
}

function generateMonthlyReport() {
    const studentId = document.getElementById('monthlyStudent').value;
    const month = document.getElementById('monthlyMonth').value;
    
    if (!studentId || !month) {
        showToast('Please select student and month', 'error');
        return;
    }
    
    const students = JSON.parse(localStorage.getItem('gs_students') || '[]');
    const student = students.find(s => s.id === studentId);
    const [year, monthNum] = month.split('-');
    
    const report = generateStudentReport(student, 'monthly', { year, month: monthNum });
    currentReportData = report;
    displayReport(report);
}

function generateYearlyReport() {
    const studentId = document.getElementById('yearlyStudent').value;
    const year = document.getElementById('yearlyYear').value;
    
    if (!studentId) {
        showToast('Please select student', 'error');
        return;
    }
    
    const students = JSON.parse(localStorage.getItem('gs_students') || '[]');
    const student = students.find(s => s.id === studentId);
    
    const report = generateStudentReport(student, 'yearly', { year });
    currentReportData = report;
    displayReport(report);
}

function generateClassReport() {
    const classValue = document.getElementById('classReport').value;
    const month = document.getElementById('classReportMonth').value;
    
    if (!classValue || !month) {
        showToast('Please select class and period', 'error');
        return;
    }
    
    const allStudents = JSON.parse(localStorage.getItem('gs_students') || '[]');
    const students = allStudents.filter(s => s.class === classValue);
    const [year, monthNum] = month.split('-');
    
    const report = generateClassProgressReport(students, classValue, { year, month: monthNum });
    currentReportData = report;
    displayReport(report);
}

function generateStudentReport(student, type, period) {
    const attendance = JSON.parse(localStorage.getItem('gs_attendance') || '[]');
    const marks = JSON.parse(localStorage.getItem('gs_marks') || '[]');
    
    let filteredAttendance = attendance.filter(a => {
        const aDate = new Date(a.date);
        if (type === 'monthly') {
            return aDate.getFullYear() == period.year && 
                   (aDate.getMonth() + 1) == period.month &&
                   a.class === student.class;
        }
        return aDate.getFullYear() == period.year && a.class === student.class;
    });
    
    let filteredMarks = marks.filter(m => {
        const mDate = new Date(m.date);
        if (type === 'monthly') {
            return mDate.getFullYear() == period.year && 
                   (mDate.getMonth() + 1) == period.month &&
                   m.class === student.class;
        }
        return mDate.getFullYear() == period.year && m.class === student.class;
    });
    
    let totalDays = 0, presentDays = 0;
    filteredAttendance.forEach(a => {
        const record = a.records.find(r => r.studentId === student.id);
        if (record) {
            totalDays++;
            if (record.present) presentDays++;
        }
    });
    
    const subjectMap = {};
    let totalMarks = 0, obtainedMarks = 0;
    
    filteredMarks.forEach(m => {
        const record = m.records.find(r => r.studentId === student.id);
        if (record) {
            if (!subjectMap[m.subject]) {
                subjectMap[m.subject] = { total: 0, obtained: 0 };
            }
            subjectMap[m.subject].total += m.total;
            subjectMap[m.subject].obtained += record.marks;
            totalMarks += m.total;
            obtainedMarks += record.marks;
        }
    });
    
    const subjects = Object.keys(subjectMap).map(subject => ({
        subject,
        total: subjectMap[subject].total,
        obtained: subjectMap[subject].obtained,
        percentage: ((subjectMap[subject].obtained / subjectMap[subject].total) * 100).toFixed(2)
    }));
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return {
        type: 'student',
        title: type === 'monthly' ? 'Monthly Progress Report' : 'Yearly Progress Report',
        period: type === 'monthly' ? `${monthNames[period.month - 1]} ${period.year}` : `Academic Year ${period.year}`,
        student,
        attendance: {
            total: totalDays,
            present: presentDays,
            absent: totalDays - presentDays,
            percentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0
        },
        subjects,
        overall: {
            totalMarks,
            obtainedMarks,
            percentage: totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0
        }
    };
}

function generateClassProgressReport(students, classValue, period) {
    const marks = JSON.parse(localStorage.getItem('gs_marks') || '[]');
    const attendance = JSON.parse(localStorage.getItem('gs_attendance') || '[]');
    
    const filteredMarks = marks.filter(m => {
        const mDate = new Date(m.date);
        return mDate.getFullYear() == period.year && 
               (mDate.getMonth() + 1) == period.month &&
               m.class === classValue;
    });
    
    const studentStats = students.map(student => {
        let totalMarks = 0, obtainedMarks = 0;
        
        filteredMarks.forEach(m => {
            const record = m.records.find(r => r.studentId === student.id);
            if (record) {
                totalMarks += m.total;
                obtainedMarks += record.marks;
            }
        });
        
        return {
            name: student.name,
            totalMarks,
            obtainedMarks,
            percentage: totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0
        };
    }).sort((a, b) => b.percentage - a.percentage);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return {
        type: 'class',
        title: `Class ${classValue} Progress Report`,
        period: `${monthNames[period.month - 1]} ${period.year}`,
        students: studentStats,
        totalStudents: students.length
    };
}

function displayReport(report) {
    // Destroy previous chart instances
    if (attendanceChartInstance) { attendanceChartInstance.destroy(); attendanceChartInstance = null; }
    if (subjectChartInstance) { subjectChartInstance.destroy(); subjectChartInstance = null; }
    if (classChartInstance) { classChartInstance.destroy(); classChartInstance = null; }
    
    const content = document.getElementById('reportContent');
    
    if (report.type === 'class') {
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f5c518; font-size: 24px; font-weight: bold;">ज्ञानसिंधू क्लासेस</h1>
                <p style="color: #666;">Neral</p>
                <h2 style="font-size: 20px; margin-top: 16px;">${report.title}</h2>
                <p style="color: #666;">${report.period}</p>
            </div>
            
            <div style="margin-bottom: 24px; text-align: center;">
                <h3 style="color: #f5c518; margin-bottom: 12px;">Performance Distribution</h3>
                <canvas id="classChart" width="400" height="200"></canvas>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f5c518;">
                    <tr>
                        <th style="padding: 12px; border: 1px solid #ccc;">Rank</th>
                        <th style="padding: 12px; border: 1px solid #ccc;">Name</th>
                        <th style="padding: 12px; border: 1px solid #ccc;">Total</th>
                        <th style="padding: 12px; border: 1px solid #ccc;">Obtained</th>
                        <th style="padding: 12px; border: 1px solid #ccc;">%</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.students.map((s, i) => `
                        <tr style="${i % 2 ? 'background: #f9f9f9;' : ''}">
                            <td style="padding: 12px; border: 1px solid #ccc; text-align: center;">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #ccc;">${s.name}</td>
                            <td style="padding: 12px; border: 1px solid #ccc; text-align: center;">${s.totalMarks}</td>
                            <td style="padding: 12px; border: 1px solid #ccc; text-align: center;">${s.obtainedMarks}</td>
                            <td style="padding: 12px; border: 1px solid #ccc; text-align: center; font-weight: bold;">${s.percentage}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 32px; text-align: center; color: #666; font-size: 12px;">
                <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
        `;
        
        setTimeout(() => {
            const excellent = report.students.filter(s => parseFloat(s.percentage) >= 90).length;
            const good = report.students.filter(s => parseFloat(s.percentage) >= 75 && parseFloat(s.percentage) < 90).length;
            const average = report.students.filter(s => parseFloat(s.percentage) >= 60 && parseFloat(s.percentage) < 75).length;
            const poor = report.students.filter(s => parseFloat(s.percentage) < 60).length;
            
            const ctx = document.getElementById('classChart').getContext('2d');
            classChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Excellent (90%+)', 'Good (75-89%)', 'Average (60-74%)', 'Poor (<60%)'],
                    datasets: [{
                        data: [excellent, good, average, poor],
                        backgroundColor: ['#22c55e', '#3b82f6', '#f5c518', '#ef4444']
                    }]
                }
            });
        }, 100);
    } else {
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f5c518; font-size: 24px; font-weight: bold;">ज्ञानसिंधू क्लासेस</h1>
                <p style="color: #666;">Neral</p>
                <h2 style="font-size: 20px; margin-top: 16px;">${report.title}</h2>
                <p style="color: #666;">${report.period}</p>
            </div>
            
            <div style="margin-bottom: 24px; padding: 16px; background: #f5f5f5;">
                <h3 style="color: #f5c518; margin-bottom: 8px;">Student Info</h3>
                <p><strong>Name:</strong> ${report.student.name} | <strong>Class:</strong> ${report.student.class}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="color: #f5c518; margin-bottom: 12px;">Attendance</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <canvas id="attendanceChart" width="300" height="300"></canvas>
                    <div>
                        <p><strong>Total:</strong> ${report.attendance.total}</p>
                        <p><strong>Present:</strong> ${report.attendance.present}</p>
                        <p><strong>Absent:</strong> ${report.attendance.absent}</p>
                        <p style="font-size: 24px; font-weight: bold; color: #f5c518;">${report.attendance.percentage}%</p>
                    </div>
                </div>
            </div>
            
            ${report.subjects.length > 0 ? `
                <div style="margin-bottom: 24px;">
                    <h3 style="color: #f5c518; margin-bottom: 12px;">Academic Performance</h3>
                    <canvas id="subjectChart" width="400" height="200"></canvas>
                    
                    ${report.subjects.map(s => `
                        <div style="margin-top: 16px; padding: 12px; background: #f9f9f9; border-left: 4px solid #f5c518;">
                            <strong>${s.subject}:</strong> ${s.obtained}/${s.total} (${s.percentage}%)
                        </div>
                    `).join('')}
                    
                    <div style="margin-top: 16px; padding: 16px; background: #f5c518; text-align: center;">
                        <strong>Overall: ${report.overall.obtainedMarks}/${report.overall.totalMarks} (${report.overall.percentage}%)</strong>
                    </div>
                </div>
            ` : '<p style="padding: 24px; text-align: center; color: #999;">No marks data available</p>'}
            
            <div style="margin-top: 32px; text-align: center; color: #666; font-size: 12px;">
                <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
        `;
        
        setTimeout(() => {
            const ctx1 = document.getElementById('attendanceChart').getContext('2d');
            attendanceChartInstance = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Present', 'Absent'],
                    datasets: [{
                        data: [report.attendance.present, report.attendance.absent],
                        backgroundColor: ['#22c55e', '#ef4444']
                    }]
                }
            });
            
            if (report.subjects.length > 0) {
                const ctx2 = document.getElementById('subjectChart').getContext('2d');
                subjectChartInstance = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: report.subjects.map(s => s.subject),
                        datasets: [{
                            label: 'Percentage',
                            data: report.subjects.map(s => parseFloat(s.percentage)),
                            backgroundColor: '#f5c518'
                        }]
                    },
                    options: {
                        scales: {
                            y: { beginAtZero: true, max: 100 }
                        }
                    }
                });
            }
        }, 100);
    }
    
    document.getElementById('reportPreview').classList.remove('hidden');
    document.getElementById('reportPreview').scrollIntoView({ behavior: 'smooth' });
}

function downloadReportPDF() {
    if (!currentReportData) return;
    
    showToast('Generating PDF...', 'info');
    
    const element = document.getElementById('reportContent');
    const opt = {
        margin: 10,
        filename: `Report_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        showToast('PDF downloaded!', 'success');
    });
}

function printReport() {
    window.print();
}

function closeReportPreview() {
    document.getElementById('reportPreview').classList.add('hidden');
    currentReportData = null;
}

function sendReportViaWhatsApp() {
    const studentId = document.getElementById('whatsappStudent').value;
    if (!studentId) {
        showToast('Select student', 'error');
        return;
    }
    
    const student = JSON.parse(localStorage.getItem('gs_students') || '[]').find(s => s.id === studentId);
    const phone = student.parentPhone || student.phone;
    const message = `Report for ${student.name} is ready. Visit portal for details.`;
    
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
    showToast('WhatsApp opened', 'success');
}
